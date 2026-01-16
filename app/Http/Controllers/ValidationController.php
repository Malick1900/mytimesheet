<?php

namespace App\Http\Controllers;

use App\Models\TimeEntry;
use App\Models\Subsidiary;
use App\Models\Service;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class ValidationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $user->load('roles');
        $userRoles = $user->roles->pluck('name')->toArray();
        
        if (!in_array('MANAGER', $userRoles) && !in_array('ADMIN', $userRoles)) {
            abort(403);
        }

        // Filtre par statut (par défaut SUBMITTED)
        $status = $request->get('status', 'SUBMITTED');

        // Récupérer les employés avec des entrées selon le statut filtré
        $query = Employee::with(['subsidiaries', 'services'])
            ->whereHas('timeEntries', function ($q) use ($status) {
                if ($status !== 'ALL') {
                    $q->where('status', $status);
                } else {
                    $q->whereIn('status', ['SUBMITTED', 'APPROVED', 'REJECTED']);
                }
            });

        if (!in_array('ADMIN', $userRoles)) {
            // Manager: voir les employés qui sont dans ses services
            $managerEmployee = $user->employee;
            if ($managerEmployee) {
                $managerServiceIds = $managerEmployee->services()->pluck('services.id')->toArray();

                $query->whereHas('services', function ($sq) use ($managerServiceIds) {
                    $sq->whereIn('services.id', $managerServiceIds);
                });
            }
        }

        // Compter les entrées selon le statut filtré
        $employees = $query->withCount(['timeEntries as entries_count' => function ($q) use ($status) {
            if ($status !== 'ALL') {
                $q->where('status', $status);
            } else {
                $q->whereIn('status', ['SUBMITTED', 'APPROVED', 'REJECTED']);
            }
        }])->orderBy('last_name')->orderBy('first_name')->paginate(10)->withQueryString();

        $subsidiaries = in_array('ADMIN', $userRoles)
            ? Subsidiary::where('is_active', true)->get()
            : ($user->employee ? $user->employee->subsidiaries : collect());

        $services = in_array('ADMIN', $userRoles)
            ? Service::where('is_active', true)->get()
            : ($user->employee ? $user->employee->services : collect());

        return Inertia::render('Validation/Index', [
            'employees' => $employees,
            'subsidiaries' => $subsidiaries,
            'services' => $services,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    public function show(Request $request, Employee $employee)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name')->toArray();
        
        if (!in_array('MANAGER', $userRoles) && !in_array('ADMIN', $userRoles)) {
            abort(403);
        }

        // Vérifier que le manager a accès à cet employé (via services partagés)
        if (!in_array('ADMIN', $userRoles)) {
            $managerEmployee = $user->employee;
            if ($managerEmployee) {
                $managerServiceIds = $managerEmployee->services()->pluck('services.id')->toArray();
                $employeeServiceIds = $employee->services()->pluck('services.id')->toArray();

                $sharedServices = array_intersect($managerServiceIds, $employeeServiceIds);

                if (empty($sharedServices)) {
                    abort(403);
                }
            }
        }

        $month = $request->get('month', now()->format('Y-m'));
        [$year, $monthNum] = explode('-', $month);
        
        $startDate = Carbon::createFromDate($year, $monthNum, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $entries = TimeEntry::with('subsidiary')
            ->where('employee_id', $employee->id)
            ->whereBetween('work_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('work_date')
            ->get();

        return Inertia::render('Validation/Show', [
            'employee' => $employee->load(['subsidiaries', 'services']),
            'entries' => $entries,
            'currentMonth' => $month,
        ]);
    }

    public function approve(TimeEntry $timeEntry)
    {
        $this->authorizeValidation($timeEntry);

        $timeEntry->update([
            'status' => 'APPROVED',
            'approved_at' => now(),
            'approved_by' => Auth::id(),
        ]);

        // Notifier l'employé
        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->notifyTaskApproved($timeEntry->employee, [$timeEntry->id], Auth::user());
        } catch (\Exception $e) {
            \Log::error('Failed to send approval notification: ' . $e->getMessage());
        }

        return back()->with('success', 'Entrée validée.');
    }

    public function reject(Request $request, TimeEntry $timeEntry)
    {
        $this->authorizeValidation($timeEntry);

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $timeEntry->update([
            'status' => 'REJECTED',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        // Notifier l'employé
        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->notifyTaskRejected($timeEntry->employee, $timeEntry, Auth::user(), $validated['rejection_reason']);
        } catch (\Exception $e) {
            \Log::error('Failed to send rejection notification: ' . $e->getMessage());
        }

        return back()->with('success', 'Entrée rejetée.');
    }

    public function bulkApprove(Request $request)
    {
        $user = Auth::user();
        $user->load('roles');
        $userRoles = $user->roles->pluck('name')->toArray();

        $ids = $request->get('ids', []);

        if (empty($ids)) {
            return back()->with('error', 'Aucune entrée à valider.');
        }

        $query = TimeEntry::whereIn('id', $ids)
            ->where('status', 'SUBMITTED');

        if (!in_array('ADMIN', $userRoles)) {
            // Manager: vérifier via les services partagés
            $managerEmployee = $user->employee;
            if ($managerEmployee) {
                $managerServiceIds = $managerEmployee->services()->pluck('services.id')->toArray();

                // Filtrer les entrées où l'employé est dans les services du manager
                $query->whereHas('employee', function ($q) use ($managerServiceIds) {
                    $q->whereHas('services', function ($sq) use ($managerServiceIds) {
                        $sq->whereIn('services.id', $managerServiceIds);
                    });
                });
            }
        }

        // Récupérer les entrées groupées par employé avant la mise à jour
        $entriesByEmployee = $query->with('employee')->get()->groupBy('employee_id');
        
        $count = $query->count();
        
        $query->update([
            'status' => 'APPROVED',
            'approved_at' => now(),
            'approved_by' => Auth::id(),
        ]);

        // Notifier chaque employé concerné
        try {
            $notificationService = app(\App\Services\NotificationService::class);
            foreach ($entriesByEmployee as $employeeId => $entries) {
                $employee = $entries->first()->employee;
                $entryIds = $entries->pluck('id')->toArray();
                $notificationService->notifyTaskApproved($employee, $entryIds, $user);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send bulk approval notifications: ' . $e->getMessage());
        }

        return back()->with('success', $count . ' entrée(s) validée(s).');
    }

    private function authorizeValidation(TimeEntry $timeEntry)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name')->toArray();

        if (in_array('ADMIN', $userRoles)) {
            return;
        }

        if (in_array('MANAGER', $userRoles)) {
            $managerEmployee = $user->employee;
            if ($managerEmployee) {
                $managerServiceIds = $managerEmployee->services()->pluck('services.id')->toArray();
                $employeeServiceIds = $timeEntry->employee->services()->pluck('services.id')->toArray();
                
                $sharedServices = array_intersect($managerServiceIds, $employeeServiceIds);
                if (!empty($sharedServices)) {
                    return;
                }
            }
        }

        abort(403);
    }
}

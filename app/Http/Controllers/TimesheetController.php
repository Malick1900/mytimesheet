<?php

namespace App\Http\Controllers;

use App\Models\TimeEntry;
use App\Models\Subsidiary;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class TimesheetController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $user->load('roles'); // Charger les rôles pour éviter les problèmes de lazy loading
        
        // Get all active subsidiaries
        $allSubsidiaries = Subsidiary::where('is_active', true)->get();

        // Si l'utilisateur n'a pas d'employé, en créer un automatiquement
        if (!$user->employee_id) {
            $employee = \App\Models\Employee::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'employee_code' => 'EMP-' . strtoupper(substr(md5($user->id), 0, 6)),
                'first_name' => $user->name ?? explode('@', $user->email)[0],
                'last_name' => '',
                'email' => $user->email,
                'is_active' => true,
            ]);
            $user->update(['employee_id' => $employee->id]);
            $user->refresh();
        }

        $employee = $user->employee;

        if (!$employee) {
            return Inertia::render('Timesheet/Index', [
                'entries' => [],
                'subsidiaries' => $allSubsidiaries,
                'currentMonth' => now()->format('Y-m'),
            ]);
        }

        $month = $request->get('month', now()->format('Y-m'));
        [$year, $monthNum] = explode('-', $month);
        
        $startDate = Carbon::createFromDate($year, $monthNum, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $entries = TimeEntry::with(['subsidiary', 'service'])
            ->where('employee_id', $employee->id)
            ->whereBetween('work_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('work_date')
            ->get();

        $userRoles = $user->roles->pluck('name')->toArray();

        // Get all active services
        $allServices = Service::where('is_active', true)->get();

        return Inertia::render('Timesheet/Index', [
            'entries' => $entries,
            'subsidiaries' => $allSubsidiaries,
            'services' => $allServices,
            'currentMonth' => $month,
            'currentYear' => (int) $year,
            'userRoles' => $userRoles,
            'debug' => [
                'employee_id' => $employee->id,
                'entries_count' => $entries->count(),
                'user_id' => $user->id,
                'roles' => $userRoles,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $user->load('roles'); // Charger les rôles
        $employee = $user->employee;

        // Si pas d'employé lié, en créer un automatiquement
        if (!$employee) {
            $employee = \App\Models\Employee::create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'employee_code' => 'EMP-' . strtoupper(substr(md5($user->id), 0, 6)),
                'first_name' => $user->name ?? 'Utilisateur',
                'last_name' => '',
                'email' => $user->email,
                'is_active' => true,
            ]);
            $user->update(['employee_id' => $employee->id]);
        }

        $validated = $request->validate([
            'subsidiary_id' => 'required|uuid|exists:subsidiaries,id',
            'service_id' => 'nullable|uuid|exists:services,id',
            'work_date' => 'required|date',
            'hours' => 'required|integer|min:0|max:24',
            'minutes' => 'required|integer|min:0|max:59',
            'note' => 'nullable|string|max:1000',
            'requester' => 'nullable|string|max:255',
        ]);

        $totalMinutes = ($validated['hours'] * 60) + $validated['minutes'];

        if ($totalMinutes <= 0 || $totalMinutes > 1440) {
            return back()->withErrors(['minutes' => 'La durée doit être entre 1 minute et 24 heures.']);
        }

        // Vérifier si l'utilisateur est MANAGER ou ADMIN (auto-validation)
        $userRoles = $user->roles->pluck('name')->toArray();
        $isManagerOrAdmin = in_array('MANAGER', $userRoles) || in_array('ADMIN', $userRoles);

        // Permettre plusieurs entrées par jour (même filiale)
        TimeEntry::create([
            'employee_id' => $employee->id,
            'subsidiary_id' => $validated['subsidiary_id'],
            'service_id' => $validated['service_id'] ?? null,
            'work_date' => $validated['work_date'],
            'minutes' => $totalMinutes,
            'note' => $validated['note'],
            'requester' => $validated['requester'] ?? null,
            'status' => $isManagerOrAdmin ? 'APPROVED' : 'DRAFT',
            'approved_at' => $isManagerOrAdmin ? now() : null,
            'approved_by' => $isManagerOrAdmin ? $user->id : null,
        ]);

        $message = $isManagerOrAdmin ? 'Entrée créée et validée automatiquement.' : 'Entrée créée avec succès.';
        return back()->with('success', $message);
    }

    public function update(Request $request, TimeEntry $timeEntry)
    {
        $user = Auth::user();
        $user->load('roles'); // Charger les rôles

        if ($timeEntry->employee_id !== $user->employee?->id) {
            abort(403);
        }

        if (!in_array($timeEntry->status, ['DRAFT', 'REJECTED'])) {
            return back()->withErrors(['error' => 'Cette entrée ne peut plus être modifiée.']);
        }

        $validated = $request->validate([
            'subsidiary_id' => 'required|uuid|exists:subsidiaries,id',
            'service_id' => 'nullable|uuid|exists:services,id',
            'hours' => 'required|integer|min:0|max:24',
            'minutes' => 'required|integer|min:0|max:59',
            'note' => 'nullable|string|max:1000',
            'requester' => 'nullable|string|max:255',
        ]);

        $totalMinutes = ($validated['hours'] * 60) + $validated['minutes'];

        if ($totalMinutes <= 0 || $totalMinutes > 1440) {
            return back()->withErrors(['minutes' => 'La durée doit être entre 1 minute et 24 heures.']);
        }

        // Vérifier si l'utilisateur est MANAGER ou ADMIN (auto-validation)
        $userRoles = $user->roles->pluck('name')->toArray();
        $isManagerOrAdmin = in_array('MANAGER', $userRoles) || in_array('ADMIN', $userRoles);

        $timeEntry->update([
            'subsidiary_id' => $validated['subsidiary_id'],
            'service_id' => $validated['service_id'] ?? null,
            'minutes' => $totalMinutes,
            'note' => $validated['note'],
            'requester' => $validated['requester'] ?? null,
            'status' => $isManagerOrAdmin ? 'APPROVED' : 'DRAFT',
            'rejection_reason' => null,
            'approved_at' => $isManagerOrAdmin ? now() : null,
            'approved_by' => $isManagerOrAdmin ? $user->id : null,
        ]);

        $message = $isManagerOrAdmin ? 'Entrée mise à jour et validée automatiquement.' : 'Entrée mise à jour.';
        return back()->with('success', $message);
    }

    public function destroy(TimeEntry $timeEntry)
    {
        $user = Auth::user();

        if ($timeEntry->employee_id !== $user->employee?->id) {
            abort(403);
        }

        if ($timeEntry->status !== 'DRAFT') {
            return back()->withErrors(['error' => 'Seules les entrées en brouillon peuvent être supprimées.']);
        }

        $timeEntry->delete();

        return back()->with('success', 'Entrée supprimée.');
    }

    public function submit(Request $request)
    {
        $user = Auth::user();
        $employee = $user->employee;

        if (!$employee) {
            return back()->withErrors(['error' => 'Aucun employé associé.']);
        }

        $ids = $request->get('ids', []);

        $query = TimeEntry::where('employee_id', $employee->id)
            ->where('status', 'DRAFT');

        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        // Récupérer les IDs des entrées à soumettre
        $submittedIds = $query->pluck('id')->toArray();

        if (empty($submittedIds)) {
            return back()->withErrors(['error' => 'Aucune entrée à soumettre.']);
        }

        // Mettre à jour le statut
        TimeEntry::whereIn('id', $submittedIds)->update([
            'status' => 'SUBMITTED',
            'submitted_at' => now(),
        ]);

        // Envoyer les notifications aux managers et admins
        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->notifyTaskSubmitted($employee, $submittedIds);
        } catch (\Exception $e) {
            \Log::error('Failed to send notifications: ' . $e->getMessage());
        }

        return back()->with('success', 'Entrées soumises pour validation.');
    }
}

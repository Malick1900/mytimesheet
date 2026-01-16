<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Service;
use App\Models\Subsidiary;
use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EstimationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $user->load('roles');
        $userRoles = $user->roles->pluck('name')->toArray();

        $isManager = in_array('MANAGER', $userRoles);
        $isAdmin = in_array('ADMIN', $userRoles);

        if (!$isManager && !$isAdmin) {
            abort(403);
        }

        // Services gérés par le manager
        $managerServiceIds = $isAdmin
            ? Service::where('is_active', true)->pluck('id')
            : ($user->employee ? $user->employee->services()->pluck('services.id') : collect());

        // Employés dans les services gérés
        $managedEmployeeIds = $isAdmin
            ? Employee::where('is_active', true)->pluck('id')
            : Employee::whereHas('services', function ($q) use ($managerServiceIds) {
                $q->whereIn('services.id', $managerServiceIds);
            })->where('is_active', true)->pluck('id');

        // Récupérer les filiales avec des heures validées
        $subsidiariesWithHours = TimeEntry::query()
            ->select(
                'subsidiary_id',
                DB::raw('SUM(minutes) as total_minutes'),
                DB::raw('COUNT(DISTINCT employee_id) as employee_count')
            )
            ->whereIn('employee_id', $managedEmployeeIds)
            ->where('status', 'APPROVED')
            ->groupBy('subsidiary_id')
            ->get();

        $subsidiariesMap = Subsidiary::whereIn('id', $subsidiariesWithHours->pluck('subsidiary_id'))
            ->get()
            ->keyBy('id');

        $subsidiaries = $subsidiariesWithHours->map(function ($row) use ($subsidiariesMap) {
            $subsidiary = $subsidiariesMap[$row->subsidiary_id] ?? null;
            return [
                'id' => $row->subsidiary_id,
                'name' => $subsidiary?->name ?? 'Inconnu',
                'code' => $subsidiary?->code ?? '',
                'total_hours' => round($row->total_minutes / 60, 2),
                'employee_count' => $row->employee_count,
            ];
        })->sortBy('name')->values();

        // Si une filiale est sélectionnée, récupérer le détail par employé
        $selectedSubsidiaryId = $request->get('subsidiary_id');
        $subsidiaryData = null;

        if ($selectedSubsidiaryId) {
            $selectedSubsidiary = Subsidiary::find($selectedSubsidiaryId);
            
            if ($selectedSubsidiary) {
                // Heures validées par employé pour cette filiale
                $hoursByEmployee = TimeEntry::query()
                    ->select(
                        'employee_id',
                        DB::raw('SUM(minutes) as total_minutes')
                    )
                    ->whereIn('employee_id', $managedEmployeeIds)
                    ->where('subsidiary_id', $selectedSubsidiaryId)
                    ->where('status', 'APPROVED')
                    ->groupBy('employee_id')
                    ->get();

                $employeesMap = Employee::whereIn('id', $hoursByEmployee->pluck('employee_id'))
                    ->get()
                    ->keyBy('id');

                $hoursFormatted = $hoursByEmployee->map(function ($row) use ($employeesMap) {
                    $employee = $employeesMap[$row->employee_id] ?? null;
                    return [
                        'employee_id' => $row->employee_id,
                        'employee_name' => $employee ? "{$employee->last_name} {$employee->first_name}" : 'Inconnu',
                        'employee_code' => $employee?->employee_code ?? '',
                        'total_hours' => round($row->total_minutes / 60, 2),
                    ];
                })->sortBy('employee_name')->values();

                $totalHoursSubsidiary = $hoursFormatted->sum('total_hours');

                $subsidiaryData = [
                    'subsidiary' => $selectedSubsidiary,
                    'hours_by_employee' => $hoursFormatted,
                    'total_hours' => $totalHoursSubsidiary,
                    'employee_count' => $hoursFormatted->count(),
                ];
            }
        }

        return Inertia::render('Estimation/Index', [
            'subsidiaries' => $subsidiaries,
            'selectedSubsidiaryId' => $selectedSubsidiaryId,
            'subsidiaryData' => $subsidiaryData,
            'isAdmin' => $isAdmin,
        ]);
    }

    public function exportPDF(Request $request)
    {
        $subsidiaryId = $request->get('subsidiary_id');
        $rate = floatval($request->get('rate', 0));

        if (!$subsidiaryId) {
            abort(400, 'Subsidiary ID required');
        }

        $subsidiary = Subsidiary::find($subsidiaryId);
        if (!$subsidiary) {
            abort(404, 'Subsidiary not found');
        }

        $user = Auth::user();
        $user->load('roles');
        $userRoles = $user->roles->pluck('name')->toArray();
        $isAdmin = in_array('ADMIN', $userRoles);

        // Services gérés
        $managerServiceIds = $isAdmin
            ? Service::where('is_active', true)->pluck('id')
            : ($user->employee ? $user->employee->services()->pluck('services.id') : collect());

        $managedEmployeeIds = $isAdmin
            ? Employee::where('is_active', true)->pluck('id')
            : Employee::whereHas('services', function ($q) use ($managerServiceIds) {
                $q->whereIn('services.id', $managerServiceIds);
            })->where('is_active', true)->pluck('id');

        // Récupérer les heures validées par employé pour cette filiale
        $hoursByEmployee = TimeEntry::query()
            ->select(
                'employee_id',
                DB::raw('SUM(minutes) as total_minutes')
            )
            ->whereIn('employee_id', $managedEmployeeIds)
            ->where('subsidiary_id', $subsidiaryId)
            ->where('status', 'APPROVED')
            ->groupBy('employee_id')
            ->get();

        $employeesMap = Employee::whereIn('id', $hoursByEmployee->pluck('employee_id'))
            ->get()
            ->keyBy('id');

        $data = $hoursByEmployee->map(function ($row) use ($employeesMap, $rate) {
            $employee = $employeesMap[$row->employee_id] ?? null;
            $hours = round($row->total_minutes / 60, 2);
            return [
                'employee_name' => $employee ? "{$employee->last_name} {$employee->first_name}" : 'Inconnu',
                'employee_code' => $employee?->employee_code ?? '',
                'hours' => $hours,
                'rate' => $rate,
                'amount' => $hours * $rate,
            ];
        })->sortBy('employee_name')->values();

        $totalHours = $data->sum('hours');
        $totalAmount = $data->sum('amount');

        // Générer le HTML du PDF
        $html = view('pdf.estimation-subsidiary', [
            'subsidiary' => $subsidiary,
            'data' => $data,
            'rate' => $rate,
            'totalHours' => $totalHours,
            'totalAmount' => $totalAmount,
            'date' => now()->format('d/m/Y'),
        ])->render();

        // Retourner comme téléchargement HTML (pour impression PDF via navigateur)
        return response($html)
            ->header('Content-Type', 'text/html; charset=UTF-8');
    }
}

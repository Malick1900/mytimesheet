<?php

namespace App\Http\Controllers;

use App\Models\TimeEntry;
use App\Models\Subsidiary;
use App\Models\Employee;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportsController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $user->load('roles');
        $userRoles = $user->roles->pluck('name')->toArray();

        $isManager = in_array('MANAGER', $userRoles);
        $isAdmin = in_array('ADMIN', $userRoles);
        $isEmployee = !$isManager && !$isAdmin;

        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));

        // Pour les employés: afficher uniquement leurs propres données
        if ($isEmployee) {
            $employee = $user->employee;
            if (!$employee) {
                return Inertia::render('Reports/Index', [
                    'data' => [],
                    'subsidiaries' => [],
                    'employees' => [],
                    'filters' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'totals' => ['total_minutes' => 0, 'approved_minutes' => 0],
                    'chartData' => [],
                    'isEmployee' => true,
                ]);
            }

            // Données pour l'histogramme par filiale
            $chartData = TimeEntry::query()
                ->select(
                    'subsidiary_id',
                    DB::raw('SUM(minutes) as total_minutes'),
                    DB::raw("SUM(CASE WHEN status = 'APPROVED' THEN minutes ELSE 0 END) as approved_minutes"),
                    DB::raw("SUM(CASE WHEN status = 'SUBMITTED' THEN minutes ELSE 0 END) as submitted_minutes"),
                    DB::raw("SUM(CASE WHEN status = 'DRAFT' THEN minutes ELSE 0 END) as draft_minutes")
                )
                ->where('employee_id', $employee->id)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->groupBy('subsidiary_id')
                ->get();

            $subsidiariesMap = Subsidiary::whereIn('id', $chartData->pluck('subsidiary_id'))->get()->keyBy('id');

            // Récupérer les heures par service pour chaque filiale
            $servicesBySubsidiary = TimeEntry::query()
                ->select(
                    'subsidiary_id',
                    'service_id',
                    DB::raw('SUM(minutes) as total_minutes'),
                    DB::raw("SUM(CASE WHEN status = 'APPROVED' THEN minutes ELSE 0 END) as approved_minutes"),
                    DB::raw("SUM(CASE WHEN status = 'SUBMITTED' THEN minutes ELSE 0 END) as submitted_minutes"),
                    DB::raw("SUM(CASE WHEN status = 'DRAFT' THEN minutes ELSE 0 END) as draft_minutes")
                )
                ->where('employee_id', $employee->id)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->groupBy('subsidiary_id', 'service_id')
                ->get();

            $servicesMap = Service::whereIn('id', $servicesBySubsidiary->pluck('service_id')->filter())->get()->keyBy('id');

            // Grouper les services par filiale
            $servicesGrouped = $servicesBySubsidiary->groupBy('subsidiary_id')->map(function ($items) use ($servicesMap) {
                return $items->map(function ($row) use ($servicesMap) {
                    $service = $row->service_id ? ($servicesMap[$row->service_id] ?? null) : null;
                    return [
                        'service_id' => $row->service_id,
                        'service_name' => $service?->name ?? 'Sans service',
                        'total_hours' => round($row->total_minutes / 60, 2),
                        'approved_hours' => round($row->approved_minutes / 60, 2),
                        'submitted_hours' => round($row->submitted_minutes / 60, 2),
                        'draft_hours' => round($row->draft_minutes / 60, 2),
                    ];
                })->values();
            });

            $chartDataFormatted = $chartData->map(function ($row) use ($subsidiariesMap, $servicesGrouped) {
                $subsidiary = $subsidiariesMap[$row->subsidiary_id] ?? null;
                return [
                    'subsidiary_id' => $row->subsidiary_id,
                    'subsidiary_name' => $subsidiary?->name ?? 'Inconnu',
                    'total_hours' => round($row->total_minutes / 60, 2),
                    'approved_hours' => round($row->approved_minutes / 60, 2),
                    'submitted_hours' => round($row->submitted_minutes / 60, 2),
                    'draft_hours' => round($row->draft_minutes / 60, 2),
                    'services' => $servicesGrouped[$row->subsidiary_id] ?? [],
                ];
            })->values();

            $totals = [
                'total_minutes' => $chartData->sum('total_minutes'),
                'approved_minutes' => $chartData->sum('approved_minutes'),
            ];

            return Inertia::render('Reports/Index', [
                'data' => [],
                'subsidiaries' => [],
                'employees' => [],
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'totals' => $totals,
                'chartData' => $chartDataFormatted,
                'isEmployee' => true,
            ]);
        }

        // Pour les managers/admins
        // Récupérer les services gérés par le manager
        $managerServiceIds = $isAdmin
            ? Service::where('is_active', true)->pluck('id')
            : ($user->employee ? $user->employee->services()->pluck('services.id') : collect());

        // Récupérer les employés dans ces services
        $managedEmployeeIds = $isAdmin
            ? Employee::where('is_active', true)->pluck('id')
            : Employee::whereHas('services', function ($q) use ($managerServiceIds) {
                $q->whereIn('services.id', $managerServiceIds);
            })->pluck('id');

        // Récupérer les filiales où ces employés ont des time entries
        $baseManagedSubsidiaryIds = TimeEntry::whereIn('employee_id', $managedEmployeeIds)
            ->whereBetween('work_date', [$startDate, $endDate])
            ->pluck('subsidiary_id')
            ->unique();

        // Données personnelles du manager/admin (ses propres heures)
        $myEmployee = $user->employee;
        $myChartData = [];
        $myServiceChartData = [];
        $myTotals = ['total_minutes' => 0, 'approved_minutes' => 0];

        if ($myEmployee) {
            // Mes heures par filiale
            $myDataBySubsidiary = TimeEntry::query()
                ->select(
                    'subsidiary_id',
                    DB::raw('SUM(minutes) as total_minutes'),
                    DB::raw("SUM(CASE WHEN status = 'APPROVED' THEN minutes ELSE 0 END) as approved_minutes"),
                    DB::raw("SUM(CASE WHEN status = 'SUBMITTED' THEN minutes ELSE 0 END) as submitted_minutes"),
                    DB::raw("SUM(CASE WHEN status = 'DRAFT' THEN minutes ELSE 0 END) as draft_minutes")
                )
                ->where('employee_id', $myEmployee->id)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->groupBy('subsidiary_id')
                ->get();

            $mySubsidiariesMap = Subsidiary::whereIn('id', $myDataBySubsidiary->pluck('subsidiary_id'))->get()->keyBy('id');

            // Mes heures par service pour chaque filiale (pour le détail au clic)
            $myServicesBySubsidiary = TimeEntry::query()
                ->select(
                    'subsidiary_id',
                    'service_id',
                    DB::raw('SUM(minutes) as total_minutes'),
                    DB::raw("SUM(CASE WHEN status = 'APPROVED' THEN minutes ELSE 0 END) as approved_minutes"),
                    DB::raw("SUM(CASE WHEN status = 'SUBMITTED' THEN minutes ELSE 0 END) as submitted_minutes"),
                    DB::raw("SUM(CASE WHEN status = 'DRAFT' THEN minutes ELSE 0 END) as draft_minutes")
                )
                ->where('employee_id', $myEmployee->id)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->groupBy('subsidiary_id', 'service_id')
                ->get();

            $myServicesMapForSub = Service::whereIn('id', $myServicesBySubsidiary->pluck('service_id')->filter())->get()->keyBy('id');

            $myServicesGrouped = $myServicesBySubsidiary->groupBy('subsidiary_id')->map(function ($items) use ($myServicesMapForSub) {
                return $items->map(function ($row) use ($myServicesMapForSub) {
                    $service = $row->service_id ? ($myServicesMapForSub[$row->service_id] ?? null) : null;
                    return [
                        'service_id' => $row->service_id,
                        'service_name' => $service?->name ?? 'Sans service',
                        'total_hours' => round($row->total_minutes / 60, 2),
                        'approved_hours' => round($row->approved_minutes / 60, 2),
                        'submitted_hours' => round($row->submitted_minutes / 60, 2),
                        'draft_hours' => round($row->draft_minutes / 60, 2),
                    ];
                })->values();
            });

            $myChartData = $myDataBySubsidiary->map(function ($row) use ($mySubsidiariesMap, $myServicesGrouped) {
                $subsidiary = $mySubsidiariesMap[$row->subsidiary_id] ?? null;
                return [
                    'subsidiary_id' => $row->subsidiary_id,
                    'subsidiary_name' => $subsidiary?->name ?? 'Inconnu',
                    'total_hours' => round($row->total_minutes / 60, 2),
                    'approved_hours' => round($row->approved_minutes / 60, 2),
                    'submitted_hours' => round($row->submitted_minutes / 60, 2),
                    'draft_hours' => round($row->draft_minutes / 60, 2),
                    'services' => $myServicesGrouped[$row->subsidiary_id] ?? [],
                ];
            })->values();

            // Mes heures par service
            $myDataByService = TimeEntry::query()
                ->join('employee_services', 'time_entries.employee_id', '=', 'employee_services.employee_id')
                ->select(
                    'employee_services.service_id',
                    DB::raw('SUM(time_entries.minutes) as total_minutes'),
                    DB::raw("SUM(CASE WHEN time_entries.status = 'APPROVED' THEN time_entries.minutes ELSE 0 END) as approved_minutes"),
                    DB::raw("SUM(CASE WHEN time_entries.status = 'SUBMITTED' THEN time_entries.minutes ELSE 0 END) as submitted_minutes"),
                    DB::raw("SUM(CASE WHEN time_entries.status = 'DRAFT' THEN time_entries.minutes ELSE 0 END) as draft_minutes")
                )
                ->where('time_entries.employee_id', $myEmployee->id)
                ->whereBetween('time_entries.work_date', [$startDate, $endDate])
                ->groupBy('employee_services.service_id')
                ->get();

            $myServicesMap = Service::whereIn('id', $myDataByService->pluck('service_id'))->get()->keyBy('id');

            $myServiceChartData = $myDataByService->map(function ($row) use ($myServicesMap) {
                $service = $myServicesMap[$row->service_id] ?? null;
                return [
                    'service_id' => $row->service_id,
                    'service_name' => $service?->name ?? 'Sans service',
                    'total_hours' => round($row->total_minutes / 60, 2),
                    'approved_hours' => round($row->approved_minutes / 60, 2),
                    'submitted_hours' => round($row->submitted_minutes / 60, 2),
                    'draft_hours' => round($row->draft_minutes / 60, 2),
                ];
            })->values();

            $myTotals = [
                'total_minutes' => $myDataBySubsidiary->sum('total_minutes'),
                'approved_minutes' => $myDataBySubsidiary->sum('approved_minutes'),
            ];
        }

        // Inclure les filiales personnelles du manager/admin dans les filiales gérées
        // pour que ses heures soient comptées dans les totaux globaux
        $mySubsidiaryIds = $myEmployee 
            ? TimeEntry::where('employee_id', $myEmployee->id)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->pluck('subsidiary_id')
                ->unique()
            : collect();
        
        $managedSubsidiaryIds = $baseManagedSubsidiaryIds->merge($mySubsidiaryIds)->unique();

        // Histogramme par filiale (toutes les heures des filiales gérées + filiales personnelles)
        $chartDataBySubsidiary = TimeEntry::query()
            ->select(
                'subsidiary_id',
                DB::raw('SUM(minutes) as total_minutes'),
                DB::raw("SUM(CASE WHEN status = 'APPROVED' THEN minutes ELSE 0 END) as approved_minutes"),
                DB::raw("SUM(CASE WHEN status = 'SUBMITTED' THEN minutes ELSE 0 END) as submitted_minutes"),
                DB::raw("SUM(CASE WHEN status = 'DRAFT' THEN minutes ELSE 0 END) as draft_minutes")
            )
            ->whereIn('subsidiary_id', $managedSubsidiaryIds)
            ->whereBetween('work_date', [$startDate, $endDate])
            ->groupBy('subsidiary_id')
            ->get();

        $subsidiariesMap = Subsidiary::whereIn('id', $chartDataBySubsidiary->pluck('subsidiary_id'))->get()->keyBy('id');

        // Récupérer les heures par service pour chaque filiale (pour le détail au clic)
        $servicesBySubsidiaryGlobal = TimeEntry::query()
            ->select(
                'subsidiary_id',
                'service_id',
                DB::raw('SUM(minutes) as total_minutes'),
                DB::raw("SUM(CASE WHEN status = 'APPROVED' THEN minutes ELSE 0 END) as approved_minutes"),
                DB::raw("SUM(CASE WHEN status = 'SUBMITTED' THEN minutes ELSE 0 END) as submitted_minutes"),
                DB::raw("SUM(CASE WHEN status = 'DRAFT' THEN minutes ELSE 0 END) as draft_minutes")
            )
            ->whereIn('employee_id', $managedEmployeeIds)
            ->whereBetween('work_date', [$startDate, $endDate])
            ->groupBy('subsidiary_id', 'service_id')
            ->get();

        $allServicesMap = Service::whereIn('id', $servicesBySubsidiaryGlobal->pluck('service_id')->filter())->get()->keyBy('id');

        $servicesGroupedGlobal = $servicesBySubsidiaryGlobal->groupBy('subsidiary_id')->map(function ($items) use ($allServicesMap) {
            return $items->map(function ($row) use ($allServicesMap) {
                $service = $row->service_id ? ($allServicesMap[$row->service_id] ?? null) : null;
                return [
                    'service_id' => $row->service_id,
                    'service_name' => $service?->name ?? 'Sans service',
                    'total_hours' => round($row->total_minutes / 60, 2),
                    'approved_hours' => round($row->approved_minutes / 60, 2),
                    'submitted_hours' => round($row->submitted_minutes / 60, 2),
                    'draft_hours' => round($row->draft_minutes / 60, 2),
                ];
            })->values();
        });

        $chartDataFormatted = $chartDataBySubsidiary->map(function ($row) use ($subsidiariesMap, $servicesGroupedGlobal) {
            $subsidiary = $subsidiariesMap[$row->subsidiary_id] ?? null;
            return [
                'subsidiary_id' => $row->subsidiary_id,
                'subsidiary_name' => $subsidiary?->name ?? 'Inconnu',
                'total_hours' => round($row->total_minutes / 60, 2),
                'approved_hours' => round($row->approved_minutes / 60, 2),
                'submitted_hours' => round($row->submitted_minutes / 60, 2),
                'draft_hours' => round($row->draft_minutes / 60, 2),
                'services' => $servicesGroupedGlobal[$row->subsidiary_id] ?? [],
            ];
        })->values();

        // Histogramme par service (heures par service dans les filiales gérées)
        $employeeIdsInManagedSubsidiaries = Employee::whereHas('subsidiaries', function ($q) use ($managedSubsidiaryIds) {
            $q->whereIn('subsidiaries.id', $managedSubsidiaryIds);
        })->pluck('id');

        $chartDataByService = TimeEntry::query()
            ->join('employee_services', 'time_entries.employee_id', '=', 'employee_services.employee_id')
            ->select(
                'employee_services.service_id',
                DB::raw('SUM(time_entries.minutes) as total_minutes'),
                DB::raw("SUM(CASE WHEN time_entries.status = 'APPROVED' THEN time_entries.minutes ELSE 0 END) as approved_minutes"),
                DB::raw("SUM(CASE WHEN time_entries.status = 'SUBMITTED' THEN time_entries.minutes ELSE 0 END) as submitted_minutes"),
                DB::raw("SUM(CASE WHEN time_entries.status = 'DRAFT' THEN time_entries.minutes ELSE 0 END) as draft_minutes")
            )
            ->whereIn('time_entries.subsidiary_id', $managedSubsidiaryIds)
            ->whereBetween('time_entries.work_date', [$startDate, $endDate])
            ->groupBy('employee_services.service_id')
            ->get();

        $servicesMap = Service::whereIn('id', $chartDataByService->pluck('service_id'))->get()->keyBy('id');

        $serviceChartFormatted = $chartDataByService->map(function ($row) use ($servicesMap) {
            $service = $servicesMap[$row->service_id] ?? null;
            return [
                'service_id' => $row->service_id,
                'service_name' => $service?->name ?? 'Sans service',
                'total_hours' => round($row->total_minutes / 60, 2),
                'approved_hours' => round($row->approved_minutes / 60, 2),
                'submitted_hours' => round($row->submitted_minutes / 60, 2),
                'draft_hours' => round($row->draft_minutes / 60, 2),
            ];
        })->values();

        // Données tableau existantes
        $query = TimeEntry::query()
            ->select(
                'employee_id',
                'subsidiary_id',
                DB::raw('SUM(minutes) as total_minutes'),
                DB::raw("SUM(CASE WHEN status = 'APPROVED' THEN minutes ELSE 0 END) as approved_minutes"),
                DB::raw("SUM(CASE WHEN status IN ('SUBMITTED', 'DRAFT') THEN minutes ELSE 0 END) as pending_minutes")
            )
            ->whereBetween('work_date', [$startDate, $endDate])
            ->whereIn('subsidiary_id', $managedSubsidiaryIds)
            ->groupBy('employee_id', 'subsidiary_id');

        if ($request->filled('subsidiary_id')) {
            $query->where('subsidiary_id', $request->subsidiary_id);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        $results = $query->get();

        $employees = Employee::whereIn('id', $results->pluck('employee_id'))->get()->keyBy('id');
        $allSubsidiariesMap = Subsidiary::whereIn('id', $results->pluck('subsidiary_id'))->get()->keyBy('id');

        $data = $results->map(function ($row) use ($employees, $allSubsidiariesMap, $startDate, $endDate) {
            return [
                'id' => $row->employee_id . '-' . $row->subsidiary_id,
                'employee' => $employees[$row->employee_id] ?? null,
                'subsidiary' => $allSubsidiariesMap[$row->subsidiary_id] ?? null,
                'total_minutes' => (int) $row->total_minutes,
                'approved_minutes' => (int) $row->approved_minutes,
                'pending_minutes' => (int) $row->pending_minutes,
                'period' => Carbon::parse($startDate)->format('d/m') . ' - ' . Carbon::parse($endDate)->format('d/m/Y'),
            ];
        });

        $totals = [
            'total_minutes' => $chartDataBySubsidiary->sum('total_minutes'),
            'approved_minutes' => $chartDataBySubsidiary->sum('approved_minutes'),
        ];

        $subsidiaries = Subsidiary::whereIn('id', $managedSubsidiaryIds)->where('is_active', true)->get();

        $allEmployees = $isAdmin
            ? Employee::with(['subsidiaries', 'services'])->where('is_active', true)->get()
            : Employee::with(['subsidiaries', 'services'])->whereHas('services', function ($q) use ($managerServiceIds) {
                $q->whereIn('services.id', $managerServiceIds);
            })->where('is_active', true)->get();

        // Liste des employés gérés avec leurs totaux d'heures
        $employeesWithHours = [];
        foreach ($allEmployees as $emp) {
            $empTotals = TimeEntry::where('employee_id', $emp->id)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->selectRaw('SUM(minutes) as total_minutes')
                ->selectRaw("SUM(CASE WHEN status = 'APPROVED' THEN minutes ELSE 0 END) as approved_minutes")
                ->first();

            // Heures par filiale pour cet employé
            $empBySubsidiary = TimeEntry::query()
                ->select(
                    'subsidiary_id',
                    'service_id',
                    DB::raw('SUM(minutes) as total_minutes'),
                    DB::raw("SUM(CASE WHEN status = 'APPROVED' THEN minutes ELSE 0 END) as approved_minutes"),
                    DB::raw("SUM(CASE WHEN status = 'SUBMITTED' THEN minutes ELSE 0 END) as submitted_minutes"),
                    DB::raw("SUM(CASE WHEN status = 'DRAFT' THEN minutes ELSE 0 END) as draft_minutes")
                )
                ->where('employee_id', $emp->id)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->groupBy('subsidiary_id', 'service_id')
                ->get();

            $empSubsidiariesMap = Subsidiary::whereIn('id', $empBySubsidiary->pluck('subsidiary_id'))->get()->keyBy('id');
            $empServicesMap = Service::whereIn('id', $empBySubsidiary->pluck('service_id')->filter())->get()->keyBy('id');

            // Grouper par filiale puis par service
            $subsidiariesGrouped = $empBySubsidiary->groupBy('subsidiary_id')->map(function ($items, $subId) use ($empSubsidiariesMap, $empServicesMap) {
                $subsidiary = $empSubsidiariesMap[$subId] ?? null;
                $totalMinutes = $items->sum('total_minutes');
                $approvedMinutes = $items->sum('approved_minutes');
                $submittedMinutes = $items->sum('submitted_minutes');
                $draftMinutes = $items->sum('draft_minutes');

                $services = $items->map(function ($row) use ($empServicesMap) {
                    $service = $row->service_id ? ($empServicesMap[$row->service_id] ?? null) : null;
                    return [
                        'service_id' => $row->service_id,
                        'service_name' => $service?->name ?? 'Sans service',
                        'total_hours' => round($row->total_minutes / 60, 2),
                        'approved_hours' => round($row->approved_minutes / 60, 2),
                        'submitted_hours' => round($row->submitted_minutes / 60, 2),
                        'draft_hours' => round($row->draft_minutes / 60, 2),
                    ];
                })->values();

                return [
                    'subsidiary_id' => $subId,
                    'subsidiary_name' => $subsidiary?->name ?? 'Inconnu',
                    'total_hours' => round($totalMinutes / 60, 2),
                    'approved_hours' => round($approvedMinutes / 60, 2),
                    'submitted_hours' => round($submittedMinutes / 60, 2),
                    'draft_hours' => round($draftMinutes / 60, 2),
                    'services' => $services,
                ];
            })->values();

            // Récupérer la filiale principale et les services de l'employé
            $empPrimarySubsidiary = $emp->subsidiaries->firstWhere('pivot.is_primary', true) 
                ?? $emp->subsidiaries->first();
            $empServices = $emp->services;

            $employeesWithHours[] = [
                'id' => $emp->id,
                'full_name' => $emp->full_name,
                'employee_code' => $emp->employee_code,
                'subsidiary_name' => $empPrimarySubsidiary?->name ?? 'Non assigné',
                'services_names' => $empServices->pluck('name')->join(', ') ?: 'Aucun',
                'total_hours' => round(($empTotals->total_minutes ?? 0) / 60, 2),
                'approved_hours' => round(($empTotals->approved_minutes ?? 0) / 60, 2),
                'subsidiaries' => $subsidiariesGrouped,
            ];
        }

        return Inertia::render('Reports/Index', [
            'data' => $data->values(),
            'subsidiaries' => $subsidiaries,
            'employees' => $allEmployees,
            'filters' => [
                'subsidiary_id' => $request->get('subsidiary_id'),
                'employee_id' => $request->get('employee_id'),
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'totals' => $totals,
            'chartData' => $chartDataFormatted,
            'serviceChartData' => $serviceChartFormatted,
            'myChartData' => $myChartData,
            'myServiceChartData' => $myServiceChartData,
            'myTotals' => $myTotals,
            'employeesWithHours' => $employeesWithHours,
            'isEmployee' => false,
            'isManager' => $isManager,
            'isAdmin' => $isAdmin,
        ]);
    }

    public function export(Request $request)
    {
        // CSV export logic would go here
        return response()->json(['message' => 'Export not implemented yet']);
    }
}

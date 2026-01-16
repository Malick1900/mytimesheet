<?php

namespace App\Http\Controllers;

use App\Models\TimeEntry;
use App\Models\Subsidiary;
use App\Models\Employee;
use App\Models\User;
use App\Models\Service;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $employee = $user->employee;
        $userRoles = $user->roles->pluck('name')->toArray();
        $isManager = in_array('MANAGER', $userRoles);
        $isAdmin = in_array('ADMIN', $userRoles);

        $now = Carbon::now();
        $startOfWeek = $now->copy()->startOfWeek();
        $endOfWeek = $now->copy()->endOfWeek();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // =====================
        // DONNÉES EMPLOYÉ
        // =====================
        $employeeStats = [
            'weekHours' => 0,
            'monthHours' => 0,
            'lastMonthHours' => 0,
            'draftCount' => 0,
            'submittedCount' => 0,
            'approvedCount' => 0,
            'rejectedCount' => 0,
        ];
        $recentEntries = collect();
        $weekDays = [];

        if ($employee) {
            // Heures semaine et mois
            $employeeStats['weekHours'] = TimeEntry::where('employee_id', $employee->id)
                ->whereBetween('work_date', [$startOfWeek, $endOfWeek])
                ->sum('minutes');

            $employeeStats['monthHours'] = TimeEntry::where('employee_id', $employee->id)
                ->whereBetween('work_date', [$startOfMonth, $endOfMonth])
                ->sum('minutes');

            $employeeStats['lastMonthHours'] = TimeEntry::where('employee_id', $employee->id)
                ->whereBetween('work_date', [$startOfLastMonth, $endOfLastMonth])
                ->sum('minutes');

            // Compteurs par statut (mois en cours)
            $statusCounts = TimeEntry::where('employee_id', $employee->id)
                ->whereBetween('work_date', [$startOfMonth, $endOfMonth])
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status');

            $employeeStats['draftCount'] = $statusCounts['DRAFT'] ?? 0;
            $employeeStats['submittedCount'] = $statusCounts['SUBMITTED'] ?? 0;
            $employeeStats['approvedCount'] = $statusCounts['APPROVED'] ?? 0;
            $employeeStats['rejectedCount'] = $statusCounts['REJECTED'] ?? 0;

            // Activité récente
            $recentEntries = TimeEntry::with(['subsidiary', 'service'])
                ->where('employee_id', $employee->id)
                ->orderBy('work_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            // Jours travaillés cette semaine (pour mini calendrier)
            $workedDays = TimeEntry::where('employee_id', $employee->id)
                ->whereBetween('work_date', [$startOfWeek, $endOfWeek])
                ->select('work_date', DB::raw('SUM(minutes) as total_minutes'))
                ->groupBy('work_date')
                ->get()
                ->keyBy(fn($item) => Carbon::parse($item->work_date)->format('Y-m-d'));

            for ($i = 0; $i < 7; $i++) {
                $day = $startOfWeek->copy()->addDays($i);
                $dayKey = $day->format('Y-m-d');
                $weekDays[] = [
                    'date' => $dayKey,
                    'dayName' => $day->locale('fr')->shortDayName,
                    'dayNum' => $day->day,
                    'isToday' => $day->isToday(),
                    'isWeekend' => $day->isWeekend(),
                    'minutes' => $workedDays[$dayKey]->total_minutes ?? 0,
                ];
            }
        }

        // =====================
        // DONNÉES MANAGER
        // =====================
        $managerStats = [
            'pendingValidations' => 0,
            'teamSize' => 0,
            'validatedThisWeek' => 0,
            'rejectedThisWeek' => 0,
        ];
        $pendingSubmissions = collect();
        $teamActivity = collect();

        if ($isManager || $isAdmin) {
            // Employés gérés
            if ($isAdmin) {
                $managedEmployeeIds = Employee::where('is_active', true)->pluck('id');
            } else {
                $managerServiceIds = $employee ? $employee->services()->pluck('services.id') : collect();
                $managedEmployeeIds = Employee::whereHas('services', function ($q) use ($managerServiceIds) {
                    $q->whereIn('services.id', $managerServiceIds);
                })->where('is_active', true)->pluck('id');
            }

            $managerStats['teamSize'] = $managedEmployeeIds->count();

            // Entrées en attente de validation
            $managerStats['pendingValidations'] = TimeEntry::whereIn('employee_id', $managedEmployeeIds)
                ->where('status', 'SUBMITTED')
                ->count();

            // Validées/Rejetées cette semaine
            $managerStats['validatedThisWeek'] = TimeEntry::whereIn('employee_id', $managedEmployeeIds)
                ->where('status', 'APPROVED')
                ->whereBetween('approved_at', [$startOfWeek, $endOfWeek])
                ->count();

            $managerStats['rejectedThisWeek'] = TimeEntry::whereIn('employee_id', $managedEmployeeIds)
                ->where('status', 'REJECTED')
                ->whereBetween('updated_at', [$startOfWeek, $endOfWeek])
                ->count();

            // Soumissions en attente
            $pendingSubmissions = TimeEntry::with(['employee', 'subsidiary'])
                ->whereIn('employee_id', $managedEmployeeIds)
                ->where('status', 'SUBMITTED')
                ->orderBy('submitted_at', 'desc')
                ->limit(5)
                ->get();

            // Activité équipe récente (dernières validations/soumissions)
            $teamActivity = TimeEntry::with(['employee', 'subsidiary'])
                ->whereIn('employee_id', $managedEmployeeIds)
                ->whereIn('status', ['SUBMITTED', 'APPROVED', 'REJECTED'])
                ->orderBy('updated_at', 'desc')
                ->limit(8)
                ->get();
        }

        // =====================
        // DONNÉES ADMIN
        // =====================
        $adminStats = [
            'totalEmployees' => 0,
            'totalUsers' => 0,
            'totalSubsidiaries' => 0,
            'totalServices' => 0,
            'monthEntries' => 0,
            'systemHealth' => 'good',
        ];
        $recentUsers = collect();

        if ($isAdmin) {
            $adminStats['totalEmployees'] = Employee::where('is_active', true)->count();
            $adminStats['totalUsers'] = User::count();
            $adminStats['totalSubsidiaries'] = Subsidiary::where('is_active', true)->count();
            $adminStats['totalServices'] = Service::where('is_active', true)->count();
            $adminStats['monthEntries'] = TimeEntry::whereBetween('work_date', [$startOfMonth, $endOfMonth])->count();

            // Derniers utilisateurs connectés
            $recentUsers = User::with('employee')
                ->whereNotNull('last_login_at')
                ->orderBy('last_login_at', 'desc')
                ->limit(5)
                ->get();
        }

        return Inertia::render('Dashboard', [
            'employeeStats' => $employeeStats,
            'recentEntries' => $recentEntries,
            'weekDays' => $weekDays,
            'managerStats' => $managerStats,
            'pendingSubmissions' => $pendingSubmissions,
            'teamActivity' => $teamActivity,
            'adminStats' => $adminStats,
            'recentUsers' => $recentUsers,
            'isManager' => $isManager,
            'isAdmin' => $isAdmin,
            'currentMonth' => $now->locale('fr')->monthName . ' ' . $now->year,
        ]);
    }
}

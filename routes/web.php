<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TimesheetController;
use App\Http\Controllers\ValidationController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\Admin\SubsidiaryController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\EstimationController;
use App\Http\Controllers\SubsidiaryServiceController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Timesheet
    Route::get('/timesheet', [TimesheetController::class, 'index'])->name('timesheet.index');
    Route::post('/timesheet', [TimesheetController::class, 'store'])->name('timesheet.store');
    Route::put('/timesheet/{timeEntry}', [TimesheetController::class, 'update'])->name('timesheet.update');
    Route::delete('/timesheet/{timeEntry}', [TimesheetController::class, 'destroy'])->name('timesheet.destroy');
    Route::post('/timesheet/submit', [TimesheetController::class, 'submit'])->name('timesheet.submit');

    // Reports (accessible à tous les utilisateurs authentifiés)
    Route::get('/reports', [ReportsController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportsController::class, 'export'])->name('reports.export');

    // Validation (Manager/Admin)
    Route::middleware('manager')->group(function () {
        Route::get('/validation', [ValidationController::class, 'index'])->name('validation.index');
        Route::get('/validation/employee/{employee}', [ValidationController::class, 'show'])->name('validation.show');
        Route::post('/validation/{timeEntry}/approve', [ValidationController::class, 'approve'])->name('validation.approve');
        Route::post('/validation/{timeEntry}/reject', [ValidationController::class, 'reject'])->name('validation.reject');
        Route::post('/validation/bulk-approve', [ValidationController::class, 'bulkApprove'])->name('validation.bulk-approve');

        // Estimation
        Route::get('/estimation', [EstimationController::class, 'index'])->name('estimation.index');
        Route::get('/estimation/export-pdf', [EstimationController::class, 'exportPDF'])->name('estimation.export-pdf');
    });

    // Profile
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile.index');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread', [NotificationController::class, 'unread'])->name('notifications.unread');
    Route::get('/notifications/count', [NotificationController::class, 'count'])->name('notifications.count');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    // Admin Routes (ADMIN only)
    Route::prefix('admin')->name('admin.')->middleware('admin')->group(function () {
        // Subsidiaries
        Route::get('/subsidiaries', [SubsidiaryController::class, 'index'])->name('subsidiaries.index');
        Route::post('/subsidiaries', [SubsidiaryController::class, 'store'])->name('subsidiaries.store');
        Route::put('/subsidiaries/{subsidiary}', [SubsidiaryController::class, 'update'])->name('subsidiaries.update');

        // Employees
        Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
        Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
        Route::put('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');

        // Users
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');

        // Services
        Route::get('/services', [ServiceController::class, 'index'])->name('services.index');
        Route::post('/services', [ServiceController::class, 'store'])->name('services.store');
        Route::put('/services/{service}', [ServiceController::class, 'update'])->name('services.update');

        // Subsidiary Services (association filiales-services)
        Route::get('/subsidiary-services', [SubsidiaryServiceController::class, 'index'])->name('subsidiary-services.index');
        Route::post('/subsidiary-services/{subsidiary}/attach', [SubsidiaryServiceController::class, 'attach'])->name('subsidiary-services.attach');
        Route::post('/subsidiary-services/{subsidiary}/detach', [SubsidiaryServiceController::class, 'detach'])->name('subsidiary-services.detach');
        Route::post('/subsidiary-services/{subsidiary}/sync', [SubsidiaryServiceController::class, 'sync'])->name('subsidiary-services.sync');
    });
});

require __DIR__.'/auth.php';

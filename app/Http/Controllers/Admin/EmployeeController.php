<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Subsidiary;
use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::with(['subsidiaries', 'services'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $subsidiaries = Subsidiary::where('is_active', true)
            ->orderBy('name')
            ->get();

        $services = Service::where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Employees/Index', [
            'employees' => $employees,
            'subsidiaries' => $subsidiaries,
            'services' => $services,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_code' => 'required|string|max:30|unique:employees,employee_code',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'nullable|email|max:255|unique:employees,email',
            'phone' => 'nullable|string|max:30',
            'is_active' => 'boolean',
            'subsidiary_ids' => 'array',
            'subsidiary_ids.*' => 'uuid|exists:subsidiaries,id',
            'service_ids' => 'array',
            'service_ids.*' => 'uuid|exists:services,id',
        ]);

        $employee = Employee::create([
            'employee_code' => $validated['employee_code'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (!empty($validated['subsidiary_ids'])) {
            $employee->subsidiaries()->attach($validated['subsidiary_ids']);
        }

        if (!empty($validated['service_ids'])) {
            $employee->services()->attach($validated['service_ids']);
        }

        return back()->with('success', 'Employé créé avec succès.');
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'employee_code' => 'required|string|max:30|unique:employees,employee_code,' . $employee->id,
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'nullable|email|max:255|unique:employees,email,' . $employee->id,
            'phone' => 'nullable|string|max:30',
            'is_active' => 'boolean',
            'subsidiary_ids' => 'array',
            'subsidiary_ids.*' => 'uuid|exists:subsidiaries,id',
            'service_ids' => 'array',
            'service_ids.*' => 'uuid|exists:services,id',
        ]);

        $employee->update([
            'employee_code' => $validated['employee_code'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $employee->subsidiaries()->sync($validated['subsidiary_ids'] ?? []);
        $employee->services()->sync($validated['service_ids'] ?? []);

        return back()->with('success', 'Employé mis à jour.');
    }
}

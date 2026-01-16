<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Employee;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with(['employee', 'roles'])
            ->orderBy('email')
            ->get();

        $employees = Employee::where('is_active', true)
            ->whereDoesntHave('user')
            ->orderBy('last_name')
            ->get();

        $roles = Role::orderBy('name')->get();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'employees' => $employees,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|uuid|exists:employees,id|unique:users,employee_id',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'is_active' => 'boolean',
            'role_ids' => 'array',
            'role_ids.*' => 'uuid|exists:roles,id',
        ]);

        $user = User::create([
            'employee_id' => $validated['employee_id'] ?: null,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (!empty($validated['role_ids'])) {
            $user->roles()->attach($validated['role_ids']);
        }

        return back()->with('success', 'Utilisateur créé avec succès.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|uuid|exists:employees,id|unique:users,employee_id,' . $user->id,
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'is_active' => 'boolean',
            'role_ids' => 'array',
            'role_ids.*' => 'uuid|exists:roles,id',
        ]);

        $userData = [
            'employee_id' => $validated['employee_id'] ?: null,
            'email' => $validated['email'],
            'is_active' => $validated['is_active'] ?? true,
        ];

        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user->update($userData);
        $user->roles()->sync($validated['role_ids'] ?? []);

        return back()->with('success', 'Utilisateur mis à jour.');
    }
}

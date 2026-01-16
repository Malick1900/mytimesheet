<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Employee;
use App\Models\Company;
use App\Models\Subsidiary;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get roles
        $adminRole = Role::where('name', 'ADMIN')->first();
        $managerRole = Role::where('name', 'MANAGER')->first();
        $employeeRole = Role::where('name', 'EMPLOYEE')->first();

        // Create a company
        $company = Company::create([
            'id' => Str::uuid()->toString(),
            'name' => 'MyTimesheet Corp',
            'is_active' => true,
        ]);

        // Create subsidiaries
        $subsidiary1 = Subsidiary::create([
            'id' => Str::uuid()->toString(),
            'company_id' => $company->id,
            'code' => 'FIL-001',
            'name' => 'Filiale Transport',
            'is_active' => true,
        ]);

        $subsidiary2 = Subsidiary::create([
            'id' => Str::uuid()->toString(),
            'company_id' => $company->id,
            'code' => 'FIL-002',
            'name' => 'Filiale Logistique',
            'is_active' => true,
        ]);

        $subsidiary3 = Subsidiary::create([
            'id' => Str::uuid()->toString(),
            'company_id' => $company->id,
            'code' => 'FIL-003',
            'name' => 'Filiale Services',
            'is_active' => true,
        ]);

        // ========== ADMIN USER ==========
        $adminEmployee = Employee::create([
            'id' => Str::uuid()->toString(),
            'employee_code' => 'ADM-001',
            'first_name' => 'Admin',
            'last_name' => 'System',
            'email' => 'admin@mytimesheet.com',
            'is_active' => true,
        ]);

        $adminUser = User::create([
            'id' => Str::uuid()->toString(),
            'employee_id' => $adminEmployee->id,
            'email' => 'admin@mytimesheet.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $adminUser->roles()->attach($adminRole->id);

        // ========== MANAGER USER ==========
        $managerEmployee = Employee::create([
            'id' => Str::uuid()->toString(),
            'employee_code' => 'MGR-001',
            'first_name' => 'Marie',
            'last_name' => 'Dupont',
            'email' => 'manager@mytimesheet.com',
            'phone' => '+33 6 12 34 56 78',
            'is_active' => true,
        ]);

        $managerEmployee->subsidiaries()->attach([
            $subsidiary1->id => ['is_primary' => true],
            $subsidiary2->id => ['is_primary' => false],
        ]);

        $managerUser = User::create([
            'id' => Str::uuid()->toString(),
            'employee_id' => $managerEmployee->id,
            'email' => 'manager@mytimesheet.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $managerUser->roles()->attach($managerRole->id);
        $managerUser->managedSubsidiaries()->attach([$subsidiary1->id, $subsidiary2->id]);

        // ========== EMPLOYEE USERS ==========
        $employee1 = Employee::create([
            'id' => Str::uuid()->toString(),
            'employee_code' => 'EMP-001',
            'first_name' => 'Jean',
            'last_name' => 'Martin',
            'email' => 'jean.martin@mytimesheet.com',
            'phone' => '+33 6 98 76 54 32',
            'is_active' => true,
        ]);

        $employee1->subsidiaries()->attach([
            $subsidiary1->id => ['is_primary' => true],
        ]);

        $user1 = User::create([
            'id' => Str::uuid()->toString(),
            'employee_id' => $employee1->id,
            'email' => 'jean.martin@mytimesheet.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $user1->roles()->attach($employeeRole->id);

        // Employee 2
        $employee2 = Employee::create([
            'id' => Str::uuid()->toString(),
            'employee_code' => 'EMP-002',
            'first_name' => 'Sophie',
            'last_name' => 'Bernard',
            'email' => 'sophie.bernard@mytimesheet.com',
            'is_active' => true,
        ]);

        $employee2->subsidiaries()->attach([
            $subsidiary2->id => ['is_primary' => true],
            $subsidiary3->id => ['is_primary' => false],
        ]);

        $user2 = User::create([
            'id' => Str::uuid()->toString(),
            'employee_id' => $employee2->id,
            'email' => 'sophie.bernard@mytimesheet.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $user2->roles()->attach($employeeRole->id);

        // Employee 3
        $employee3 = Employee::create([
            'id' => Str::uuid()->toString(),
            'employee_code' => 'EMP-003',
            'first_name' => 'Pierre',
            'last_name' => 'Durand',
            'email' => 'pierre.durand@mytimesheet.com',
            'is_active' => true,
        ]);

        $employee3->subsidiaries()->attach([
            $subsidiary3->id => ['is_primary' => true],
        ]);

        $user3 = User::create([
            'id' => Str::uuid()->toString(),
            'employee_id' => $employee3->id,
            'email' => 'pierre.durand@mytimesheet.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $user3->roles()->attach($employeeRole->id);

        $this->command->info('Users seeded successfully!');
        $this->command->table(
            ['Email', 'Role', 'Password'],
            [
                ['admin@mytimesheet.com', 'ADMIN', 'password'],
                ['manager@mytimesheet.com', 'MANAGER', 'password'],
                ['jean.martin@mytimesheet.com', 'EMPLOYEE', 'password'],
                ['sophie.bernard@mytimesheet.com', 'EMPLOYEE', 'password'],
                ['pierre.durand@mytimesheet.com', 'EMPLOYEE', 'password'],
            ]
        );
    }
}

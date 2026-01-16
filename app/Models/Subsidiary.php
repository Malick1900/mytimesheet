<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subsidiary extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'photo_path',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the company that owns the subsidiary.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the employees for the subsidiary.
     */
    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_subsidiaries')
            ->withPivot(['is_primary', 'start_date', 'end_date', 'created_at']);
    }

    /**
     * Get the managers for the subsidiary.
     */
    public function managers()
    {
        return $this->belongsToMany(User::class, 'manager_subsidiaries');
    }

    /**
     * Get the time entries for the subsidiary.
     */
    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }

    /**
     * Get the services for the subsidiary.
     */
    public function services()
    {
        return $this->belongsToMany(Service::class, 'subsidiary_services')
            ->withPivot(['is_active', 'created_at']);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the employees for the service.
     */
    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_services')
            ->withPivot(['is_primary', 'start_date', 'end_date', 'created_at']);
    }

    /**
     * Get the subsidiaries for the service.
     */
    public function subsidiaries()
    {
        return $this->belongsToMany(Subsidiary::class, 'subsidiary_services')
            ->withPivot(['is_active', 'created_at']);
    }

    /**
     * Get the time entries for the service.
     */
    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'employee_code',
        'first_name',
        'last_name',
        'email',
        'phone',
        'photo_path',
        'is_active',
    ];

    protected $appends = ['full_name'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the full name attribute.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Get the user associated with the employee.
     */
    public function user()
    {
        return $this->hasOne(User::class);
    }

    /**
     * Get the subsidiaries for the employee.
     */
    public function subsidiaries()
    {
        return $this->belongsToMany(Subsidiary::class, 'employee_subsidiaries')
            ->withPivot(['is_primary', 'start_date', 'end_date', 'created_at']);
    }

    /**
     * Get the services for the employee.
     */
    public function services()
    {
        return $this->belongsToMany(Service::class, 'employee_services')
            ->withPivot(['is_primary', 'start_date', 'end_date', 'created_at']);
    }

    /**
     * Get the time entries for the employee.
     */
    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }
}

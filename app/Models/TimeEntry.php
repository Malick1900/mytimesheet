<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeEntry extends Model
{
    use HasFactory, HasUuids;

    const STATUS_DRAFT = 'DRAFT';
    const STATUS_SUBMITTED = 'SUBMITTED';
    const STATUS_APPROVED = 'APPROVED';
    const STATUS_REJECTED = 'REJECTED';

    protected $fillable = [
        'employee_id',
        'subsidiary_id',
        'service_id',
        'work_date',
        'minutes',
        'note',
        'requester',
        'status',
        'submitted_at',
        'approved_at',
        'approved_by',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date:Y-m-d',
            'minutes' => 'integer',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Serialize date to Y-m-d format for JSON.
     */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d');
    }

    /**
     * Get the hours attribute (calculated from minutes).
     */
    public function getHoursAttribute(): float
    {
        return round($this->minutes / 60, 2);
    }

    /**
     * Get the employee that owns the time entry.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the subsidiary that owns the time entry.
     */
    public function subsidiary()
    {
        return $this->belongsTo(Subsidiary::class);
    }

    /**
     * Get the service for the time entry.
     */
    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the user who approved the time entry.
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

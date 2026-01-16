<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Employee;
use App\Models\TimeEntry;
use Illuminate\Support\Facades\Mail;
use App\Mail\TaskSubmittedNotification;

class NotificationService
{
    /**
     * Notifier les managers et admins qu'un employé a soumis des heures
     */
    public function notifyTaskSubmitted(Employee $employee, array $timeEntryIds): void
    {
        $timeEntries = TimeEntry::whereIn('id', $timeEntryIds)->get();
        $totalMinutes = $timeEntries->sum('minutes');
        $totalHours = round($totalMinutes / 60, 1);
        $entryCount = count($timeEntryIds);

        // Trouver les managers responsables (ceux qui gèrent les services de l'employé)
        $employeeServiceIds = $employee->services()->pluck('services.id');
        
        $managerIds = User::whereHas('roles', function ($q) {
            $q->where('name', 'MANAGER');
        })
        ->whereHas('employee.services', function ($q) use ($employeeServiceIds) {
            $q->whereIn('services.id', $employeeServiceIds);
        })
        ->pluck('id');

        // Trouver tous les admins
        $adminIds = User::whereHas('roles', function ($q) {
            $q->where('name', 'ADMIN');
        })->pluck('id');

        // Fusionner les IDs (sans doublons)
        $userIdsToNotify = $managerIds->merge($adminIds)->unique();

        // Créer les notifications
        foreach ($userIdsToNotify as $userId) {
            $this->createNotification(
                $userId,
                'TASK_SUBMITTED',
                'Nouvelles heures soumises',
                "{$employee->full_name} a soumis {$entryCount} entrée(s) ({$totalHours}h) pour validation.",
                [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->full_name,
                    'time_entry_ids' => $timeEntryIds,
                    'total_hours' => $totalHours,
                    'entry_count' => $entryCount,
                ],
                true // Envoyer par email
            );
        }
    }

    /**
     * Notifier un employé que ses heures ont été validées
     */
    public function notifyTaskApproved(Employee $employee, array $timeEntryIds, User $approvedBy): void
    {
        $user = User::where('employee_id', $employee->id)->first();
        if (!$user) return;

        $timeEntries = TimeEntry::whereIn('id', $timeEntryIds)->get();
        $totalMinutes = $timeEntries->sum('minutes');
        $totalHours = round($totalMinutes / 60, 1);

        $approverName = $approvedBy->employee?->full_name ?? $approvedBy->email;
        $this->createNotification(
            $user->id,
            'TASK_APPROVED',
            'Heures validées',
            "Vos heures ({$totalHours}h) ont été validées par {$approverName}.",
            [
                'time_entry_ids' => $timeEntryIds,
                'total_hours' => $totalHours,
                'approved_by' => $approvedBy->id,
            ],
            true
        );
    }

    /**
     * Notifier un employé que ses heures ont été rejetées
     */
    public function notifyTaskRejected(Employee $employee, TimeEntry $timeEntry, User $rejectedBy, string $reason): void
    {
        $user = User::where('employee_id', $employee->id)->first();
        if (!$user) return;

        $hours = round($timeEntry->minutes / 60, 1);

        $this->createNotification(
            $user->id,
            'TASK_REJECTED',
            'Heures rejetées',
            "Votre entrée du {$timeEntry->work_date->format('d/m/Y')} ({$hours}h) a été rejetée. Motif: {$reason}",
            [
                'time_entry_id' => $timeEntry->id,
                'hours' => $hours,
                'rejected_by' => $rejectedBy->id,
                'reason' => $reason,
            ],
            true
        );
    }

    /**
     * Créer une notification
     */
    public function createNotification(
        string $userId,
        string $type,
        string $title,
        string $message,
        array $data = [],
        bool $sendEmail = false
    ): Notification {
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'email_sent' => false,
        ]);

        // Envoyer l'email si demandé
        if ($sendEmail) {
            $this->sendEmailNotification($notification);
        }

        return $notification;
    }

    /**
     * Envoyer une notification par email
     */
    protected function sendEmailNotification(Notification $notification): void
    {
        try {
            $user = $notification->user;
            if (!$user || !$user->email) return;

            Mail::to($user->email)->send(new TaskSubmittedNotification($notification));
            
            $notification->update(['email_sent' => true]);
        } catch (\Exception $e) {
            // Log l'erreur mais ne pas bloquer
            \Log::error('Failed to send notification email: ' . $e->getMessage());
        }
    }

    /**
     * Obtenir les notifications non lues d'un utilisateur
     */
    public function getUnreadNotifications(string $userId, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return Notification::forUser($userId)
            ->unread()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Obtenir toutes les notifications d'un utilisateur
     */
    public function getNotifications(string $userId, int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return Notification::forUser($userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Compter les notifications non lues
     */
    public function countUnread(string $userId): int
    {
        return Notification::forUser($userId)->unread()->count();
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead(string $userId): void
    {
        Notification::forUser($userId)
            ->unread()
            ->update(['read_at' => now()]);
    }
}

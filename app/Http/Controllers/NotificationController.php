<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Récupérer les notifications de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $limit = $request->get('limit', 20);
        
        $notifications = $this->notificationService->getNotifications($user->id, $limit);
        $unreadCount = $this->notificationService->countUnread($user->id);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Récupérer uniquement les notifications non lues
     */
    public function unread(Request $request)
    {
        $user = Auth::user();
        $limit = $request->get('limit', 10);
        
        $notifications = $this->notificationService->getUnreadNotifications($user->id, $limit);
        $unreadCount = $this->notificationService->countUnread($user->id);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead(Notification $notification)
    {
        $user = Auth::user();
        
        // Vérifier que la notification appartient à l'utilisateur
        if ($notification->user_id !== $user->id) {
            abort(403);
        }

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead()
    {
        $user = Auth::user();
        $this->notificationService->markAllAsRead($user->id);

        return response()->json(['success' => true]);
    }

    /**
     * Compter les notifications non lues (pour le badge)
     */
    public function count()
    {
        $user = Auth::user();
        $unreadCount = $this->notificationService->countUnread($user->id);

        return response()->json([
            'unread_count' => $unreadCount,
        ]);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ManagerMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        $userRoles = $user->roles->pluck('name')->toArray();

        if (!in_array('ADMIN', $userRoles) && !in_array('MANAGER', $userRoles)) {
            abort(403, 'Accès réservé aux managers et administrateurs.');
        }

        return $next($request);
    }
}

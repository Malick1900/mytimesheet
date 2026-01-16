<?php

namespace App\Http\Controllers;

use App\Models\Subsidiary;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SubsidiaryServiceController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name')->toArray();

        if (!in_array('ADMIN', $userRoles) && !in_array('MANAGER', $userRoles)) {
            abort(403);
        }

        $subsidiaries = Subsidiary::with(['services' => function ($query) {
            $query->wherePivot('is_active', true);
        }])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $services = Service::where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('SubsidiaryServices/Index', [
            'subsidiaries' => $subsidiaries,
            'services' => $services,
        ]);
    }

    public function attach(Request $request, Subsidiary $subsidiary)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name')->toArray();

        if (!in_array('ADMIN', $userRoles) && !in_array('MANAGER', $userRoles)) {
            abort(403);
        }

        $validated = $request->validate([
            'service_id' => 'required|uuid|exists:services,id',
        ]);

        // Check if already attached
        $exists = DB::table('subsidiary_services')
            ->where('subsidiary_id', $subsidiary->id)
            ->where('service_id', $validated['service_id'])
            ->exists();

        if ($exists) {
            // Reactivate if exists
            DB::table('subsidiary_services')
                ->where('subsidiary_id', $subsidiary->id)
                ->where('service_id', $validated['service_id'])
                ->update(['is_active' => true]);
        } else {
            // Create new relation
            DB::table('subsidiary_services')->insert([
                'subsidiary_id' => $subsidiary->id,
                'service_id' => $validated['service_id'],
                'is_active' => true,
                'created_at' => now(),
            ]);
        }

        return back()->with('success', 'Service associé à la filiale.');
    }

    public function detach(Request $request, Subsidiary $subsidiary)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name')->toArray();

        if (!in_array('ADMIN', $userRoles) && !in_array('MANAGER', $userRoles)) {
            abort(403);
        }

        $validated = $request->validate([
            'service_id' => 'required|uuid|exists:services,id',
        ]);

        DB::table('subsidiary_services')
            ->where('subsidiary_id', $subsidiary->id)
            ->where('service_id', $validated['service_id'])
            ->update(['is_active' => false]);

        return back()->with('success', 'Service retiré de la filiale.');
    }

    public function sync(Request $request, Subsidiary $subsidiary)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name')->toArray();

        if (!in_array('ADMIN', $userRoles) && !in_array('MANAGER', $userRoles)) {
            abort(403);
        }

        $validated = $request->validate([
            'service_ids' => 'array',
            'service_ids.*' => 'uuid|exists:services,id',
        ]);

        $serviceIds = $validated['service_ids'] ?? [];

        // Deactivate all existing
        DB::table('subsidiary_services')
            ->where('subsidiary_id', $subsidiary->id)
            ->update(['is_active' => false]);

        // Activate or create selected
        foreach ($serviceIds as $serviceId) {
            $exists = DB::table('subsidiary_services')
                ->where('subsidiary_id', $subsidiary->id)
                ->where('service_id', $serviceId)
                ->exists();

            if ($exists) {
                DB::table('subsidiary_services')
                    ->where('subsidiary_id', $subsidiary->id)
                    ->where('service_id', $serviceId)
                    ->update(['is_active' => true]);
            } else {
                DB::table('subsidiary_services')->insert([
                    'subsidiary_id' => $subsidiary->id,
                    'service_id' => $serviceId,
                    'is_active' => true,
                    'created_at' => now(),
                ]);
            }
        }

        return back()->with('success', 'Services mis à jour pour la filiale.');
    }
}

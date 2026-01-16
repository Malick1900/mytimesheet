<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subsidiary;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubsidiaryController extends Controller
{
    public function index()
    {
        $subsidiaries = Subsidiary::with('company')
            ->orderBy('name')
            ->get();

        $companies = Company::where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Subsidiaries/Index', [
            'subsidiaries' => $subsidiaries,
            'companies' => $companies,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id' => 'nullable|uuid|exists:companies,id',
            'code' => 'required|string|max:30|unique:subsidiaries,code',
            'name' => 'required|string|max:200',
            'is_active' => 'boolean',
        ]);

        Subsidiary::create($validated);

        return back()->with('success', 'Filiale créée avec succès.');
    }

    public function update(Request $request, Subsidiary $subsidiary)
    {
        $validated = $request->validate([
            'company_id' => 'nullable|uuid|exists:companies,id',
            'code' => 'required|string|max:30|unique:subsidiaries,code,' . $subsidiary->id,
            'name' => 'required|string|max:200',
            'is_active' => 'boolean',
        ]);

        $subsidiary->update($validated);

        return back()->with('success', 'Filiale mise à jour.');
    }
}

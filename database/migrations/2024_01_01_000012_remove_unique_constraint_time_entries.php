<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('time_entries', function (Blueprint $table) {
            // Supprimer la contrainte unique pour permettre plusieurs entrées par jour
            $table->dropUnique('time_entries_employee_id_subsidiary_id_work_date_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('time_entries', function (Blueprint $table) {
            $table->unique(['employee_id', 'subsidiary_id', 'work_date']);
        });
    }
};

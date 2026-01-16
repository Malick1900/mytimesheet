<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('time_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->uuid('subsidiary_id');
            $table->date('work_date');
            $table->integer('minutes');
            $table->text('note')->nullable();
            $table->string('status', 20)->default('DRAFT');
            $table->timestampTz('submitted_at')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestampsTz();

            $table->foreign('employee_id')
                ->references('id')
                ->on('employees')
                ->onDelete('cascade');

            $table->foreign('subsidiary_id')
                ->references('id')
                ->on('subsidiaries')
                ->onDelete('restrict');

            $table->foreign('approved_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->unique(['employee_id', 'subsidiary_id', 'work_date']);
            $table->index(['employee_id', 'work_date']);
            $table->index(['subsidiary_id', 'work_date']);
            $table->index('status');
        });

        // Add CHECK constraints via raw SQL for PostgreSQL
        DB::statement("ALTER TABLE time_entries ADD CONSTRAINT chk_time_entries_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'))");
        DB::statement("ALTER TABLE time_entries ADD CONSTRAINT chk_time_entries_minutes CHECK (minutes > 0 AND minutes <= 1440)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('time_entries');
    }
};

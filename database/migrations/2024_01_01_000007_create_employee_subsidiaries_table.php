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
        Schema::create('employee_subsidiaries', function (Blueprint $table) {
            $table->uuid('employee_id');
            $table->uuid('subsidiary_id');
            $table->boolean('is_primary')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->primary(['employee_id', 'subsidiary_id']);

            $table->foreign('employee_id')
                ->references('id')
                ->on('employees')
                ->onDelete('cascade');

            $table->foreign('subsidiary_id')
                ->references('id')
                ->on('subsidiaries')
                ->onDelete('restrict');

            $table->index('subsidiary_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_subsidiaries');
    }
};

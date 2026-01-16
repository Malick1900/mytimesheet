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
        Schema::create('subsidiaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id')->nullable();
            $table->string('code', 30)->unique();
            $table->string('name', 200);
            $table->text('photo_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();

            $table->foreign('company_id')
                ->references('id')
                ->on('companies')
                ->onDelete('restrict');

            $table->index('company_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subsidiaries');
    }
};

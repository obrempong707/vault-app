<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_id')->unique();
            $table->enum('status', ['pending', 'processing', 'in_transit', 'delivered'])->default('pending');
            $table->string('origin');
            $table->string('destination');
            $table->string('current_location');
            $table->date('estimated_delivery');
            $table->date('delivered_at')->nullable();
            $table->string('customer');
            $table->decimal('total_value', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};

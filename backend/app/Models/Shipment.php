<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracking_id',
        'status',
        'origin',
        'destination',
        'current_location',
        'estimated_delivery',
        'delivered_at',
        'customer',
        'total_value',
    ];

    protected $casts = [
        'estimated_delivery' => 'date',
        'delivered_at' => 'date',
        'total_value' => 'decimal:2',
    ];

    public function contents()
    {
        return $this->hasMany(ShipmentContent::class);
    }
}

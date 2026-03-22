<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShipmentContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipment_id',
        'type',
        'weight',
        'unit',
        'value',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'value' => 'decimal:2',
    ];

    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }
}

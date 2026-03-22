<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrackingStop extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipment_id',
        'location',
        'status',
        'recorded_at',
        'notes',
        'sequence',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'sequence' => 'integer',
    ];

    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }
}

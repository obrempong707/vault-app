<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrackingStopResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shipmentId' => $this->shipment_id,
            'location' => $this->location,
            'status' => $this->status,
            'timestamp' => $this->timestamp,
            'notes' => $this->notes,
        ];
    }
}

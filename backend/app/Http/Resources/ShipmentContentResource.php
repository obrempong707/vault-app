<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentContentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shipmentId' => $this->shipment_id,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'weight' => $this->weight,
            'value' => $this->value,
            'createdAt' => $this->created_at,
        ];
    }
}

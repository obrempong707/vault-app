<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ShipmentController extends Controller
{
    /**
     * List all shipments.
     */
    public function index(): JsonResponse
    {
        $shipments = Shipment::with('contents')->get();

        return response()->json([
            'success' => true,
            'data' => $shipments,
        ]);
    }

    /**
     * Get a single shipment by ID.
     */
    public function show(Shipment $shipment): JsonResponse
    {
        $shipment->load('contents');

        return response()->json([
            'success' => true,
            'data' => $shipment,
        ]);
    }

    /**
     * Track a shipment by tracking ID.
     */
    public function track(string $trackingId): JsonResponse
    {
        $shipment = Shipment::with('contents')
            ->where('tracking_id', $trackingId)
            ->first();

        if (!$shipment) {
            return response()->json([
                'success' => false,
                'message' => 'Shipment not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $shipment,
        ]);
    }

    /**
     * Create a new shipment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tracking_id' => 'required|string|unique:shipments',
            'status' => 'required|in:pending,processing,in_transit,delivered',
            'origin' => 'required|string',
            'destination' => 'required|string',
            'current_location' => 'required|string',
            'estimated_delivery' => 'required|date',
            'customer' => 'required|string',
            'total_value' => 'required|numeric|min:0',
            'contents' => 'array',
            'contents.*.type' => 'required|string',
            'contents.*.weight' => 'required|numeric|min:0',
            'contents.*.unit' => 'required|string',
            'contents.*.value' => 'required|numeric|min:0',
        ]);

        $shipment = Shipment::create($validated);

        if ($request->has('contents')) {
            foreach ($request->input('contents') as $content) {
                $shipment->contents()->create($content);
            }
        }

        $shipment->load('contents');

        return response()->json([
            'success' => true,
            'data' => $shipment,
        ], 201);
    }

    /**
     * Update an existing shipment.
     */
    public function update(Request $request, Shipment $shipment): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,processing,in_transit,delivered',
            'current_location' => 'sometimes|string',
            'estimated_delivery' => 'sometimes|date',
            'delivered_at' => 'sometimes|nullable|date',
            'customer' => 'sometimes|string',
            'total_value' => 'sometimes|numeric|min:0',
        ]);

        $shipment->update($validated);
        $shipment->load('contents');

        return response()->json([
            'success' => true,
            'data' => $shipment,
        ]);
    }

    /**
     * Delete a shipment.
     */
    public function destroy(Shipment $shipment): JsonResponse
    {
        $shipment->contents()->delete();
        $shipment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Shipment deleted.',
        ]);
    }
}

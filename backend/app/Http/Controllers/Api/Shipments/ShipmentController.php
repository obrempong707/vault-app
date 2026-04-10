<?php

namespace App\Http\Controllers\Api\Shipments;

use App\Http\Controllers\Controller;
use App\Http\Resources\ShipmentResource;
use App\Services\ShipmentService;
use App\Traits\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShipmentController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private ShipmentService $shipmentService)
    {
    }

    public function index(): JsonResponse
    {
        $shipments = $this->shipmentService->getShipments();

        return response()->json([
            'success' => true,
            'data' => ShipmentResource::collection($shipments),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $shipment = $this->shipmentService->getShipmentById($id);

        if (!$shipment) {
            return response()->json([
                'success' => false,
                'message' => 'Shipment not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ShipmentResource($shipment),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tracking_id' => 'required|string|unique:shipments',
            'customer' => 'required|integer',
            'origin' => 'required|string',
            'destination' => 'required|string',
            'status' => 'required|string|in:pending,in_transit,delivered,cancelled',
            'shipment_date' => 'required|date',
            'estimated_delivery' => 'nullable|date',
        ]);

        $shipment = $this->shipmentService->createShipment($validated);

        return response()->json([
            'success' => true,
            'data' => new ShipmentResource($shipment),
        ], 201);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|string|in:pending,in_transit,delivered,cancelled',
            'origin' => 'sometimes|string',
            'destination' => 'sometimes|string',
            'estimated_delivery' => 'nullable|date',
        ]);

        $shipment = $this->shipmentService->updateShipment($id, $validated);

        if (!$shipment) {
            return response()->json([
                'success' => false,
                'message' => 'Shipment not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ShipmentResource($shipment),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->shipmentService->deleteShipment($id);

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Shipment not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Shipment deleted successfully.',
        ]);
    }

    public function track(string $trackingId): JsonResponse
    {
        $shipment = $this->shipmentService->trackShipment($trackingId);

        if (!$shipment) {
            return response()->json([
                'success' => false,
                'message' => 'Shipment not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ShipmentResource($shipment),
        ]);
    }

    public function updateByTracking(string $trackingId, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|string|in:pending,in_transit,delivered,cancelled',
        ]);

        $shipment = $this->shipmentService->updateShipmentByTracking($trackingId, $validated);

        if (!$shipment) {
            return response()->json([
                'success' => false,
                'message' => 'Shipment not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ShipmentResource($shipment),
        ]);
    }

    public function createFromVaultAsset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vault_asset_id' => 'required|integer|exists:vault_assets,id',
            'destination' => 'required|string',
            'estimated_delivery' => 'nullable|date',
        ]);

        $shipment = $this->shipmentService->createShipment([
            'tracking_id' => 'TRK-' . time(),
            'customer' => $this->getCustomerId(),
            'origin' => 'Vault',
            'destination' => $validated['destination'],
            'status' => 'pending',
            'shipment_date' => now(),
            'estimated_delivery' => $validated['estimated_delivery'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => new ShipmentResource($shipment),
        ], 201);
    }
}

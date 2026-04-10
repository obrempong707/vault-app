<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ShipmentController extends Controller
{
    /**
     * List all shipments.
     */
    public function index(): JsonResponse
    {
        $query = Shipment::with(['contents', 'trackingStops']);
        
        // Non-admins: restrict to their customer's shipments
        if (Auth::user() && Auth::user()->role !== 'admin') {
            $customerId = Auth::user()->customer_id;
            $query->where('customer', $customerId);
        }
        
        $shipments = $query->get();

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
        // Verify ownership for non-admin users
        if (Auth::user() && Auth::user()->role !== 'admin') {
            if ($shipment->customer !== Auth::user()->customer_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this shipment.',
                ], 403);
            }
        }
        
        $shipment->load(['contents', 'trackingStops']);

        return response()->json([
            'success' => true,
            'data' => $shipment,
        ]);
    }

    /**
     * Update a shipment by its tracking ID.
     */
    public function updateByTracking(Request $request, string $trackingId): JsonResponse
    {
        $shipment = Shipment::where('tracking_id', $trackingId)->first();

        if (!$shipment) {
            return response()->json([
                'success' => false,
                'message' => 'Shipment not found for the provided tracking ID.',
            ], 404);
        }
        
        // Verify ownership for non-admin users
        if (Auth::user() && Auth::user()->role !== 'admin') {
            if ($shipment->customer !== Auth::user()->customer_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this shipment.',
                ], 403);
            }
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,processing,in_transit,delivered',
            'current_location' => 'sometimes|string',
            'estimated_delivery' => 'sometimes|date',
            'delivered_at' => 'sometimes|nullable|date',
            'customer' => 'sometimes|string',
            'total_value' => 'sometimes|numeric|min:0',
            'tracking_stops' => 'sometimes|array',
            'tracking_stops.*.location' => 'required|string',
            'tracking_stops.*.status' => 'required|string',
            'tracking_stops.*.recorded_at' => 'required|date',
            'tracking_stops.*.notes' => 'nullable|string',
            'tracking_stops.*.sequence' => 'nullable|integer|min:0',
        ]);

        DB::transaction(function () use ($shipment, $validated) {
            $shipment->update(collect($validated)->except('tracking_stops')->all());

            if (array_key_exists('tracking_stops', $validated)) {
                $shipment->trackingStops()->delete();
                foreach ($validated['tracking_stops'] as $index => $stop) {
                    $shipment->trackingStops()->create([
                        'location' => $stop['location'],
                        'status' => $stop['status'],
                        'recorded_at' => $stop['recorded_at'],
                        'notes' => $stop['notes'] ?? null,
                        'sequence' => $stop['sequence'] ?? $index,
                    ]);
                }
            }
        });

        $shipment->load(['contents', 'trackingStops']);

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
        $shipment = Shipment::with(['contents', 'trackingStops'])
            ->where('tracking_id', $trackingId)
            ->first();

        if (!$shipment) {
            return response()->json([
                'success' => false,
                'message' => 'Shipment not found.',
            ], 404);
        }

        // Sanitize response for public access - hide sensitive data
        $publicData = [
            'tracking_id' => $shipment->tracking_id,
            'status' => $shipment->status,
            'current_location' => $shipment->current_location,
            'estimated_delivery' => $shipment->estimated_delivery,
            'delivered_at' => $shipment->delivered_at,
            'tracking_stops' => $shipment->trackingStops->map(function ($stop) {
                return [
                    'location' => $stop->location,
                    'status' => $stop->status,
                    'recorded_at' => $stop->recorded_at,
                    'notes' => $stop->notes,
                ];
            }),
        ];

        // If authenticated, include full details
        if (Auth::check()) {
            $publicData['customer'] = $shipment->customer;
            $publicData['total_value'] = $shipment->total_value;
            $publicData['origin'] = $shipment->origin;
            $publicData['destination'] = $shipment->destination;
            $publicData['contents'] = $shipment->contents;
        }

        return response()->json([
            'success' => true,
            'data' => $publicData,
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
            'tracking_stops' => 'array',
            'tracking_stops.*.location' => 'required|string',
            'tracking_stops.*.status' => 'required|string',
            'tracking_stops.*.recorded_at' => 'required|date',
            'tracking_stops.*.notes' => 'nullable|string',
            'tracking_stops.*.sequence' => 'nullable|integer|min:0',
        ]);

        $shipment = DB::transaction(function () use ($validated, $request) {
            $shipment = Shipment::create(collect($validated)->except('tracking_stops')->all());

            if ($request->has('contents')) {
                foreach ($request->input('contents') as $content) {
                    $shipment->contents()->create($content);
                }
            }

            if (!empty($validated['tracking_stops'])) {
                foreach ($validated['tracking_stops'] as $index => $stop) {
                    $shipment->trackingStops()->create([
                        'location' => $stop['location'],
                        'status' => $stop['status'],
                        'recorded_at' => $stop['recorded_at'],
                        'notes' => $stop['notes'] ?? null,
                        'sequence' => $stop['sequence'] ?? $index,
                    ]);
                }
            }

            return $shipment;
        });

        $shipment->load(['contents', 'trackingStops']);

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
        // Verify ownership for non-admin users
        if (Auth::user() && Auth::user()->role !== 'admin') {
            if ($shipment->customer !== Auth::user()->customer_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this shipment.',
                ], 403);
            }
        }
        
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,processing,in_transit,delivered',
            'current_location' => 'sometimes|string',
            'estimated_delivery' => 'sometimes|date',
            'delivered_at' => 'sometimes|nullable|date',
            'customer' => 'sometimes|string',
            'total_value' => 'sometimes|numeric|min:0',
            'tracking_stops' => 'sometimes|array',
            'tracking_stops.*.location' => 'required|string',
            'tracking_stops.*.status' => 'required|string',
            'tracking_stops.*.recorded_at' => 'required|date',
            'tracking_stops.*.notes' => 'nullable|string',
            'tracking_stops.*.sequence' => 'nullable|integer|min:0',
        ]);

        DB::transaction(function () use ($shipment, $validated) {
            $shipment->update(collect($validated)->except('tracking_stops')->all());

            if (array_key_exists('tracking_stops', $validated)) {
                $shipment->trackingStops()->delete();

                foreach ($validated['tracking_stops'] as $index => $stop) {
                    $shipment->trackingStops()->create([
                        'location' => $stop['location'],
                        'status' => $stop['status'],
                        'recorded_at' => $stop['recorded_at'],
                        'notes' => $stop['notes'] ?? null,
                        'sequence' => $stop['sequence'] ?? $index,
                    ]);
                }
            }
        });

        $shipment->load(['contents', 'trackingStops']);

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
        // Verify ownership for non-admin users
        if (Auth::user() && Auth::user()->role !== 'admin') {
            if ($shipment->customer !== Auth::user()->customer_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this shipment.',
                ], 403);
            }
        }
        
        $shipment->contents()->delete();
        $shipment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Shipment deleted.',
        ]);
    }

    /**
     * Create a shipment from a vault asset.
     */
    public function createFromVaultAsset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vault_asset_id' => 'required|exists:vault_assets,id',
            'destination' => 'required|string',
            'estimated_delivery' => 'required|date|after:today',
        ]);

        // Generate unique tracking ID
        $trackingId = $this->generateUniqueTrackingId();

        $shipment = DB::transaction(function () use ($validated, $trackingId) {
            // Get the vault asset
            $vaultAsset = \App\Models\VaultAsset::findOrFail($validated['vault_asset_id']);

            // Create shipment
            $shipment = Shipment::create([
                'tracking_id' => $trackingId,
                'status' => 'pending',
                'origin' => $vaultAsset->vault_location,
                'destination' => $validated['destination'],
                'current_location' => $vaultAsset->vault_location,
                'estimated_delivery' => $validated['estimated_delivery'],
                'customer' => $vaultAsset->customer_name,
                'total_value' => $vaultAsset->value,
            ]);

            // Add contents from vault asset
            $shipment->contents()->create([
                'type' => $vaultAsset->asset_type,
                'weight' => $vaultAsset->weight,
                'unit' => $vaultAsset->unit,
                'value' => $vaultAsset->value,
            ]);

            // Add initial tracking stop
            $shipment->trackingStops()->create([
                'location' => $vaultAsset->vault_location,
                'status' => 'pending',
                'recorded_at' => now(),
                'notes' => 'Shipment created from vault asset',
                'sequence' => 0,
            ]);

            // Update vault asset status
            $vaultAsset->update(['status' => 'pending_shipment']);

            return $shipment;
        });

        $shipment->load(['contents', 'trackingStops']);

        return response()->json([
            'success' => true,
            'data' => $shipment,
            'message' => 'Shipment created successfully with tracking ID: ' . $trackingId,
        ], 201);
    }

    /**
     * Generate a unique tracking ID.
     */
    private function generateUniqueTrackingId(): string
    {
        do {
            $year = date('Y');
            $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
            $trackingId = "VLT-{$year}-{$random}";
        } while (Shipment::where('tracking_id', $trackingId)->exists());

        return $trackingId;
    }
}

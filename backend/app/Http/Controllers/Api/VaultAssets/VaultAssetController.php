<?php

namespace App\Http\Controllers\Api\VaultAssets;

use App\Http\Controllers\Controller;
use App\Http\Resources\VaultAssetResource;
use App\Services\VaultAssetService;
use App\Traits\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VaultAssetController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private VaultAssetService $vaultAssetService)
    {
    }

    public function index(): JsonResponse
    {
        $assets = $this->vaultAssetService->getAssets();
        $summary = $this->vaultAssetService->getAssetsSummary();

        return response()->json([
            'success' => true,
            'data' => VaultAssetResource::collection($assets),
            'summary' => $summary,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $asset = $this->vaultAssetService->getAssetById($id);

        if (!$asset) {
            return response()->json([
                'success' => false,
                'message' => 'Vault asset not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new VaultAssetResource($asset),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'required|string',
            'asset_type' => 'required|string',
            'weight' => 'required|numeric|min:0',
            'unit' => 'required|string',
            'purity' => 'nullable|string',
            'value' => 'required|numeric|min:0',
            'deposit_date' => 'required|date',
            'vault_location' => 'required|string',
            'insurance_status' => 'nullable|string',
            'status' => 'required|string|in:stored,pending_shipment',
        ]);

        $validated['user_id'] = $this->getUserId();
        $validated['customer_id'] = $validated['customer_id'] ?? $this->getUserId();
        
        // Ensure customer_name is never empty
        if (empty($validated['customer_name'])) {
            $validated['customer_name'] = 'Customer ' . $validated['customer_id'];
        }

        $asset = $this->vaultAssetService->createAsset($validated);

        return response()->json([
            'success' => true,
            'data' => new VaultAssetResource($asset),
        ], 201);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'sometimes|string',
            'asset_type' => 'sometimes|string',
            'weight' => 'sometimes|numeric|min:0',
            'unit' => 'sometimes|string',
            'purity' => 'sometimes|string',
            'value' => 'sometimes|numeric|min:0',
            'deposit_date' => 'sometimes|date',
            'vault_location' => 'sometimes|string',
            'insurance_status' => 'sometimes|string',
            'status' => 'sometimes|string|in:stored,pending_shipment',
        ]);

        $asset = $this->vaultAssetService->updateAsset($id, $validated);

        if (!$asset) {
            return response()->json([
                'success' => false,
                'message' => 'Vault asset not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new VaultAssetResource($asset),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->vaultAssetService->deleteAsset($id);

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Vault asset not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Vault asset deleted successfully.',
        ]);
    }

    public function byCustomer(int $customerId): JsonResponse
    {
        $this->authorizeAction(
            $this->isAdmin() || $this->getCustomerId() === $customerId,
            'Unauthorized access.'
        );

        $assets = $this->vaultAssetService->getAssetsByCustomer($customerId);

        return response()->json([
            'success' => true,
            'data' => VaultAssetResource::collection($assets),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $filters = $request->only(['asset_type', 'status', 'min_value', 'max_value']);
        $assets = $this->vaultAssetService->searchAssets($filters);

        return response()->json([
            'success' => true,
            'data' => VaultAssetResource::collection($assets),
        ]);
    }
}

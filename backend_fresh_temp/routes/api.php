<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ShipmentController;
use App\Http\Controllers\VaultAssetController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| RESTful API endpoints for VaultLogix platform.
| Base URL: /api
|
*/

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1'); // 5 attempts per minute

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('shipments', ShipmentController::class);
    Route::patch('/shipments/track/{trackingId}', [ShipmentController::class, 'updateByTracking']);
    Route::post('/shipments/from-vault-asset', [ShipmentController::class, 'createFromVaultAsset']);
    Route::apiResource('vault-assets', VaultAssetController::class);
    Route::get('/vault-assets/customer/{customerId}', [VaultAssetController::class, 'byCustomer']);
    Route::get('/vault-assets/search', [VaultAssetController::class, 'search']);
});

// Shipment Tracking (public) - rate limited to prevent abuse
Route::get('/track/{trackingId}', [ShipmentController::class, 'track'])
    ->middleware('throttle:10,1'); // 10 requests per minute

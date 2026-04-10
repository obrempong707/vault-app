<?php

namespace Database\Seeders;

use App\Models\Shipment;
use App\Models\User;
use App\Models\VaultAsset;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@vaultlogix.com'],
            [
                'name' => 'Admin Sterling',
                'password' => Hash::make('VaultLogixAdmin!2026'),
                'role' => 'admin',
                'customer_id' => null,
                'status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['email' => 'client@vaultlogix.com'],
            [
                'name' => 'Client Lawson',
                'password' => Hash::make('VaultLogixClient!2026'),
                'role' => 'client',
                'customer_id' => 'CUST-001',
                'status' => 'active',
            ]
        );

        // Seed Shipments (use updateOrCreate to prevent duplicates)
        $shipment1 = Shipment::updateOrCreate(
            ['tracking_id' => 'VLT-2024-001'],
            [
            'status' => 'in_transit',
            'origin' => 'Zurich, Switzerland',
            'destination' => 'Singapore',
            'current_location' => 'Dubai, UAE',
            'estimated_delivery' => '2024-03-25',
            'customer' => 'CUST-001',
            'total_value' => 1225000,
        ]
        );
        $shipment1->contents()->createMany([
            ['type' => 'Gold Bars', 'weight' => 5.2, 'unit' => 'kg', 'value' => 350000],
            ['type' => 'Diamonds', 'weight' => 125, 'unit' => 'carats', 'value' => 875000],
        ]);
        $shipment1->trackingStops()->createMany([
            ['location' => 'Zurich, Switzerland', 'status' => 'processing', 'recorded_at' => '2024-03-19 08:00:00', 'notes' => 'Shipment prepared for secure dispatch.', 'sequence' => 0],
            ['location' => 'Milan, Italy', 'status' => 'in_transit', 'recorded_at' => '2024-03-20 11:30:00', 'notes' => 'Cleared regional transit checkpoint.', 'sequence' => 1],
            ['location' => 'Dubai, UAE', 'status' => 'in_transit', 'recorded_at' => '2024-03-22 16:45:00', 'notes' => 'Awaiting final transfer to destination.', 'sequence' => 2],
        ]);

        $shipment2 = Shipment::updateOrCreate(
            ['tracking_id' => 'VLT-2024-002'],
            [
            'status' => 'delivered',
            'origin' => 'London, UK',
            'destination' => 'Hong Kong',
            'current_location' => 'Hong Kong',
            'estimated_delivery' => '2024-03-18',
            'delivered_at' => '2024-03-17',
            'customer' => 'CUST-002',
            'total_value' => 1335000,
        ]
        );
        $shipment2->contents()->createMany([
            ['type' => 'Gemstones', 'weight' => 450, 'unit' => 'carats', 'value' => 1250000],
            ['type' => 'Platinum', 'weight' => 2.1, 'unit' => 'kg', 'value' => 85000],
        ]);
        $shipment2->trackingStops()->createMany([
            ['location' => 'London, UK', 'status' => 'processing', 'recorded_at' => '2024-03-12 09:00:00', 'notes' => 'Shipment sealed and documented.', 'sequence' => 0],
            ['location' => 'Bangkok, Thailand', 'status' => 'in_transit', 'recorded_at' => '2024-03-15 14:20:00', 'notes' => 'Transferred through secure air hub.', 'sequence' => 1],
            ['location' => 'Hong Kong', 'status' => 'delivered', 'recorded_at' => '2024-03-17 10:00:00', 'notes' => 'Delivered to customer vault liaison.', 'sequence' => 2],
        ]);

        $shipment3 = Shipment::updateOrCreate(
            ['tracking_id' => 'VLT-2024-003'],
            [
            'status' => 'processing',
            'origin' => 'New York, USA',
            'destination' => 'Geneva, Switzerland',
            'current_location' => 'New York, USA',
            'estimated_delivery' => '2024-03-28',
            'customer' => 'CUST-005',
            'total_value' => 580000,
        ]
        );
        $shipment3->contents()->create([
            'type' => 'Gold Coins', 'weight' => 8.5, 'unit' => 'kg', 'value' => 580000,
        ]);
        $shipment3->trackingStops()->createMany([
            ['location' => 'New York, USA', 'status' => 'processing', 'recorded_at' => '2024-03-18 13:15:00', 'notes' => 'Awaiting departure clearance.', 'sequence' => 0],
        ]);

        $shipment4 = Shipment::updateOrCreate(
            ['tracking_id' => 'VLT-2024-004'],
            [
            'status' => 'in_transit',
            'origin' => 'Tokyo, Japan',
            'destination' => 'Sydney, Australia',
            'current_location' => 'Manila, Philippines',
            'estimated_delivery' => '2024-03-24',
            'customer' => 'CUST-003',
            'total_value' => 1095000,
        ]
        );
        $shipment4->contents()->createMany([
            ['type' => 'Sapphires', 'weight' => 280, 'unit' => 'carats', 'value' => 420000],
            ['type' => 'Rubies', 'weight' => 150, 'unit' => 'carats', 'value' => 675000],
        ]);
        $shipment4->trackingStops()->createMany([
            ['location' => 'Tokyo, Japan', 'status' => 'processing', 'recorded_at' => '2024-03-19 07:30:00', 'notes' => 'Customs handoff completed.', 'sequence' => 0],
            ['location' => 'Manila, Philippines', 'status' => 'in_transit', 'recorded_at' => '2024-03-21 12:10:00', 'notes' => 'Mid-route stop for secured transfer.', 'sequence' => 1],
        ]);

        $shipment5 = Shipment::updateOrCreate(
            ['tracking_id' => 'VLT-2024-005'],
            [
            'status' => 'pending',
            'origin' => 'Dubai, UAE',
            'destination' => 'Mumbai, India',
            'current_location' => 'Dubai, UAE',
            'estimated_delivery' => '2024-03-30',
            'customer' => 'CUST-004',
            'total_value' => 1770000,
        ]
        );
        $shipment5->contents()->createMany([
            ['type' => 'Gold Bars', 'weight' => 12.0, 'unit' => 'kg', 'value' => 810000],
            ['type' => 'Emeralds', 'weight' => 320, 'unit' => 'carats', 'value' => 960000],
        ]);
        $shipment5->trackingStops()->createMany([
            ['location' => 'Dubai, UAE', 'status' => 'pending', 'recorded_at' => '2024-03-20 09:45:00', 'notes' => 'Pickup has been scheduled.', 'sequence' => 0],
        ]);

        // Get user IDs for assignment
        $clientUser = User::where('email', 'client@vaultlogix.com')->first();
        $adminUser = User::where('email', 'admin@vaultlogix.com')->first();

        // Seed Vault Assets
        VaultAsset::updateOrCreate(
            ['customer_id' => 'CUST-001', 'asset_type' => 'Gold Bars'],
            [
            'user_id' => $clientUser->id,
            'customer_id' => 'CUST-001',
            'customer_name' => 'Goldstein Holdings Ltd',
            'asset_type' => 'Gold Bars',
            'weight' => 15.5,
            'unit' => 'kg',
            'purity' => '99.99%',
            'value' => 1050000,
            'deposit_date' => '2024-01-15',
            'vault_location' => 'Zurich Vault A-12',
            'insurance_status' => 'Fully Insured',
            'status' => 'stored',
        ]
        );

        VaultAsset::updateOrCreate(
            ['customer_id' => 'CUST-002', 'asset_type' => 'Diamonds'],
            [
            'user_id' => $adminUser->id,
            'customer_id' => 'CUST-002',
            'customer_name' => 'Crown Jewelers International',
            'asset_type' => 'Diamonds',
            'weight' => 850,
            'unit' => 'carats',
            'purity' => 'VVS1-VVS2',
            'value' => 5950000,
            'deposit_date' => '2024-02-01',
            'vault_location' => 'London Vault B-05',
            'insurance_status' => 'Fully Insured',
            'status' => 'stored',
        ]
        );

        VaultAsset::updateOrCreate(
            ['customer_id' => 'CUST-003', 'asset_type' => 'Sapphires'],
            [
            'user_id' => $adminUser->id,
            'customer_id' => 'CUST-003',
            'customer_name' => 'Pacific Gem Traders',
            'asset_type' => 'Sapphires',
            'weight' => 420,
            'unit' => 'carats',
            'purity' => 'AAA Grade',
            'value' => 630000,
            'deposit_date' => '2024-02-20',
            'vault_location' => 'Singapore Vault C-08',
            'insurance_status' => 'Fully Insured',
            'status' => 'stored',
        ]
        );

        VaultAsset::updateOrCreate(
            ['customer_id' => 'CUST-001', 'asset_type' => 'Platinum'],
            [
            'user_id' => $clientUser->id,
            'customer_id' => 'CUST-001',
            'customer_name' => 'Goldstein Holdings Ltd',
            'asset_type' => 'Platinum',
            'weight' => 8.2,
            'unit' => 'kg',
            'purity' => '99.95%',
            'value' => 328000,
            'deposit_date' => '2024-03-01',
            'vault_location' => 'Zurich Vault A-12',
            'insurance_status' => 'Fully Insured',
            'status' => 'stored',
        ]
        );

        VaultAsset::updateOrCreate(
            ['customer_id' => 'CUST-004', 'asset_type' => 'Emeralds'],
            [
            'user_id' => $adminUser->id,
            'customer_id' => 'CUST-004',
            'customer_name' => 'Royal Indian Jewels',
            'asset_type' => 'Emeralds',
            'weight' => 580,
            'unit' => 'carats',
            'purity' => 'AAA Grade',
            'value' => 1740000,
            'deposit_date' => '2024-03-10',
            'vault_location' => 'Dubai Vault D-03',
            'insurance_status' => 'Fully Insured',
            'status' => 'pending_shipment',
        ]
        );

        VaultAsset::updateOrCreate(
            ['customer_id' => 'CUST-005', 'asset_type' => 'Gold Coins'],
            [
            'user_id' => $adminUser->id,
            'customer_id' => 'CUST-005',
            'customer_name' => 'Manhattan Precious Metals',
            'asset_type' => 'Gold Coins',
            'weight' => 22.5,
            'unit' => 'kg',
            'purity' => '99.99%',
            'value' => 1530000,
            'deposit_date' => '2023-12-05',
            'vault_location' => 'New York Vault E-01',
            'insurance_status' => 'Fully Insured',
            'status' => 'stored',
        ]
        );

    }
}

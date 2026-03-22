# VaultLogix — Secure Vault Storage & Precious Metal Logistics

A modern, mobile-first web platform for secure vault storage and international shipping of gold, diamonds, and gemstones.

## Architecture

```
vault/
├── frontend/       # React + Vite + Tailwind CSS
├── backend/        # Laravel API
└── README.md
```

## Frontend (React)

### Quick Start
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`

### Pages
- **Home** — Premium hero, features, stats, security trust indicators
- **Track Shipment** — Enter tracking ID, view status/location/contents
- **My Vault** — Portfolio overview, stored assets with values/weights/dates
- **Admin Dashboard** — Data tables for shipments & vault assets, inline editing

### Tech Stack
- React 19 + Vite 8
- React Router DOM
- Tailwind CSS 3
- Lucide React icons

## Backend (Laravel API)

### Quick Start
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
API at `http://localhost:8000/api`

### Endpoints
See [backend/README.md](./backend/README.md) for full API documentation.

## Environment Variables

Create `frontend/.env` for production API URL:
```
VITE_API_URL=http://localhost:8000/api
```

## Demo Tracking IDs
- `VLT-2024-001` — In Transit (Zurich → Singapore)
- `VLT-2024-002` — Delivered (London → Hong Kong)
- `VLT-2024-003` — Processing (New York → Geneva)
- `VLT-2024-004` — In Transit (Tokyo → Sydney)
- `VLT-2024-005` — Pending (Dubai → Mumbai)

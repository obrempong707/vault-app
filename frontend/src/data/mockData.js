export const shipments = [
  {
    id: 'VLT-2024-001',
    trackingId: 'VLT-2024-001',
    status: 'in_transit',
    origin: 'Zurich, Switzerland',
    destination: 'Singapore',
    currentLocation: 'Dubai, UAE',
    estimatedDelivery: '2024-03-25',
    createdAt: '2024-03-15',
    customer: 'Goldstein Holdings Ltd',
    contents: [
      { type: 'Gold Bars', weight: 5.2, unit: 'kg', value: 350000 },
      { type: 'Diamonds', weight: 125, unit: 'carats', value: 875000 }
    ],
    totalValue: 1225000
  },
  {
    id: 'VLT-2024-002',
    trackingId: 'VLT-2024-002',
    status: 'delivered',
    origin: 'London, UK',
    destination: 'Hong Kong',
    currentLocation: 'Hong Kong',
    estimatedDelivery: '2024-03-18',
    deliveredAt: '2024-03-17',
    createdAt: '2024-03-10',
    customer: 'Crown Jewelers International',
    contents: [
      { type: 'Gemstones', weight: 450, unit: 'carats', value: 1250000 },
      { type: 'Platinum', weight: 2.1, unit: 'kg', value: 85000 }
    ],
    totalValue: 1335000
  },
  {
    id: 'VLT-2024-003',
    trackingId: 'VLT-2024-003',
    status: 'processing',
    origin: 'New York, USA',
    destination: 'Geneva, Switzerland',
    currentLocation: 'New York, USA',
    estimatedDelivery: '2024-03-28',
    createdAt: '2024-03-19',
    customer: 'Manhattan Precious Metals',
    contents: [
      { type: 'Gold Coins', weight: 8.5, unit: 'kg', value: 580000 }
    ],
    totalValue: 580000
  },
  {
    id: 'VLT-2024-004',
    trackingId: 'VLT-2024-004',
    status: 'in_transit',
    origin: 'Tokyo, Japan',
    destination: 'Sydney, Australia',
    currentLocation: 'Manila, Philippines',
    estimatedDelivery: '2024-03-24',
    createdAt: '2024-03-16',
    customer: 'Pacific Gem Traders',
    contents: [
      { type: 'Sapphires', weight: 280, unit: 'carats', value: 420000 },
      { type: 'Rubies', weight: 150, unit: 'carats', value: 675000 }
    ],
    totalValue: 1095000
  },
  {
    id: 'VLT-2024-005',
    trackingId: 'VLT-2024-005',
    status: 'pending',
    origin: 'Dubai, UAE',
    destination: 'Mumbai, India',
    currentLocation: 'Dubai, UAE',
    estimatedDelivery: '2024-03-30',
    createdAt: '2024-03-20',
    customer: 'Royal Indian Jewels',
    contents: [
      { type: 'Gold Bars', weight: 12.0, unit: 'kg', value: 810000 },
      { type: 'Emeralds', weight: 320, unit: 'carats', value: 960000 }
    ],
    totalValue: 1770000
  }
];

export const vaultAssets = [
  {
    id: 'VA-001',
    customerId: 'CUST-001',
    customerName: 'Goldstein Holdings Ltd',
    assetType: 'Gold Bars',
    weight: 15.5,
    unit: 'kg',
    purity: '99.99%',
    value: 1050000,
    depositDate: '2024-01-15',
    vaultLocation: 'Zurich Vault A-12',
    insuranceStatus: 'Fully Insured',
    status: 'stored'
  },
  {
    id: 'VA-002',
    customerId: 'CUST-002',
    customerName: 'Crown Jewelers International',
    assetType: 'Diamonds',
    weight: 850,
    unit: 'carats',
    purity: 'VVS1-VVS2',
    value: 5950000,
    depositDate: '2024-02-01',
    vaultLocation: 'London Vault B-05',
    insuranceStatus: 'Fully Insured',
    status: 'stored'
  },
  {
    id: 'VA-003',
    customerId: 'CUST-003',
    customerName: 'Pacific Gem Traders',
    assetType: 'Sapphires',
    weight: 420,
    unit: 'carats',
    purity: 'AAA Grade',
    value: 630000,
    depositDate: '2024-02-20',
    vaultLocation: 'Singapore Vault C-08',
    insuranceStatus: 'Fully Insured',
    status: 'stored'
  },
  {
    id: 'VA-004',
    customerId: 'CUST-001',
    customerName: 'Goldstein Holdings Ltd',
    assetType: 'Platinum',
    weight: 8.2,
    unit: 'kg',
    purity: '99.95%',
    value: 328000,
    depositDate: '2024-03-01',
    vaultLocation: 'Zurich Vault A-12',
    insuranceStatus: 'Fully Insured',
    status: 'stored'
  },
  {
    id: 'VA-005',
    customerId: 'CUST-004',
    customerName: 'Royal Indian Jewels',
    assetType: 'Emeralds',
    weight: 580,
    unit: 'carats',
    purity: 'AAA Grade',
    value: 1740000,
    depositDate: '2024-03-10',
    vaultLocation: 'Dubai Vault D-03',
    insuranceStatus: 'Fully Insured',
    status: 'pending_shipment'
  },
  {
    id: 'VA-006',
    customerId: 'CUST-005',
    customerName: 'Manhattan Precious Metals',
    assetType: 'Gold Coins',
    weight: 22.5,
    unit: 'kg',
    purity: '99.99%',
    value: 1530000,
    depositDate: '2023-12-05',
    vaultLocation: 'New York Vault E-01',
    insuranceStatus: 'Fully Insured',
    status: 'stored'
  }
];

export const getShipmentByTrackingId = (trackingId) => {
  return shipments.find(s => s.trackingId.toLowerCase() === trackingId.toLowerCase());
};

export const getStatusColor = (status) => {
  const colors = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    processing: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
    in_transit: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    stored: { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-500' },
    pending_shipment: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' }
  };
  return colors[status] || colors.pending;
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const calculateDaysStored = (depositDate) => {
  const deposit = new Date(depositDate);
  const today = new Date();
  const diffTime = Math.abs(today - deposit);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

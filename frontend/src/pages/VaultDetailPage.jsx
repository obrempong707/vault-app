import { useState, useEffect, useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  CircleDollarSign, 
  Gem, 
  MapPin, 
  Package, 
  Shield, 
  Truck,
  Loader2,
  Send,
  X
} from 'lucide-react';
import Card from '../components/UI/Card';
import StatusBadge from '../components/UI/StatusBadge';
import { vaultApi, shipmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const normalizeVaultAsset = (asset) => ({
  id: asset.id,
  customerId: asset.customer_id,
  customerName: asset.customer_name,
  assetType: asset.asset_type,
  weight: Number(asset.weight),
  unit: asset.unit,
  purity: asset.purity,
  value: Number(asset.value),
  depositDate: asset.deposit_date ? asset.deposit_date.slice(0, 10) : '',
  vaultLocation: asset.vault_location,
  insuranceStatus: asset.insurance_status,
  status: asset.status,
  createdAt: asset.created_at ? asset.created_at.slice(0, 10) : '',
});

const normalizeShipment = (shipment) => ({
  id: shipment.id,
  trackingId: shipment.tracking_id,
  status: shipment.status,
  origin: shipment.origin,
  destination: shipment.destination,
  currentLocation: shipment.current_location,
  estimatedDelivery: shipment.estimated_delivery ? shipment.estimated_delivery.slice(0, 10) : '',
  deliveredAt: shipment.delivered_at ? shipment.delivered_at.slice(0, 10) : null,
  createdAt: shipment.created_at ? shipment.created_at.slice(0, 10) : '',
  customer: shipment.customer,
  totalValue: Number(shipment.total_value),
});

const getAssetIcon = (type) => {
  if (type.toLowerCase().includes('gold') || type.toLowerCase().includes('platinum')) {
    return <CircleDollarSign className="w-6 h-6 text-amber-500" />;
  }
  return <Gem className="w-6 h-6 text-blue-500" />;
};

const getAssetColor = (type) => {
  if (type.toLowerCase().includes('gold')) return 'from-amber-400 to-yellow-500';
  if (type.toLowerCase().includes('platinum')) return 'from-slate-400 to-slate-500';
  if (type.toLowerCase().includes('diamond')) return 'from-blue-300 to-blue-400';
  if (type.toLowerCase().includes('sapphire')) return 'from-blue-500 to-blue-600';
  if (type.toLowerCase().includes('ruby')) return 'from-red-400 to-red-500';
  if (type.toLowerCase().includes('emerald')) return 'from-green-400 to-green-500';
  return 'from-purple-400 to-purple-500';
};

const VaultDetailPage = () => {
  const { assetId } = useParams();
  const { user } = useAuth();
  const [asset, setAsset] = useState(null);
  const [customerAssets, setCustomerAssets] = useState([]);
  const [relatedShipments, setRelatedShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Shipping state
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    destination: '',
    estimated_delivery: '',
  });
  const [shippingError, setShippingError] = useState('');

  // Compute latest related shipment for deep-linking to tracking page
  const latestShipment = useMemo(() => {
    if (!relatedShipments || relatedShipments.length === 0) return null;
    const list = [...relatedShipments];
    list.sort((a, b) => {
      const aDate = a.deliveredAt || a.estimatedDelivery || a.createdAt || '';
      const bDate = b.deliveredAt || b.estimatedDelivery || b.createdAt || '';
      const aT = aDate ? new Date(aDate).getTime() : 0;
      const bT = bDate ? new Date(bDate).getTime() : 0;
      return bT - aT; // newest first
    });
    return list[0];
  }, [relatedShipments]);

  const loadAssetDetails = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load the specific asset
      const assetResponse = await vaultApi.getById(assetId);
      const normalizedAsset = normalizeVaultAsset(assetResponse.data);
      setAsset(normalizedAsset);

      // Check permissions
      if (!user?.isAdmin && normalizedAsset.customerId !== user?.customerId) {
        setError('Access denied');
        return;
      }

      // Load other assets for the same customer
      const customerAssetsResponse = await vaultApi.getByCustomer(normalizedAsset.customerId);
      const allCustomerAssets = customerAssetsResponse.data.map(normalizeVaultAsset);
      setCustomerAssets(allCustomerAssets.filter(a => a.id !== assetId));

      // Load related shipments
      const shipmentsResponse = await shipmentApi.getAll();
      const allShipments = shipmentsResponse.data.map(normalizeShipment);
      const customerShipments = allShipments.filter(shipment => 
        shipment.customer === normalizedAsset.customerId
      );
      setRelatedShipments(customerShipments);

    } catch (loadError) {
      setError(loadError.message || 'Failed to load asset details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartShipping = () => {
    setShowShippingForm(true);
    setShippingError('');
    // Set default estimated delivery to 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setShippingForm({
      destination: '',
      estimated_delivery: defaultDate.toISOString().split('T')[0],
    });
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setIsShipping(true);
    setShippingError('');

    try {
      const response = await shipmentApi.createFromVaultAsset({
        vault_asset_id: asset.id,
        destination: shippingForm.destination,
        estimated_delivery: shippingForm.estimated_delivery,
      });

      if (response.success) {
        // Update asset status
        setAsset(prev => ({ ...prev, status: 'pending_shipment' }));
        setShowShippingForm(false);
        
        // Reload related shipments to show the new one
        const shipmentsResponse = await shipmentApi.getAll();
        const allShipments = shipmentsResponse.data.map(normalizeShipment);
        const customerShipments = allShipments.filter(shipment => 
          shipment.customer === asset.customerId
        );
        setRelatedShipments(customerShipments);

        // Show success message
        alert(`Shipment created successfully!\nTracking ID: ${response.data.tracking_id}`);
      }
    } catch (error) {
      setShippingError(error.message || 'Failed to create shipment.');
    } finally {
      setIsShipping(false);
    }
  };

  useEffect(() => {
    if (assetId) {
      loadAssetDetails();
    }
  }, [assetId, user]);

  // Lock background scroll when modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    if (showShippingForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = original || '';
    }
    return () => {
      document.body.style.overflow = original || '';
    };
  }, [showShippingForm]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysStored = (depositDate) => {
    if (!depositDate) return 0;
    const deposit = new Date(depositDate);
    const today = new Date();
    const diffTime = Math.abs(today - deposit);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return <Navigate to="/vault" replace />;
  }

  const customerTotalValue = customerAssets.reduce((sum, a) => sum + a.value, 0) + asset.value;
  const customerAssetCount = customerAssets.length + 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/vault"
            className="inline-flex items-center text-sm font-medium text-blue-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30 mb-4">
                <Shield className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-blue-300 text-sm font-medium">Vault Asset Detail</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{asset.assetType}</h1>
              <p className="text-slate-300">{asset.customerName} · {asset.vaultLocation}</p>
            </div>
            <StatusBadge status={asset.status} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12 space-y-8">
        {/* Asset Details */}
        <Card className="overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${getAssetColor(asset.assetType)}`}></div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  {getAssetIcon(asset.assetType)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{asset.assetType}</h2>
                  <p className="text-sm text-slate-500">Customer ID: {asset.customerId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-slate-900">{formatCurrency(asset.value)}</span>
                {user?.isAdmin && (
                  (relatedShipments && relatedShipments.length === 0) ? (
                    <button
                      onClick={handleStartShipping}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Start Shipping
                    </button>
                  ) : (
                    <Link
                      to={latestShipment && latestShipment.trackingId 
                        ? `/admin?tab=shipments&trackingId=${encodeURIComponent(latestShipment.trackingId)}&edit=1` 
                        : '/admin?tab=shipments'}
                      className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Update Tracking
                    </Link>
                  )
                )}
                <StatusBadge status={asset.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Weight</p>
                <p className="font-semibold text-slate-900">{asset.weight} {asset.unit}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Purity/Grade</p>
                <p className="font-semibold text-slate-900">{asset.purity}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Insurance</p>
                <p className="font-semibold text-slate-900">{asset.insuranceStatus}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Days Stored</p>
                <p className="font-semibold text-slate-900">{calculateDaysStored(asset.depositDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Deposited {formatDate(asset.depositDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{asset.vaultLocation}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Customer's Other Assets */}
        {customerAssets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Other Assets by {asset.customerName}</h2>
                <p className="text-sm text-slate-500">
                  {customerAssetCount} total assets · {formatCurrency(customerTotalValue)} total value
                </p>
              </div>
              <div className="inline-flex items-center text-sm text-green-700 bg-green-50 px-4 py-2 rounded-full">
                <Package className="w-4 h-4 mr-2" />
                {customerAssets.length} other asset{customerAssets.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {customerAssets.map((otherAsset) => (
                <Link key={otherAsset.id} to={`/vault/${otherAsset.id}`} className="block">
                  <Card hover className="overflow-hidden h-full">
                    <div className={`h-2 bg-gradient-to-r ${getAssetColor(otherAsset.assetType)}`}></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                            {getAssetIcon(otherAsset.assetType)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{otherAsset.assetType}</h3>
                            <p className="text-sm text-slate-500">{otherAsset.customerName}</p>
                          </div>
                        </div>
                        <StatusBadge status={otherAsset.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">Weight</p>
                          <p className="font-semibold text-slate-900">
                            {otherAsset.weight} {otherAsset.unit}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">Purity/Grade</p>
                          <p className="font-semibold text-slate-900">{otherAsset.purity}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <span className="text-sm text-slate-500">Current Value</span>
                        <span className="text-xl font-bold text-slate-900">
                          {formatCurrency(otherAsset.value)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Associated Shipments */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Associated Tracking</h2>
              <p className="text-sm text-slate-500">Shipments related to {asset.customerName}</p>
            </div>
            <div className="inline-flex items-center text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-full">
              <Truck className="w-4 h-4 mr-2" />
              {relatedShipments.length} shipment{relatedShipments.length === 1 ? '' : 's'}
            </div>
          </div>

          {relatedShipments.length === 0 ? (
            <Card className="p-10 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No associated tracking records</h3>
              <p className="text-slate-500">There are no shipments currently linked to this vault customer.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {relatedShipments.map((shipment) => (
                <Card key={shipment.id} hover className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Tracking ID</p>
                      <h3 className="text-lg font-bold text-slate-900">{shipment.trackingId}</h3>
                    </div>
                    <StatusBadge status={shipment.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Route</p>
                      <p className="font-medium text-slate-900">{shipment.origin} → {shipment.destination}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Current Location</p>
                      <p className="font-medium text-slate-900">{shipment.currentLocation}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Shipment Value</p>
                      <p className="font-medium text-slate-900">{formatCurrency(shipment.totalValue)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shipping Form Modal */}
      {showShippingForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowShippingForm(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

          {/* Dialog */}
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 ring-1 ring-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Start Shipping</h3>
                <p className="text-sm text-slate-500">Create a shipment for this stored asset.</p>
              </div>
              <button
                onClick={() => setShowShippingForm(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick summary */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Asset</p>
                <p className="text-sm font-medium text-slate-900">{asset.assetType}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Origin</p>
                <p className="text-sm font-medium text-slate-900">{asset.vaultLocation}</p>
              </div>
            </div>

            <form onSubmit={handleShippingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Destination</label>
                <input
                  type="text"
                  value={shippingForm.destination}
                  onChange={(e) => setShippingForm((prev) => ({ ...prev, destination: e.target.value }))}
                  placeholder="Enter destination address"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">Full address or recipient facility.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Delivery</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={shippingForm.estimated_delivery}
                  onChange={(e) => setShippingForm((prev) => ({ ...prev, estimated_delivery: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {shippingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm">{shippingError}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShippingForm(false)}
                  className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isShipping}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isShipping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Create Shipment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultDetailPage;

import { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  MapPin, 
  Calendar, 
  Truck, 
  CheckCircle,
  Clock,
  Shield,
  AlertCircle
} from 'lucide-react';
import Card from '../components/UI/Card';
import StatusBadge from '../components/UI/StatusBadge';
import { formatCurrency, formatDate } from '../data/mockData';
import { shipmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  trackingStops: (shipment.tracking_stops || []).map((stop, index) => ({
    location: stop.location,
    status: stop.status,
    recordedAt: stop.recorded_at ? stop.recorded_at.slice(0, 16) : '',
    notes: stop.notes || '',
    sequence: typeof stop.sequence === 'number' ? stop.sequence : index,
  })),
  contents: (shipment.contents || []).map((item) => ({
    type: item.type,
    weight: Number(item.weight),
    unit: item.unit,
    value: Number(item.value),
  })),
});

const TrackingPage = () => {
  const [trackingId, setTrackingId] = useState('');
  const [shipment, setShipment] = useState(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: 'processing',
    current_location: '',
    stop_location: '',
    stop_status: 'processing',
    stop_recorded_at: '',
    stop_notes: '',
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSearched(true);
    
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      setShipment(null);
      return;
    }

    setIsLoading(true);

    try {
      const response = await shipmentApi.track(trackingId.trim());
      setShipment(normalizeShipment(response.data));
    } catch (searchError) {
      setShipment(null);
      setError(searchError.message || 'No shipment found with this tracking ID. Try: VLT-2024-001');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_transit':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <Package className="w-5 h-5 text-slate-500" />;
    }
  };

  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30 mb-6">
            <Package className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-blue-300 text-sm font-medium">Real-Time Tracking</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Track Your Shipment
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            Enter your tracking ID to view real-time status, location, and contents of your shipment.
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <Card className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter tracking ID (e.g., VLT-2024-001)"
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isLoading ? 'Tracking...' : 'Track'}
            </button>
          </form>
        </Card>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {shipment && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Tracking ID</p>
                  <h2 className="text-2xl font-bold text-slate-900">{shipment.trackingId}</h2>
                </div>
                <StatusBadge status={shipment.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Current Location</p>
                    <p className="font-semibold text-slate-900">{shipment.currentLocation}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">
                      {shipment.status === 'pending' ? 'Status' : shipment.status === 'delivered' ? 'Delivered On' : 'Est. Delivery'}
                    </p>
                    <p className="font-semibold text-slate-900">
                      {shipment.status === 'pending' ? 'Preparing for shipment' : formatDate(shipment.deliveredAt || shipment.estimatedDelivery)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getStatusIcon(shipment.status)}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <p className="font-semibold text-slate-900 capitalize">
                      {shipment.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Route Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Shipment Route</h3>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">{shipment.origin}</p>
                  <p className="text-xs text-slate-500">Origin</p>
                </div>

                <div className="flex-1 mx-4">
                  <div className="relative">
                    <div className="h-1 bg-slate-200 rounded-full">
                      <div 
                        className={`h-1 rounded-full ${
                          shipment.status === 'delivered' 
                            ? 'bg-green-500 w-full' 
                            : shipment.status === 'in_transit'
                            ? 'bg-blue-500 w-1/2'
                            : 'bg-orange-500 w-1/4'
                        }`}
                      ></div>
                    </div>
                    <Truck className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 ${
                      shipment.status === 'delivered' 
                        ? 'right-0 text-green-500' 
                        : shipment.status === 'in_transit'
                        ? 'left-1/2 -translate-x-1/2 text-blue-500'
                        : 'left-1/4 -translate-x-1/2 text-orange-500'
                    }`} />
                  </div>
                </div>

                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    shipment.status === 'delivered' ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <CheckCircle className={`w-6 h-6 ${
                      shipment.status === 'delivered' ? 'text-green-600' : 'text-slate-400'
                    }`} />
                  </div>
                  <p className="text-sm font-medium text-slate-900">{shipment.destination}</p>
                  <p className="text-xs text-slate-500">Destination</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Tracking Timeline</h3>
                <span className="text-sm text-slate-500">
                  {shipment.status === 'delivered' ? 'Shipment delivered' : 'Updates shown until delivery'}
                </span>
              </div>

              {shipment.trackingStops.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-slate-600">No tracking stops have been recorded for this shipment yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shipment.trackingStops.map((stop, index) => {
                    const isLast = index === shipment.trackingStops.length - 1;
                    const isDeliveredStop = stop.status === 'delivered';

                    return (
                      <div key={`${stop.location}-${stop.recordedAt}-${index}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isDeliveredStop ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {isDeliveredStop ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Truck className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          {!isLast && <div className="w-px flex-1 bg-slate-200 mt-2"></div>}
                        </div>

                        <div className="flex-1 rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
                            <div>
                              <h4 className="font-semibold text-slate-900">{stop.location}</h4>
                              <p className="text-sm text-slate-500">
                                {stop.recordedAt ? formatDate(stop.recordedAt) : 'Timestamp pending'}
                              </p>
                            </div>
                            <StatusBadge status={stop.status} />
                          </div>

                          {stop.notes && (
                            <p className="text-sm text-slate-600">{stop.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            
            {/* Customer Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Shipment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Customer</p>
                  <p className="font-medium text-slate-900">{shipment.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium text-slate-900">{formatDate(shipment.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Weight</p>
                  <p className="font-medium text-slate-900">
                    {shipment.contents && shipment.contents.length > 0 ? `${shipment.contents.reduce((total, item) => total + item.weight, 0)} ${shipment.contents[0]?.unit || 'kg'}` : 'N/A'}
                  </p>
                </div>
              </div>
              
              {shipment.contents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-2">Asset Weights</p>
                  <div className="space-y-2">
                    {shipment.contents.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-slate-700">Asset {index + 1}</span>
                        <span className="text-slate-900">{item.weight} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {searched && !shipment && !error && (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Results</h3>
            <p className="text-slate-500">Enter a tracking ID to view shipment details</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;

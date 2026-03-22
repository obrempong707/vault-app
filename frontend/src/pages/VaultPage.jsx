import { useState, useEffect } from 'react';
import { 
  Gem, 
  CircleDollarSign, 
  Calendar, 
  Clock, 
  MapPin,
  Shield,
  TrendingUp,
  Package,
  Search,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/UI/Card';
import StatusBadge from '../components/UI/StatusBadge';
import { vaultApi } from '../services/api';
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

const VaultPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [vaultAssets, setVaultAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [insuranceFilter, setInsuranceFilter] = useState('all');

  const loadVaultAssets = async () => {
    setIsLoading(true);
    setError('');

    try {
      let response;
      if (user?.isAdmin) {
        response = await vaultApi.getAll();
      } else if (user?.customerId) {
        response = await vaultApi.getByCustomer(user.customerId);
      } else {
        setVaultAssets([]);
        setFilteredAssets([]);
        return;
      }

      const normalizedAssets = response.data.map(normalizeVaultAsset);
      setVaultAssets(normalizedAssets);
      setFilteredAssets(normalizedAssets);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load vault assets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadVaultAssets();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let filtered = vaultAssets;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asset => {
        switch (searchType) {
          case 'customer':
            return asset.customerName.toLowerCase().includes(term);
          case 'asset':
            return asset.assetType.toLowerCase().includes(term);
          case 'location':
            return asset.vaultLocation.toLowerCase().includes(term);
          default:
            return (
              asset.customerName.toLowerCase().includes(term) ||
              asset.assetType.toLowerCase().includes(term) ||
              asset.vaultLocation.toLowerCase().includes(term)
            );
        }
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    // Apply insurance status filter
    if (insuranceFilter !== 'all') {
      filtered = filtered.filter(asset => asset.insuranceStatus === insuranceFilter);
    }

    setFilteredAssets(filtered);
  }, [vaultAssets, searchTerm, searchType, statusFilter, insuranceFilter]);

  const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.value, 0);
  const totalGoldWeight = filteredAssets
    .filter(a => a.assetType.toLowerCase().includes('gold') || a.assetType.toLowerCase().includes('platinum'))
    .reduce((sum, a) => sum + (a.unit === 'kg' ? a.weight : 0), 0);
  const totalGemstoneCarats = filteredAssets
    .filter(a => a.unit === 'carats')
    .reduce((sum, a) => sum + a.weight, 0);

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30 mb-4">
                <Shield className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-blue-300 text-sm font-medium">Secure Storage</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {user?.isAdmin ? 'All Vaults' : 'My Vault'}
              </h1>
              <p className="text-slate-300">
                {user?.isAdmin
                  ? 'Monitor and manage all customer vaults'
                  : 'Manage your stored assets and request shipments'}
              </p>
            </div>
            <button className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
              <Package className="w-5 h-5 mr-2" />
              Request Shipment
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Portfolio Value</p>
                  <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Precious Metals</p>
                  <p className="text-3xl font-bold text-slate-900">{totalGoldWeight.toFixed(1)} kg</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center">
                  <CircleDollarSign className="w-7 h-7 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Gemstones</p>
                  <p className="text-3xl font-bold text-slate-900">{totalGemstoneCarats.toLocaleString()} ct</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Gem className="w-7 h-7 text-white" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search vault assets..."
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Search Type */}
              <div className="lg:w-48">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                >
                  <option value="all">All Fields</option>
                  <option value="customer">Customer</option>
                  <option value="asset">Asset Type</option>
                  <option value="location">Location</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                >
                  <option value="all">All Status</option>
                  <option value="stored">Stored</option>
                  <option value="pending_shipment">Pending Shipment</option>
                </select>
              </div>

              {/* Insurance Filter */}
              <div className="lg:w-48">
                <select
                  value={insuranceFilter}
                  onChange={(e) => setInsuranceFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                >
                  <option value="all">All Insurance</option>
                  <option value="Full Insured">Full Insured</option>
                  <option value="Processing">Processing</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Assets List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isAuthenticated && (
          <Card className="p-6 mb-6 border-amber-200 bg-amber-50">
            <p className="text-amber-800 font-medium">Please log in to view your vault.</p>
          </Card>
        )}

        {error && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <p className="text-red-800 font-medium">{error}</p>
          </Card>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {user?.isAdmin ? 'All Stored Assets' : 'Stored Assets'}
            {filteredAssets.length !== vaultAssets.length && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({filteredAssets.length} of {vaultAssets.length})
              </span>
            )}
          </h2>
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <Shield className="w-4 h-4" />
            <span className="font-medium">All assets fully insured</span>
          </div>
        </div>

        {isAuthenticated && isLoading ? (
          <Card className="p-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading vault assets...</p>
          </Card>
        ) : isAuthenticated && filteredAssets.length === 0 ? (
          <Card className="p-10 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {vaultAssets.length === 0 ? 'No vault assets found' : 'No assets match your search'}
            </h3>
            <p className="text-slate-500">
              {vaultAssets.length === 0 
                ? 'No vault assets have been created yet.' 
                : 'Try adjusting your search criteria or filters.'
              }
            </p>
          </Card>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssets.map((asset) => (
            <Link key={asset.id} to={`/vault/${asset.id}`} className="block">
              <Card hover className="overflow-hidden h-full">
                <div className={`h-2 bg-gradient-to-r ${getAssetColor(asset.assetType)}`}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        {getAssetIcon(asset.assetType)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{asset.assetType}</h3>
                        <p className="text-sm text-slate-500">{asset.customerName}</p>
                      </div>
                    </div>
                    <StatusBadge status={asset.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Weight</p>
                      <p className="font-semibold text-slate-900">
                        {asset.weight} {asset.unit}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Purity/Grade</p>
                      <p className="font-semibold text-slate-900">{asset.purity}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        Deposited {formatDate(asset.depositDate)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {calculateDaysStored(asset.depositDate)} days stored
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm mb-4">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{asset.vaultLocation}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-sm text-slate-500">Current Value</span>
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(asset.value)}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};

export default VaultPage;

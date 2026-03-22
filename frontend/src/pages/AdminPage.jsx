import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Search, Edit2, Save, X, Calendar,
  Package, Truck, CheckCircle, Clock, AlertCircle, Users, UserPlus, Shield
} from 'lucide-react';
import Card from '../components/UI/Card';
import StatusBadge from '../components/UI/StatusBadge';
import { formatCurrency, formatDate } from '../data/mockData';
import { shipmentApi, vaultApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const normalizeShipment = (shipment) => ({
  id: shipment.id,
  trackingId: shipment.tracking_id,
  status: shipment.status,
  currentLocation: shipment.current_location,
  estimatedDelivery: shipment.estimated_delivery ? shipment.estimated_delivery.slice(0, 10) : '',
  deliveredAt: shipment.delivered_at ? shipment.delivered_at.slice(0, 10) : null,
  customer: shipment.customer,
  totalValue: Number(shipment.total_value),
  trackingStops: (shipment.tracking_stops || []).map((stop, index) => ({
    location: stop.location,
    status: stop.status,
    recordedAt: stop.recorded_at ? stop.recorded_at.slice(0, 16) : '',
    notes: stop.notes || '',
    sequence: typeof stop.sequence === 'number' ? stop.sequence : index,
  })),
});

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
});

const AdminPage = () => {
  const { users, addUser, updateUserRole } = useAuth();
  const location = useLocation();
  const deepLinkHandledRef = useRef(false);
  const [activeTab, setActiveTab] = useState('shipments');
  const [shipments, setShipments] = useState([]);
  const [vaultAssets, setVaultAssets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const addAssetAnchorRef = useRef(null);
  const firstAssetInputRef = useRef(null);
  const [clientPrompt, setClientPrompt] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'client',
  });
  const [newVaultAsset, setNewVaultAsset] = useState({
    customerName: '',
    assetType: '',
    weight: '',
    unit: 'kg',
    purity: '',
    value: '',
    depositDate: '',
    vaultLocation: '',
    insuranceStatus: 'Full Insured',
    status: 'stored',
  });

  const statusOptions = ['pending', 'processing', 'in_transit', 'delivered'];
  const vaultStatusOptions = ['stored', 'pending_shipment'];
  const vaultUnitOptions = ['kg', 'grams', 'ounces', 'carats'];
  const insuranceStatusOptions = ['Overdue', 'Processing', 'Full Insured'];
  const roleOptions = ['client', 'admin'];

  useEffect(() => {
    const loadAdminData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [shipmentsResponse, vaultAssetsResponse] = await Promise.all([
          shipmentApi.getAll(),
          vaultApi.getAll(),
        ]);

        setShipments(shipmentsResponse.data.map(normalizeShipment));
        setVaultAssets(vaultAssetsResponse.data.map(normalizeVaultAsset));
      } catch (loadError) {
        setError(loadError.message || 'Failed to load admin data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  // Switch active tab based on query param `tab`
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'shipments' || tab === 'vault' || tab === 'users') {
      setActiveTab(tab);
    }
  }, [location.search]);

  // When shipments are loaded and deep link params are present, auto-open edit for matching trackingId
  useEffect(() => {
    if (deepLinkHandledRef.current) return;
    const params = new URLSearchParams(location.search);
    const trackingId = params.get('trackingId');
    const edit = params.get('edit');
    if (activeTab === 'shipments' && trackingId && edit === '1' && shipments.length > 0) {
      const match = shipments.find((s) => s.trackingId === trackingId);
      if (match) {
        handleEdit(match);
        deepLinkHandledRef.current = true;
      }
    }
  }, [location.search, activeTab, shipments]);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      ...item,
      trackingStops: item.trackingStops ? item.trackingStops.map((stop) => ({ ...stop })) : [],
    });
  };

  const handleTrackingStopChange = (index, field, value) => {
    setEditData((current) => ({
      ...current,
      trackingStops: current.trackingStops.map((stop, stopIndex) => (
        stopIndex === index ? { ...stop, [field]: value } : stop
      )),
    }));
  };

  const handleAddTrackingStop = () => {
    setEditData((current) => ({
      ...current,
      trackingStops: [
        ...(current.trackingStops || []),
        {
          location: current.currentLocation || '',
          status: current.status || 'pending',
          recordedAt: '',
          notes: '',
          sequence: (current.trackingStops || []).length,
        },
      ],
    }));
  };

  const handleRemoveTrackingStop = (index) => {
    setEditData((current) => ({
      ...current,
      trackingStops: current.trackingStops
        .filter((_, stopIndex) => stopIndex !== index)
        .map((stop, stopIndex) => ({ ...stop, sequence: stopIndex })),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      if (activeTab === 'shipments') {
        const payload = {
          customer: editData.customer,
          status: editData.status,
          current_location: editData.currentLocation,
          delivered_at: editData.status === 'delivered' ? editData.deliveredAt || new Date().toISOString().slice(0, 10) : null,
          total_value: Number(editData.totalValue),
          tracking_stops: (editData.trackingStops || []).map((stop, index) => ({
            location: stop.location,
            status: stop.status,
            recorded_at: stop.recordedAt || new Date().toISOString(),
            notes: stop.notes || null,
            sequence: index,
          })),
        };

        const response = await shipmentApi.update(editingId, payload);
        const updatedShipment = normalizeShipment(response.data);

        setShipments(shipments.map((shipment) => (
          shipment.id === editingId ? updatedShipment : shipment
        )));
      } else {
        const payload = {
          weight: Number(editData.weight),
          deposit_date: editData.depositDate,
          insurance_status: editData.insuranceStatus,
          status: editData.status,
          value: Number(editData.value),
        };

        const response = await vaultApi.update(editingId, payload);
        const updatedVaultAsset = normalizeVaultAsset(response.data);

        setVaultAssets(vaultAssets.map((asset) => (
          asset.id === editingId ? updatedVaultAsset : asset
        )));
      }

      setEditingId(null);
      setEditData({});
    } catch (saveError) {
      setError(saveError.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleAddVaultAsset = async () => {
    if (
      !newVaultAsset.customerName.trim() ||
      !newVaultAsset.assetType.trim() ||
      !newVaultAsset.purity.trim() ||
      !newVaultAsset.depositDate ||
      !newVaultAsset.vaultLocation.trim()
    ) {
      setError('Please complete all vault asset fields before creating an asset.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const payload = {
        customer_name: newVaultAsset.customerName.trim(),
        asset_type: newVaultAsset.assetType.trim(),
        weight: Number(newVaultAsset.weight),
        unit: newVaultAsset.unit,
        purity: newVaultAsset.purity.trim(),
        value: Number(newVaultAsset.value),
        deposit_date: newVaultAsset.depositDate,
        vault_location: newVaultAsset.vaultLocation.trim(),
        insurance_status: newVaultAsset.insuranceStatus.trim(),
        status: newVaultAsset.status,
      };

      const response = await vaultApi.create(payload);
      const createdAsset = normalizeVaultAsset(response.data);

      setVaultAssets((current) => [createdAsset, ...current]);
      setNewVaultAsset({
        customerName: '',
        assetType: '',
        weight: '',
        unit: 'kg',
        purity: '',
        value: '',
        depositDate: '',
        vaultLocation: '',
        insuranceStatus: 'Full Insured',
        status: 'stored',
      });
    } catch (saveError) {
      setError(saveError.message || 'Failed to create vault asset.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVaultAsset = async (assetId) => {
    setIsSaving(true);
    setError('');

    try {
      await vaultApi.delete(assetId);
      setVaultAssets((current) => current.filter((asset) => asset.id !== assetId));

      if (editingId === assetId) {
        setEditingId(null);
        setEditData({});
      }
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete vault asset.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredShipments = shipments.filter(s => 
    s.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssets = vaultAssets.filter(a =>
    a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.assetType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      return;
    }

    const created = { ...newUser };
    addUser(created);

    // If a new client user is created, guide admin to add associated vault asset
    if ((created.role || 'client') === 'client') {
      setActiveTab('vault');
      setNewVaultAsset((prev) => ({ ...prev, customerName: created.name }));
      setClientPrompt({ name: created.name });

      setTimeout(() => {
        if (addAssetAnchorRef.current) {
          addAssetAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (firstAssetInputRef.current) {
          firstAssetInputRef.current.focus();
        }
      }, 50);
    }
    setNewUser({
      name: '',
      email: '',
      role: 'client',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-2">
            <LayoutDashboard className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-slate-300">Manage shipments and vault assets</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        <Card className="p-5 mb-6 bg-blue-50 border-blue-100">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-700 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-blue-900">Admin-only access</h2>
              <p className="text-sm text-blue-800 mt-1">
                Only admins can add users and assign roles. Available roles are <span className="font-semibold">admin</span> and <span className="font-semibold">client</span>.
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setActiveTab('shipments'); setSearchTerm(''); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'shipments' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />Shipments
            </button>
            <button
              onClick={() => { setActiveTab('vault'); setSearchTerm(''); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'vault' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="w-4 h-4 inline mr-2" />Vault Assets
            </button>
            <button
              onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />Users & Roles
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
          </div>
        </div>

        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-slate-600">Loading admin data...</p>
          </Card>
        ) : (
        <>
        {clientPrompt && (
          <Card className="p-4 mb-6 border-blue-200 bg-blue-50">
            <div className="flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-blue-700 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900">
                  New client <span className="font-semibold">{clientPrompt.name}</span> created. Add their associated vault asset below.
                </p>
              </div>
              <button
                onClick={() => setClientPrompt(null)}
                className="text-blue-700 text-sm font-medium hover:underline"
              >
                Dismiss
              </button>
            </div>
          </Card>
        )}
        {/* Shipments Table */}
        {activeTab === 'shipments' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Tracking ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Stops</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Value</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredShipments.map((shipment) => (
                    editingId === shipment.id ? (
                      [
                        <tr key={`${shipment.id}-summary`} className="hover:bg-slate-50 align-top">
                          <td className="px-6 py-4 font-medium text-slate-900">{shipment.trackingId}</td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editData.customer}
                              onChange={(e) => setEditData({...editData, customer: e.target.value})}
                              className="border rounded px-2 py-1 w-full"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={editData.status}
                              onChange={(e) => setEditData({...editData, status: e.target.value})}
                              className="border rounded px-2 py-1"
                            >
                              {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editData.currentLocation}
                              onChange={(e) => setEditData({...editData, currentLocation: e.target.value})}
                              className="border rounded px-2 py-1 w-full"
                            />
                          </td>
                          <td className="px-6 py-4 text-slate-600">{(editData.trackingStops || []).length}</td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={editData.totalValue}
                              onChange={(e) => setEditData({...editData, totalValue: parseFloat(e.target.value) || 0})}
                              className="border rounded px-2 py-1 w-28"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button onClick={handleSave} disabled={isSaving} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50">
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={handleCancel} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>,
                        <tr key={`${shipment.id}-stops`} className="bg-slate-50/70">
                          <td className="px-6 py-4" colSpan="7">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">Tracking Stops</h3>
                                <button
                                  onClick={handleAddTrackingStop}
                                  type="button"
                                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                  Add Stop
                                </button>
                              </div>
                              {(editData.trackingStops || []).length === 0 ? (
                                <p className="text-sm text-slate-500">No tracking stops added yet.</p>
                              ) : (
                                <div className="space-y-3">
                                  {(editData.trackingStops || []).map((stop, index) => (
                                    <div key={`${shipment.id}-stop-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                                      <input
                                        type="text"
                                        value={stop.location}
                                        onChange={(e) => handleTrackingStopChange(index, 'location', e.target.value)}
                                        placeholder="Location"
                                        className="border rounded px-3 py-2"
                                      />
                                      <select
                                        value={stop.status}
                                        onChange={(e) => handleTrackingStopChange(index, 'status', e.target.value)}
                                        className="border rounded px-3 py-2"
                                      >
                                        {statusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
                                      </select>
                                      <input
                                        type="datetime-local"
                                        value={stop.recordedAt}
                                        onChange={(e) => handleTrackingStopChange(index, 'recordedAt', e.target.value)}
                                        className="border rounded px-3 py-2"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTrackingStop(index)}
                                        className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                      >
                                        Remove
                                      </button>
                                      <input
                                        type="text"
                                        value={stop.notes}
                                        onChange={(e) => handleTrackingStopChange(index, 'notes', e.target.value)}
                                        placeholder="Notes"
                                        className="border rounded px-3 py-2 md:col-span-4"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>,
                      ]
                    ) : (
                      <tr key={shipment.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{shipment.trackingId}</td>
                        <td className="px-6 py-4 text-slate-600">{shipment.customer}</td>
                        <td className="px-6 py-4"><StatusBadge status={shipment.status} /></td>
                        <td className="px-6 py-4 text-slate-600">{shipment.currentLocation}</td>
                        <td className="px-6 py-4 text-slate-600">{shipment.trackingStops.length}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(shipment.totalValue)}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleEdit(shipment)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Vault Assets Table */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div ref={addAssetAnchorRef} />
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Add Vault Asset</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  value={newVaultAsset.customerName}
                  onChange={(e) => setNewVaultAsset({ ...newVaultAsset, customerName: e.target.value })}
                  placeholder="Customer name"
                  ref={firstAssetInputRef}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newVaultAsset.assetType}
                  onChange={(e) => setNewVaultAsset({ ...newVaultAsset, assetType: e.target.value })}
                  placeholder="Asset type"
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newVaultAsset.purity}
                  onChange={(e) => setNewVaultAsset({ ...newVaultAsset, purity: e.target.value })}
                  placeholder="Purity"
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={newVaultAsset.weight}
                  onChange={(e) => setNewVaultAsset({ ...newVaultAsset, weight: e.target.value })}
                  placeholder="Weight"
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newVaultAsset.unit}
                  onChange={(e) => setNewVaultAsset({ ...newVaultAsset, unit: e.target.value })}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {vaultUnitOptions.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={newVaultAsset.value}
                  onChange={(e) => setNewVaultAsset({ ...newVaultAsset, value: e.target.value })}
                  placeholder="Value"
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={newVaultAsset.depositDate}
                  onChange={(e) => setNewVaultAsset({ ...newVaultAsset, depositDate: e.target.value })}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newVaultAsset.vaultLocation}
                  onChange={(e) => setNewVaultAsset({ ...newVaultAsset, vaultLocation: e.target.value })}
                  placeholder="Vault location"
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newVaultAsset.insuranceStatus}
                  onChange={(e) => setNewVaultAsset({ ...newVaultAsset, insuranceStatus: e.target.value })}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {insuranceStatusOptions.map((insuranceStatus) => (
                    <option key={insuranceStatus} value={insuranceStatus}>{insuranceStatus}</option>
                  ))}
                </select>
                <select
                  value={newVaultAsset.status}
                  onChange={(e) => setNewVaultAsset({ ...newVaultAsset, status: e.target.value })}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {vaultStatusOptions.map((status) => (
                    <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddVaultAsset}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  Add Asset
                </button>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Asset</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Weight</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Deposit Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Insurance</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Value</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50">
                        {editingId === asset.id ? (
                          <>
                            <td className="px-6 py-4 font-medium text-slate-900">{asset.assetType}</td>
                            <td className="px-6 py-4 text-slate-600">{asset.customerName}</td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                value={editData.weight}
                                onChange={(e) => setEditData({...editData, weight: parseFloat(e.target.value)})}
                                className="border rounded px-2 py-1 w-20"
                              />
                              <span className="ml-1 text-slate-500">{asset.unit}</span>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="date"
                                value={editData.depositDate}
                                onChange={(e) => setEditData({...editData, depositDate: e.target.value})}
                                className="border rounded px-2 py-1"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={editData.status}
                                onChange={(e) => setEditData({...editData, status: e.target.value})}
                                className="border rounded px-2 py-1"
                              >
                                {vaultStatusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={editData.insuranceStatus}
                                onChange={(e) => setEditData({...editData, insuranceStatus: e.target.value})}
                                className="border rounded px-2 py-1"
                              >
                                {insuranceStatusOptions.map((insuranceStatus) => <option key={insuranceStatus} value={insuranceStatus}>{insuranceStatus}</option>)}
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                value={editData.value}
                                onChange={(e) => setEditData({...editData, value: parseFloat(e.target.value)})}
                                className="border rounded px-2 py-1 w-28"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button onClick={handleSave} disabled={isSaving} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50">
                                  <Save className="w-4 h-4" />
                                </button>
                                <button onClick={handleCancel} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 font-medium text-slate-900">{asset.assetType}</td>
                            <td className="px-6 py-4 text-slate-600">{asset.customerName}</td>
                            <td className="px-6 py-4 text-slate-600">{asset.weight} {asset.unit}</td>
                            <td className="px-6 py-4 text-slate-600">{formatDate(asset.depositDate)}</td>
                            <td className="px-6 py-4"><StatusBadge status={asset.status} /></td>
                            <td className="px-6 py-4 text-slate-600">{asset.insuranceStatus}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(asset.value)}</td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button onClick={() => handleEdit(asset)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteVaultAsset(asset.id)} disabled={isSaving} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Add User</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Full name"
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Email address"
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddUser}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
                >
                  Create User
                </button>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Assign Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${user.isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 capitalize">{user.status}</td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

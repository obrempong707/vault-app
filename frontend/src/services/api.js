const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const AUTH_TOKEN_STORAGE_KEY = 'vaultlogix_auth_token';

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const authToken = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const authApi = {
  login: (data) => request('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  logout: () => request('/logout', {
    method: 'POST',
  }),
};

// ─── Shipments ─────────────────────────────────────────
export const shipmentApi = {
  getAll: () => request('/shipments'),
  
  getById: (id) => request(`/shipments/${id}`),
  
  track: (trackingId) => request(`/track/${trackingId}`),
  
  create: (data) => request('/shipments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  createFromVaultAsset: (data) => request('/shipments/from-vault-asset', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => request(`/shipments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  updateByTracking: (trackingId, data) => request(`/shipments/track/${encodeURIComponent(trackingId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => request(`/shipments/${id}`, {
    method: 'DELETE',
  }),
};

// ─── Vault Assets ──────────────────────────────────────
export const vaultApi = {
  getAll: () => request('/vault-assets'),
  
  getById: (id) => request(`/vault-assets/${id}`),
  
  getByCustomer: (customerId) => request(`/vault-assets/customer/${customerId}`),
  
  search: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/vault-assets/search?${queryString}`);
  },
  
  create: (data) => request('/vault-assets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => request(`/vault-assets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => request(`/vault-assets/${id}`, {
    method: 'DELETE',
  }),
};

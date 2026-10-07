const API_BASE = '/api';

export interface User {
  id: string;
  email: string;
  role: string;
  full_name: string;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('assettrust_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password?: string }) =>
      apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    demoSwitch: (roleOrEmail: { role?: string; email?: string }) =>
      apiRequest('/auth/demo-switch', { method: 'POST', body: JSON.stringify(roleOrEmail) }),
    me: () => apiRequest('/auth/me'),
    getAccounts: () => apiRequest('/auth/accounts'),
  },

  // Assets
  assets: {
    list: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return apiRequest(`/assets${q ? `?${q}` : ''}`);
    },
    get: (id: string) => apiRequest(`/assets/${id}`),
    create: (data: any) => apiRequest('/assets', { method: 'POST', body: JSON.stringify(data) }),
    freeze: (id: string, reason: string) =>
      apiRequest(`/assets/${id}/freeze`, { method: 'POST', body: JSON.stringify({ reason }) }),
    unfreeze: (id: string) =>
      apiRequest(`/assets/${id}/unfreeze`, { method: 'POST' }),
  },

  // Verification & AI
  verification: {
    upload: (assetId: string, formData: FormData) =>
      apiRequest(`/verification/${assetId}/upload`, { method: 'POST', body: formData }),
    run: (assetId: string) =>
      apiRequest(`/verification/${assetId}/run`, { method: 'POST' }),
    loadPreset: (assetId: string, presetType: 'pass' | 'mismatch' | 'encumbered') =>
      apiRequest(`/verification/${assetId}/preset/${presetType}`, { method: 'POST' }),
  },

  // Compliance
  compliance: {
    getPending: () => apiRequest('/compliance/pending'),
    approve: (assetId: string, notes?: string) =>
      apiRequest(`/compliance/${assetId}/approve`, { method: 'POST', body: JSON.stringify({ notes }) }),
    reject: (assetId: string, reason?: string) =>
      apiRequest(`/compliance/${assetId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    requestReview: (assetId: string, instructions?: string) =>
      apiRequest(`/compliance/${assetId}/request-review`, { method: 'POST', body: JSON.stringify({ instructions }) }),
  },

  // Tokenization
  tokenization: {
    get: (assetId: string) => apiRequest(`/tokenization/${assetId}`),
    tokenize: (assetId: string, config: any) =>
      apiRequest(`/tokenization/${assetId}`, { method: 'POST', body: JSON.stringify(config) }),
  },

  // Transfers
  transfers: {
    list: (assetId?: string) => apiRequest(`/transfers${assetId ? `?assetId=${assetId}` : ''}`),
    transfer: (data: { asset_id: string; to_email: string; amount: number; reason?: string }) =>
      apiRequest('/transfers', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Holdings / Portfolio
  holdings: {
    get: (all?: boolean) => apiRequest(`/holdings${all ? '?all=true' : ''}`),
  },

  // Encumbrances
  encumbrances: {
    list: (assetId: string) => apiRequest(`/encumbrances/${assetId}`),
    add: (assetId: string, data: { lender_name: string; amount: number; encumbrance_type?: string; notes?: string }) =>
      apiRequest(`/encumbrances/${assetId}`, { method: 'POST', body: JSON.stringify(data) }),
    release: (encumbranceId: string) =>
      apiRequest(`/encumbrances/${encumbranceId}/release`, { method: 'POST' }),
  },

  // Settlements
  settlements: {
    list: () => apiRequest('/settlements'),
    create: (data: { asset_id: string; token_amount: number; seller_email?: string }) =>
      apiRequest('/settlements', { method: 'POST', body: JSON.stringify(data) }),
    simulatePayment: (id: string) =>
      apiRequest(`/settlements/${id}/simulate-payment`, { method: 'POST' }),
    cancel: (id: string) =>
      apiRequest(`/settlements/${id}/cancel`, { method: 'POST' }),
  },

  // Audit
  audit: {
    list: (assetId?: string) => apiRequest(`/audit${assetId ? `?assetId=${assetId}` : ''}`),
  },

  // Stats
  stats: {
    get: () => apiRequest('/stats'),
  },

  // DRUNIX
  drunix: {
    getStatus: () => apiRequest('/drunix/status'),
    getBlocks: () => apiRequest('/drunix/blocks'),
    getAssetHistory: (assetId: string) => apiRequest(`/drunix/asset/${assetId}/history`),
  }
};

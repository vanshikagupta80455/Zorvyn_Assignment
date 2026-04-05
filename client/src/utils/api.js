const API_BASE = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('finance_token');
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.error || data.errors?.join(', ') || 'Something went wrong',
      data,
    };
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getProfile: () => apiRequest('/auth/me'),

  register: (userData) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Users
  getUsers: () => apiRequest('/users'),
  getUser: (id) => apiRequest(`/users/${id}`),
  updateUser: (id, data) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUser: (id) =>
    apiRequest(`/users/${id}`, { method: 'DELETE' }),

  // Records
  getRecords: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        searchParams.append(key, value);
      }
    });
    return apiRequest(`/records?${searchParams.toString()}`);
  },
  getRecord: (id) => apiRequest(`/records/${id}`),
  createRecord: (data) =>
    apiRequest('/records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRecord: (id, data) =>
    apiRequest(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRecord: (id) =>
    apiRequest(`/records/${id}`, { method: 'DELETE' }),

  // Dashboard
  getSummary: () => apiRequest('/dashboard/summary'),
  getCategoryTotals: () => apiRequest('/dashboard/category-totals'),
  getTrends: () => apiRequest('/dashboard/trends'),
  getRecentActivity: (limit = 10) => apiRequest(`/dashboard/recent?limit=${limit}`),
};

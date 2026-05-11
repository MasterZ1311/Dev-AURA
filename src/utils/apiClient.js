import { auth } from '../firebaseConfig'; // Ensure this path is correct

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = async (endpoint, options = {}) => {
  const user = auth.currentUser;
  let token = '';
  
  if (user) {
    token = await user.getIdToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || 'API request failed');
  }

  return response.json();
};

export const api = {
  get: (endpoint) => apiClient(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiClient(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiClient(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => apiClient(endpoint, { method: 'DELETE' }),
};

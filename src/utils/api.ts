const BASE_URL = 'http://localhost:5000/api';

export const api = {
  getToken: () => localStorage.getItem('hyperos_token'),
  setToken: (token: string) => localStorage.setItem('hyperos_token', token),
  logout: () => {
     localStorage.removeItem('hyperos_token');
     window.location.reload();
  },

  post: async (endpoint: string, body: any) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(api.getToken() ? { 'Authorization': `Bearer ${api.getToken()}` } : {})
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  },

  get: async (endpoint: string) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        ...(api.getToken() ? { 'Authorization': `Bearer ${api.getToken()}` } : {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  }
};

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tenant APIs
export const tenantApi = {
  getAll: () => api.get('/tenants'),
  getById: (id: string) => api.get(`/tenants/${id}`),
  create: (data: { name: string; description?: string }) => api.post('/tenants', data),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  delete: (id: string) => api.delete(`/tenants/${id}`),
  getStats: (id: string) => api.get(`/tenants/${id}/stats`),
};

// Rate Limit APIs
export const rateLimitApi = {
  getByTenant: (tenantId: string) => api.get(`/rate-limits/tenant/${tenantId}`),
  create: (data: any) => api.post('/rate-limits', data),
  update: (id: string, data: any) => api.put(`/rate-limits/${id}`, data),
  toggle: (id: string, isActive: boolean) => api.patch(`/rate-limits/${id}/toggle`, { isActive }),
  delete: (id: string) => api.delete(`/rate-limits/${id}`),
};

// Rate Limiter Check API
export const rateLimiterApi = {
  check: (data: {
    tenantId: string;
    apiRoute?: string;
    ipAddress?: string;
    userId?: string;
  }) => api.post('/', data),
  getLogs: (tenantId: string, limit?: number) => 
    api.get(`/logs/${tenantId}`, { params: { limit } }),
  getStats: (tenantId: string, fromDate?: string) => 
    api.get(`/stats/${tenantId}`, { params: { fromDate } }),
};

export default api;

'use client';

import { useState, useEffect } from 'react';
import { rateLimitApi, tenantApi } from '@/lib/api';

interface RateLimitConfigProps {
  selectedTenant: any;
}

const RATE_LIMIT_TYPES = [
  { value: 'GLOBAL', label: 'Global', desc: 'Tenant-wide rate limiting' },
  { value: 'IP_ADDRESS', label: 'IP Address', desc: 'Per IP address' },
  { value: 'API_ROUTE', label: 'API Route', desc: 'Per API endpoint' },
  { value: 'USER_ID', label: 'User ID', desc: 'Per individual user' },
];

const TIME_WINDOWS = [
  { value: 1000, label: '1 second' },
  { value: 60000, label: '1 minute' },
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' },
  { value: 3600000, label: '1 hour' },
  { value: 86400000, label: '1 day' },
];

export default function RateLimitConfig({ selectedTenant }: RateLimitConfigProps) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [rateLimits, setRateLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'GLOBAL',
    identifier: '',
    maxRequests: 100,
    windowMs: 60000,
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      setCurrentTenant(selectedTenant);
    }
  }, [selectedTenant]);

  useEffect(() => {
    if (currentTenant) {
      fetchRateLimits();
    }
  }, [currentTenant]);

  const fetchTenants = async () => {
    try {
      const response = await tenantApi.getAll();
      setTenants(response.data);
      if (response.data.length > 0 && !currentTenant) {
        setCurrentTenant(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchRateLimits = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const response = await rateLimitApi.getByTenant(currentTenant.id);
      setRateLimits(response.data);
    } catch (error) {
      console.error('Error fetching rate limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    try {
      await rateLimitApi.create({
        tenantId: currentTenant.id,
        ...formData,
        identifier: formData.type === 'API_ROUTE' ? formData.identifier : null,
      });
      setFormData({ type: 'GLOBAL', identifier: '', maxRequests: 100, windowMs: 60000 });
      setShowModal(false);
      await fetchRateLimits();
      await fetchTenants(); // Refresh tenant list to update counts
    } catch (error) {
      console.error('Error creating rate limit:', error);
      alert('Error creating rate limit. Make sure the configuration is unique.');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await rateLimitApi.toggle(id, !isActive);
      await fetchRateLimits();
      await fetchTenants(); // Refresh tenant list to update counts
    } catch (error) {
      console.error('Error toggling rate limit:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this rate limit?')) {
      try {
        await rateLimitApi.delete(id);
        await fetchRateLimits();
        await fetchTenants(); // Refresh tenant list to update counts
      } catch (error) {
        console.error('Error deleting rate limit:', error);
      }
    }
  };

  const formatTimeWindow = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds} second${seconds > 1 ? 's' : ''}`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
    const days = hours / 24;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  if (tenants.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏢</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Tenants Yet</h3>
        <p className="text-slate-400">Please create a tenant first from the Tenants tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Rate Limit Configuration</h2>
            <p className="text-slate-400">Configure rate limiting strategies for your tenants</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={!currentTenant}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Rate Limit</span>
          </button>
        </div>
        
        {/* Tenant Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Tenant
          </label>
          <select
            value={currentTenant?.id || ''}
            onChange={(e) => {
              const selected = tenants.find((t) => t.id === e.target.value);
              setCurrentTenant(selected);
            }}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.rateLimits?.length || 0} rate limits)
              </option>
            ))}
          </select>
          {currentTenant && (
            <div className="mt-3 flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">API Key:</span>
                <code className="px-2 py-1 bg-slate-900 rounded text-xs text-blue-400 font-mono">
                  {currentTenant.apiKey}
                </code>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentTenant.isActive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {currentTenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {RATE_LIMIT_TYPES.map((type) => {
          const count = rateLimits.filter((rl) => rl.type === type.value && rl.isActive).length;
          return (
            <div key={type.value} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">{type.label}</div>
              <div className="text-2xl font-bold text-white mt-1">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Rate Limits List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : rateLimits.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700">
          <div className="text-6xl mb-4">⚙️</div>
          <h3 className="text-xl font-semibold text-white mb-2">No rate limits configured</h3>
          <p className="text-slate-400 mb-6">Add your first rate limit to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Rate Limit
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rateLimits.map((limit) => {
            const typeInfo = RATE_LIMIT_TYPES.find((t) => t.value === limit.type);
            return (
              <div
                key={limit.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{typeInfo?.label}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            limit.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {limit.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{typeInfo?.desc}</p>
                      
                      {limit.identifier && (
                        <div className="mb-3">
                          <span className="text-xs text-slate-500">Identifier:</span>
                          <code className="ml-2 px-2 py-1 bg-slate-900/50 rounded text-sm text-blue-400 font-mono">
                            {limit.identifier}
                          </code>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Max Requests</div>
                          <div className="text-2xl font-bold text-white">{limit.maxRequests}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Time Window</div>
                          <div className="text-2xl font-bold text-white">{formatTimeWindow(limit.windowMs)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleToggle(limit.id, limit.isActive)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        limit.isActive
                          ? 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400'
                          : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                      }`}
                    >
                      {limit.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(limit.id)}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-2xl font-bold text-white mb-4">Add Rate Limit</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Limit Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {RATE_LIMIT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {RATE_LIMIT_TYPES.find((t) => t.value === formData.type)?.desc}
                </p>
              </div>

              {formData.type === 'API_ROUTE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    API Route *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., /api/users"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Requests *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.maxRequests}
                  onChange={(e) => setFormData({ ...formData, maxRequests: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Time Window *
                </label>
                <select
                  value={formData.windowMs}
                  onChange={(e) => setFormData({ ...formData, windowMs: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {TIME_WINDOWS.map((window) => (
                    <option key={window.value} value={window.value}>
                      {window.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ type: 'GLOBAL', identifier: '', maxRequests: 100, windowMs: 60000 });
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

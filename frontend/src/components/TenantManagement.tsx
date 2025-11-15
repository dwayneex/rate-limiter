'use client';

import { useState, useEffect } from 'react';
import { tenantApi } from '@/lib/api';

interface TenantManagementProps {
  onSelectTenant: (tenant: any) => void;
}

export default function TenantManagement({ onSelectTenant }: TenantManagementProps) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await tenantApi.getAll();
      setTenants(response.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tenantApi.create(formData);
      setFormData({ name: '', description: '' });
      setShowModal(false);
      fetchTenants();
    } catch (error) {
      console.error('Error creating tenant:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tenant?')) {
      try {
        await tenantApi.delete(id);
        fetchTenants();
      } catch (error) {
        console.error('Error deleting tenant:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Tenant Management</h2>
          <p className="text-slate-400 mt-1">Manage your API tenants and their configurations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Create Tenant
        </button>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-all cursor-pointer"
            onClick={() => onSelectTenant(tenant)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {tenant.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  tenant.isActive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {tenant.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{tenant.name}</h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
              {tenant.description || 'No description provided'}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Rate Limits:</span>
                <span className="font-medium text-white">{tenant.rateLimits?.length || 0}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Requests:</span>
                <span className="font-medium text-white">{tenant._count?.requestLogs || 0}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-xs text-slate-500 mb-2">API Key</div>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-slate-900/50 px-3 py-2 rounded text-xs text-slate-300 font-mono truncate">
                  {tenant.apiKey}
                </code>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(tenant.apiKey);
                  }}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(tenant.id);
                }}
                className="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {tenants.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-white mb-2">No tenants yet</h3>
          <p className="text-slate-400 mb-6">Create your first tenant to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Create Tenant
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold text-white mb-4">Create New Tenant</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ name: '', description: '' });
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

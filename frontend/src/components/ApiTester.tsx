'use client';

import { useState, useEffect } from 'react';
import { rateLimiterApi, tenantApi } from '@/lib/api';

export default function ApiTester() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    tenantId: '',
    apiRoute: '/api/users',
    ipAddress: '192.168.1.1',
    userId: 'user-123',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await tenantApi.getAll();
      setTenants(response.data);
      if (response.data.length > 0) {
        setFormData((prev) => ({ ...prev, tenantId: response.data[0].apiKey }));
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await rateLimiterApi.check({
        tenantId: formData.tenantId,
        apiRoute: formData.apiRoute || undefined,
        ipAddress: formData.ipAddress || undefined,
        userId: formData.userId || undefined,
      });

      const newResult = {
        ...response.data,
        timestamp: new Date().toISOString(),
        request: { ...formData },
      };

      setResult(newResult);
      setHistory((prev) => [newResult, ...prev.slice(0, 9)]);
    } catch (error: any) {
      setResult({
        error: true,
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTenant = tenants.find((t) => t.apiKey === formData.tenantId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">API Testing Tool</h2>
        <p className="text-slate-400">Test your rate limiting configuration with simulated API calls</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Test Request</h3>
          <form onSubmit={handleTest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tenant *
              </label>
              <select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.apiKey}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Route
              </label>
              <input
                type="text"
                value={formData.apiRoute}
                onChange={(e) => setFormData({ ...formData, apiRoute: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="/api/users"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                IP Address
              </label>
              <input
                type="text"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="192.168.1.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="user-123"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.tenantId}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Testing...' : 'Test Request'}
            </button>
          </form>

          {selectedTenant && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="text-sm text-slate-400 mb-2">Active Rate Limits</div>
              <div className="text-sm text-white">
                {selectedTenant.rateLimits?.filter((rl: any) => rl.isActive).length || 0} configured
              </div>
            </div>
          )}
        </div>

        {/* Response */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Response</h3>
          
          {!result ? (
            <div className="text-center py-12 text-slate-500">
              <p>No response yet. Send a test request to see results.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  result.statusCode === 200
                    ? 'bg-green-500/10 border-green-500/50 text-green-400'
                    : 'bg-red-500/10 border-red-500/50 text-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Status Code</span>
                  <span className="text-2xl font-bold">{result.statusCode || 'Error'}</span>
                </div>
                <div className="text-sm">{result.message}</div>
              </div>

              {/* Details */}
              {result.allowed !== undefined && (
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-2">Allowed</div>
                  <div className="text-lg font-semibold text-white">
                    {result.allowed ? 'Yes' : 'No'}
                  </div>
                </div>
              )}

              {result.limits && result.limits.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-3">Rate Limit Details</div>
                  <div className="space-y-2">
                    {result.limits.map((limit: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <div className="flex justify-between text-white mb-1">
                          <span>{limit.type}</span>
                          <span className={limit.allowed ? 'text-green-400' : 'text-red-400'}>
                            {limit.allowed ? 'Allowed' : 'Blocked'}
                          </span>
                        </div>
                        <div className="text-slate-400">
                          Remaining: {limit.remaining}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* JSON Response */}
              <details className="bg-slate-900/50 rounded-lg">
                <summary className="px-4 py-3 text-sm text-slate-400 cursor-pointer hover:text-white">
                  View Full Response
                </summary>
                <pre className="px-4 pb-4 text-xs text-slate-300 overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>

      {/* Request History */}
      {history.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Request History</h3>
          <div className="space-y-2">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      item.statusCode === 200 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></span>
                  <div className="flex-1">
                    <div className="text-sm text-white">
                      {item.request.apiRoute || 'No route'} • {item.request.ipAddress || 'No IP'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.statusCode === 200
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {item.statusCode}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

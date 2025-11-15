'use client';

import { useState, useEffect } from 'react';
import { tenantApi } from '@/lib/api';

export default function Dashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await tenantApi.getAll();
      setTenants(response.data);

      // Fetch stats for each tenant
      const statsPromises = response.data.map((tenant: any) =>
        tenantApi.getStats(tenant.id).catch(() => null)
      );
      const statsResults = await Promise.all(statsPromises);
      
      const statsMap: any = {};
      response.data.forEach((tenant: any, idx: number) => {
        if (statsResults[idx]) {
          statsMap[tenant.id] = statsResults[idx].data.stats;
        }
      });
      setStats(statsMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRequests = Object.values(stats).reduce(
    (sum: number, stat: any) => sum + (stat?.totalRequests || 0),
    0
  );
  const totalAllowed = Object.values(stats).reduce(
    (sum: number, stat: any) => sum + (stat?.allowedRequests || 0),
    0
  );
  const totalBlocked = Object.values(stats).reduce(
    (sum: number, stat: any) => sum + (stat?.blockedRequests || 0),
    0
  );

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
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-slate-400">Overview of your rate limiting system</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/50 rounded-xl p-6">
          <div className="mb-2">
            <span className="text-blue-400 text-sm font-medium">Total Tenants</span>
          </div>
          <div className="text-4xl font-bold text-white">{tenants.length}</div>
          <div className="text-sm text-blue-300 mt-2">
            {tenants.filter((t) => t.isActive).length} active
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/50 rounded-xl p-6">
          <div className="mb-2">
            <span className="text-green-400 text-sm font-medium">Total Requests</span>
          </div>
          <div className="text-4xl font-bold text-white">{totalRequests.toLocaleString()}</div>
          <div className="text-sm text-green-300 mt-2">All time</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/50 rounded-xl p-6">
          <div className="mb-2">
            <span className="text-emerald-400 text-sm font-medium">Allowed</span>
          </div>
          <div className="text-4xl font-bold text-white">{totalAllowed.toLocaleString()}</div>
          <div className="text-sm text-emerald-300 mt-2">
            {totalRequests > 0 ? ((totalAllowed / totalRequests) * 100).toFixed(1) : 0}% pass rate
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/50 rounded-xl p-6">
          <div className="mb-2">
            <span className="text-red-400 text-sm font-medium">Blocked</span>
          </div>
          <div className="text-4xl font-bold text-white">{totalBlocked.toLocaleString()}</div>
          <div className="text-sm text-red-300 mt-2">
            {totalRequests > 0 ? ((totalBlocked / totalRequests) * 100).toFixed(1) : 0}% blocked
          </div>
        </div>
      </div>

      {/* Tenant Statistics */}
      {tenants.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Tenant Overview</h3>
          <div className="space-y-4">
            {tenants.map((tenant) => {
              const tenantStats = stats[tenant.id] || {
                totalRequests: 0,
                allowedRequests: 0,
                blockedRequests: 0,
                blockRate: 0,
              };

              return (
                <div
                  key={tenant.id}
                  className="bg-slate-900/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">
                          {tenant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{tenant.name}</h4>
                        <p className="text-xs text-slate-500">{tenant.rateLimits?.length || 0} rate limits</p>
                      </div>
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

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Total</div>
                      <div className="text-lg font-semibold text-white">
                        {tenantStats.totalRequests.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Allowed</div>
                      <div className="text-lg font-semibold text-green-400">
                        {tenantStats.allowedRequests.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Blocked</div>
                      <div className="text-lg font-semibold text-red-400">
                        {tenantStats.blockedRequests.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Block Rate</div>
                      <div className="text-lg font-semibold text-yellow-400">
                        {tenantStats.blockRate}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {tenantStats.totalRequests > 0 && (
                    <div className="mt-3">
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(tenantStats.allowedRequests / tenantStats.totalRequests) * 100}%`,
                          }}
                        ></div>
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${(tenantStats.blockedRequests / tenantStats.totalRequests) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tenants.length === 0 && (
        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-2">Welcome to Rate Limiter</h3>
          <p className="text-slate-400 mb-6">Create your first tenant to get started</p>
        </div>
      )}

      {/* System Info */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Rate Limit Types</div>
            <div className="space-y-1 text-sm text-white">
              <div>Global (Tenant-wide)</div>
              <div>IP Address</div>
              <div>API Route</div>
              <div>User ID</div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Caching</div>
            <div className="text-sm text-white">
              <div>Redis Sliding Window</div>
              <div>Config Caching (5 min TTL)</div>
              <div>Auto Cache Invalidation</div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Storage</div>
            <div className="text-sm text-white">
              <div>PostgreSQL Database</div>
              <div>Prisma ORM</div>
              <div>Request Logging</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

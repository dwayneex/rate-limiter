'use client';

import { useState } from 'react';
import TenantManagement from '@/components/TenantManagement';
import RateLimitConfig from '@/components/RateLimitConfig';
import ApiTester from '@/components/ApiTester';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'tenants', name: 'Tenants' },
    { id: 'rate-limits', name: 'Rate Limits' },
    { id: 'api-tester', name: 'API Tester' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">RL</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Rate Limiter</h1>
                <p className="text-xs text-slate-400">API Management Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-blue-500 bg-slate-700/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'tenants' && (
          <TenantManagement onSelectTenant={setSelectedTenant} />
        )}
        {activeTab === 'rate-limits' && (
          <RateLimitConfig selectedTenant={selectedTenant} />
        )}
        {activeTab === 'api-tester' && <ApiTester />}
      </main>
    </div>
  );
}

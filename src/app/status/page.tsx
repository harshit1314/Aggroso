'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HealthStatus {
  app: boolean;
  database: boolean;
  llm: boolean;
  timestamp: string;
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth({
        ...data,
        timestamp: new Date().toLocaleTimeString(),
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    if (!autoRefresh) return;

    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const StatusBadge = ({ status, label }: { status: boolean; label: string }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className={`w-4 h-4 rounded-full ${
            status ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className={`text-sm font-semibold ${status ? 'text-green-600' : 'text-red-600'}`}>
          {status ? 'Healthy' : 'Down'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Health Dashboard</h1>
              <p className="text-gray-600 mt-2">Monitor backend services and API connectivity</p>
            </div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="mb-6 flex gap-4 items-center">
          <button
            onClick={fetchHealth}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 Refresh Now
          </button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-700 font-medium">Auto-refresh (5s)</span>
          </label>
          {health && (
            <span className="text-sm text-gray-600 ml-auto">
              Last updated: {health.timestamp}
            </span>
          )}
        </div>

        {/* Status Cards */}
        {loading && !health ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
            </div>
            <p className="text-gray-600 mt-4">Loading system status...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-900 mb-2">❌ Connection Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={fetchHealth}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : health ? (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Overall Status</h2>
              <div
                className={`p-4 rounded-lg text-center font-semibold ${
                  health.app && health.database && health.llm
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {health.app && health.database && health.llm
                  ? '✅ All Systems Operational'
                  : '⚠️ Some Services Unavailable'}
              </div>
            </div>

            {/* Individual Service Status */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Service Status</h2>

              <StatusBadge
                status={health.app}
                label="🖥️ Application Server"
              />

              <StatusBadge
                status={health.database}
                label="💾 Database (SQLite)"
              />

              <StatusBadge
                status={health.llm}
                label="🤖 LLM / AI Provider"
              />
            </div>

            {/* Details */}
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Configuration Details</h3>
              <div className="space-y-3 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">AI Provider:</span> HuggingFace (Mistral-7B)
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Database:</span> SQLite (./data/knowledge.db)
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Frontend:</span> Next.js 14 + React
                </p>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold text-amber-900 mb-3">Troubleshooting Tips</h3>
              <ul className="text-sm text-amber-800 space-y-2">
                <li>
                  <strong>🤖 LLM Down?</strong> Check your HuggingFace API key in .env.local or verify API rate limits
                </li>
                <li>
                  <strong>💾 Database Down?</strong> Ensure write permissions to ./data directory
                </li>
                <li>
                  <strong>🖥️ App Down?</strong> Restart the development server: npm run dev
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm">
          <p>Health Dashboard • All data refreshes automatically every 5 seconds</p>
        </div>
      </footer>
    </div>
  );
}

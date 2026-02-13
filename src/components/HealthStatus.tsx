'use client';

import { useState, useEffect } from 'react';

interface HealthStatus {
  timestamp: string;
  status: string;
  services: {
    database: string;
    llm: string;
    app: string;
  };
  stats: {
    documentsCount: number;
    totalWords: number;
  };
}

export default function HealthStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'running':
        return 'text-green-600';
      case 'failed':
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'running':
        return '✅';
      case 'failed':
      case 'unhealthy':
        return '❌';
      default:
        return '⚠️';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-gray-500 text-sm">Loading status...</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-red-600 text-sm">Failed to load status</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">System Status</h3>
        <span
          className={`text-sm font-medium ${
            health.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
          }`}
        >
          {health.status === 'healthy' ? '✅ Healthy' : '⚠️ Degraded'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">Database</p>
          <p className={`text-sm font-semibold ${getStatusColor(health.services.database)}`}>
            {getStatusIcon(health.services.database)} {health.services.database}
          </p>
        </div>

        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">LLM Service</p>
          <p className={`text-sm font-semibold ${getStatusColor(health.services.llm)}`}>
            {getStatusIcon(health.services.llm)} {health.services.llm}
          </p>
        </div>

        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">App</p>
          <p className={`text-sm font-semibold ${getStatusColor(health.services.app)}`}>
            {getStatusIcon(health.services.app)} {health.services.app}
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
        <p>📊 Documents: {health.stats.documentsCount}</p>
        <p>📝 Total Words: {health.stats.totalWords.toLocaleString()}</p>
        <p>🕐 Last Updated: {new Date(health.timestamp).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

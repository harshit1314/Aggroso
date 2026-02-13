'use client';

import { useState } from 'react';
import DocumentUploader from '@/components/DocumentUploader';
import DocumentList from '@/components/DocumentList';
import QAInterface from '@/components/QAInterface';
import HealthStatus from '@/components/HealthStatus';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDocumentUpload = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            📖 Private Knowledge Q&A
          </h1>
          <p className="text-gray-600 mt-2">
            Upload documents, ask questions, and get intelligent answers with source attribution
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Getting Started Steps */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">🚀 Quick Start</h2>
          <ol className="space-y-2 text-blue-800 text-sm">
            <li>
              <span className="font-semibold">1. Upload Documents:</span> Click "Upload Document"
              below to add text files (TXT, MD, CSV)
            </li>
            <li>
              <span className="font-semibold">2. View Your Docs:</span> See all uploaded documents
              in the list
            </li>
            <li>
              <span className="font-semibold">3. Ask Questions:</span> Enter any question about
              your documents
            </li>
            <li>
              <span className="font-semibold">4. Get Answers:</span> See AI-powered answers with
              source attribution
            </li>
          </ol>
        </div>

        {/* Health Status */}
        <div className="mb-8">
          <HealthStatus />
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload */}
          <div className="lg:col-span-1">
            <DocumentUploader onSuccess={handleDocumentUpload} />
          </div>

          {/* Middle Column - Q&A */}
          <div className="lg:col-span-2">
            <QAInterface />
          </div>
        </div>

        {/* Document List - Full Width */}
        <div className="mt-8">
          <DocumentList refreshKey={refreshKey} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm">
          <p>
            Private Knowledge Q&A • Built with Next.js, TypeScript, and HuggingFace • Data stored locally
          </p>
          <p className="mt-2 space-x-4">
            <a href="/api/health" className="text-blue-600 hover:text-blue-700">
              API Health
            </a>
            <a href="/status" className="text-blue-600 hover:text-blue-700">
              Dashboard
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface Document {
  id: string;
  name: string;
  uploadedAt: string;
  wordCount: number;
}

interface DocumentListProps {
  refreshKey?: number;
}

export default function DocumentList({ refreshKey = 0 }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [refreshKey]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');

      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📚 Your Documents</h2>
        <p className="text-gray-500">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📚 Your Documents</h2>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No documents uploaded yet. Start by uploading a document above.
        </p>
      ) : (
        <>
          <p className="text-gray-600 mb-4 text-sm">
            Total: {documents.length} document{documents.length !== 1 ? 's' : ''} •{' '}
            {documents.reduce((sum, doc) => sum + doc.wordCount, 0).toLocaleString()} words
          </p>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{doc.name}</h3>
                  <p className="text-sm text-gray-500">
                    {doc.wordCount} words •{' '}
                    {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="ml-4 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

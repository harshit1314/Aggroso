'use client';

import { useState, ChangeEvent, FormEvent } from 'react';

interface UploadProps {
  onSuccess: () => void;
}

export default function DocumentUploader({ onSuccess }: UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('text/')) {
        setError('Only text files are allowed');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      if (!customName) {
        setCustomName(selectedFile.name.replace(/\.[^.]*$/, ''));
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (customName) {
        formData.append('name', customName);
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to upload document';
        try {
          const data = await response.json();
          errorMessage = data.error || `Server error: ${response.status}`;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccess(
        `Document "${data.document.name}" uploaded successfully (${data.document.wordCount} words)`
      );
      setFile(null);
      setCustomName('');

      // Reset form
      const form = e.target as HTMLFormElement;
      form.reset();

      // Call parent callback
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📄 Upload Document</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
          <input
            type="file"
            accept="text/*,.txt,.md,.csv"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">Supported: .txt, .md, .csv, and other text files</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Name (Optional)</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g., API Documentation"
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
            text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {loading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
          ✅ {success}
        </div>
      )}
    </div>
  );
}

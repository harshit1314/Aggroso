'use client';

import { useState, FormEvent } from 'react';

interface Source {
  documentId: string;
  chunkIndex: number;
  preview: string;
}

interface QAResponse {
  answer: string;
  sources: Source[];
}

export default function QAInterface() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<QAResponse | null>(null);
  const [history, setHistory] = useState<Array<{ question: string; response: QAResponse }>>([]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get answer');
      }

      const data = await res.json();
      setResponse(data);
      setHistory([{ question: question.trim(), response: data }, ...history]);
      setQuestion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🤖 Ask a Question</h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            maxLength={2000}
            placeholder="Ask a question about your documents... (max 2000 characters)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500
              disabled:opacity-50 resize-none"
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-1">
            {question.length} / 2000 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
            text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Thinking...' : 'Get Answer'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm mb-6">
          ⚠️ {error}
        </div>
      )}

      {response && (
        <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-gray-800 mb-3">📝 Answer:</h3>
          <p className="text-gray-700 whitespace-pre-wrap mb-4">{response.answer}</p>

          {response.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <h4 className="font-semibold text-gray-700 mb-2">📌 Sources:</h4>
              <div className="space-y-2">
                {response.sources.map((source, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border border-green-100 text-sm">
                    <p className="font-medium text-gray-700">
                      Document: {source.documentId.slice(0, 8)} (Chunk {source.chunkIndex + 1})
                    </p>
                    <p className="text-gray-600 italic mt-1">{source.preview}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">📖 Query History</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.slice(0, 5).map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-700 mb-1">Q: {item.question}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{item.response.answer}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {item.response.sources.length} source{item.response.sources.length !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

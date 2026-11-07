import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StartBlogForm from '../components/forms/StartBlogForm';
import { startBlogGeneration } from '../api/blogApi';
import { AlertCircle } from 'lucide-react';

export default function CreateBlogPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartWorkflow = async (topic, audience, style) => {
    setLoading(true);
    setError(null);
    try {
      const response = await startBlogGeneration(topic, audience, style);
      // Navigate to the thread-specific workspace route!
      navigate(`/blog/${response.thread_id}`, { state: { initialData: response } });
    } catch (err) {
      setError(err.message || 'Failed to start workflow. Ensure FastAPI is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      {error && (
        <div className="max-w-2xl mx-auto p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1 text-xs">
            <span className="font-semibold block text-sm mb-0.5">Workflow Startup Error</span>
            {error}
          </div>
        </div>
      )}

      <StartBlogForm onStart={handleStartWorkflow} loading={loading} />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import PipelineStepper from '../components/workflow/PipelineStepper';
import ApprovalPanel from '../components/review/ApprovalPanel';
import MarkdownViewer from '../components/viewer/MarkdownViewer';
import { getBlogState, resumeBlogWorkflow } from '../api/blogApi';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function BlogWorkspacePage() {
  const { threadId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [workflowState, setWorkflowState] = useState(location.state?.initialData || null);
  const [loading, setLoading] = useState(!location.state?.initialData);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch thread state on mount (or if page is refreshed)
  const fetchState = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBlogState(threadId);
      setWorkflowState(data);
    } catch (err) {
      setError(err.message || 'Failed to load thread state. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    if (!location.state?.initialData) {
      fetchState();
    }
  }, [fetchState, location.state]);

  const handleResumeWorkflow = async (action, feedback = '') => {
    if (!threadId) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await resumeBlogWorkflow(threadId, action, feedback);
      setWorkflowState(response);
    } catch (err) {
      setError(err.message || 'Failed to resume workflow.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="h-8 w-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading session state ({threadId.slice(0, 8)}...)...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Thread Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">Session: {threadId}</span>
          <button
            onClick={fetchState}
            title="Refresh State"
            className="p-1 hover:text-white text-slate-400 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1 text-xs">
            <span className="font-semibold block text-sm mb-0.5">Workflow Error</span>
            {error}
          </div>
        </div>
      )}

      {/* Pipeline Stepper Tracker */}
      {workflowState && (
        <PipelineStepper
          currentStage={workflowState.stage}
          status={workflowState.status}
        />
      )}

      {/* Review Gate (Gate 1 or Gate 2) */}
      {workflowState && workflowState.status === 'awaiting_approval' && (
        <ApprovalPanel
          stage={workflowState.stage}
          content={workflowState.content_for_review}
          sources={workflowState.sources}
          revisionCount={workflowState.revision_count}
          maxRevisions={workflowState.max_revisions}
          onApprove={(feedback) => handleResumeWorkflow('approve', feedback)}
          onRevise={(feedback) => handleResumeWorkflow('revise', feedback)}
          loading={actionLoading}
        />
      )}

      {/* Final Completed Article */}
      {workflowState && workflowState.status === 'completed' && workflowState.final_blog && (
        <MarkdownViewer
          content={workflowState.final_blog}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

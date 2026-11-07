import React, { useState, createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from '../viewer/MermaidDiagram';

const PreContext = createContext(false);
import { 
  CheckCircle2, 
  RotateCcw, 
  ExternalLink, 
  Globe, 
  ShieldCheck, 
  Eye, 
  Code
} from 'lucide-react';

export default function ApprovalPanel({
  stage,
  content,
  sources = [],
  revisionCount = 0,
  maxRevisions = 2,
  onApprove,
  onRevise,
  loading
}) {
  const [feedback, setFeedback] = useState('');
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'raw'
  const isOutlineReview = stage === 'review_research' || stage === 'awaiting_research_review';
  const revisionsRemaining = maxRevisions - revisionCount;

  const handleRevise = () => {
    if (!feedback.trim()) return;
    onRevise(feedback.trim());
    setFeedback('');
  };

  const reviewComponents = {
    h1: ({ children }) => (
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 pb-2 border-b border-slate-800">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg sm:text-xl font-bold text-indigo-300 mt-6 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm sm:text-base font-semibold text-slate-100 mt-4 mb-2">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-sm text-slate-300 leading-relaxed mb-3">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-outside pl-5 mb-4 space-y-1.5 text-slate-300 text-sm">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside pl-5 mb-4 space-y-1.5 text-slate-300 text-sm">
        {children}
      </ol>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-indigo-500 bg-indigo-950/20 px-3.5 py-2 my-3 rounded-r-lg italic text-slate-300 text-xs">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-4 rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-slate-900 border-b border-slate-800 text-slate-200 font-semibold">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-slate-800/60 text-slate-300">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-slate-800/30 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2.5 font-semibold text-slate-200">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2.5 text-slate-300">
        {children}
      </td>
    ),
    pre: ({ children }) => (
      <PreContext.Provider value={true}>
        {children}
      </PreContext.Provider>
    ),
    code: ({ node, className, children }) => {
      const isInsidePre = useContext(PreContext);
      const codeString = String(children).replace(/\n$/, '');

      const isMermaid =
        (className && className.includes('mermaid')) ||
        codeString.startsWith('flowchart') ||
        codeString.startsWith('graph TD') ||
        codeString.startsWith('graph LR') ||
        codeString.startsWith('sequenceDiagram') ||
        codeString.startsWith('stateDiagram') ||
        codeString.startsWith('classDiagram');

      if (isMermaid) {
        return <MermaidDiagram chart={codeString} />;
      }

      // In react-markdown v9, 'inline' prop was removed.
      // Distinguish inline code vs block code:
      const isBlock = isInsidePre || Boolean(className && /language-/.test(className)) || String(children).includes('\n');

      if (!isBlock) {
        return (
          <code className="bg-slate-800 text-indigo-300 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-700 font-medium">
            {children}
          </code>
        );
      }

      return (
        <pre className="my-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed">
          <code>{children}</code>
        </pre>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {isOutlineReview ? 'Gate 1: Review Research Outline' : 'Gate 2: Review Article Draft'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isOutlineReview
                ? 'Inspect the agent outline and verified web sources before generating the full draft.'
                : 'Review the written draft and code snippets before the final fact-checker audits citations.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            Revision {revisionCount} of {maxRevisions}
          </span>
          {revisionsRemaining === 0 && (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
              Max Revisions Reached
            </span>
          )}
        </div>
      </div>

      {/* Grounded Web Sources */}
      {sources && sources.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Verified Web Sources ({sources.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sources.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all text-xs"
              >
                <span className="font-medium text-slate-300 group-hover:text-white truncate pr-2">
                  {src.title}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Review Content Box with Toggle View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {isOutlineReview ? 'Generated Technical Outline' : 'Generated Article Draft'}
          </h4>

          {/* Toggle View Mode */}
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Markdown</span>
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="max-h-[500px] overflow-y-auto pr-2">
          {viewMode === 'preview' ? (
            <div className="prose prose-invert prose-indigo max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={reviewComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              readOnly
              value={content}
              rows={16}
              className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-4 rounded-xl border border-slate-800 focus:outline-none leading-relaxed resize-y"
            />
          )}
        </div>
      </div>

      {/* Action Workspace (Feedback & Buttons) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Revision Feedback (Optional if Approving)
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={
              isOutlineReview
                ? 'e.g. Add a dedicated section on distributed tracing and OpenTelemetry benchmarks...'
                : 'e.g. Provide a realistic code example for consumer retry with backoff...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          {revisionsRemaining > 0 && (
            <button
              type="button"
              disabled={loading || !feedback.trim()}
              onClick={handleRevise}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium py-2.5 px-5 rounded-xl border border-slate-700 transition-all text-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Request Revisions (Loops Back)</span>
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => onApprove(feedback.trim())}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/25 text-xs cursor-pointer"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Advancing Pipeline...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isOutlineReview ? 'Approve Outline & Write Draft' : 'Approve Draft & Publish'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

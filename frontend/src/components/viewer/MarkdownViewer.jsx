import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from './MermaidDiagram';

const PreContext = createContext(false);
import { 
  Copy, 
  Check, 
  Download, 
  Eye, 
  Code, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  ExternalLink,
  List,
  Sparkles,
  Edit3,
  RotateCcw
} from 'lucide-react';

export default function MarkdownViewer({ content, onReset }) {
  const [articleContent, setArticleContent] = useState(content || '');
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'edit'
  const [copied, setCopied] = useState(false);
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState(null);

  // Sync if content prop changes from outside
  useEffect(() => {
    setArticleContent(content || '');
  }, [content]);

  const isEdited = articleContent !== (content || '');

  // Extract article title (first H1) if present
  const articleTitle = useMemo(() => {
    if (!articleContent) return null;
    const match = articleContent.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : null;
  }, [articleContent]);

  // Compute article stats
  const stats = useMemo(() => {
    if (!articleContent) return { words: 0, readTime: 1, headings: [] };
    const words = articleContent.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(words / 220));

    // Extract H2 headings for Table of Contents
    const headingMatches = articleContent.match(/^##\s+(.+)$/gm) || [];
    const headings = headingMatches.map((h, i) => {
      const text = h.replace(/^##\s+/, '').trim();
      const id = `heading-${i}`;
      return { id, text };
    });

    return { words, readTime, headings };
  }, [articleContent]);

  const handleCopyFull = () => {
    navigator.clipboard.writeText(articleContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCodeSnippet = (codeText, idx) => {
    navigator.clipboard.writeText(codeText);
    setCopiedSnippetIdx(idx);
    setTimeout(() => setCopiedSnippetIdx(null), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([articleContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = articleTitle
      ? articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60)
      : 'technical-article';
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleResetOriginal = () => {
    setArticleContent(content || '');
  };

  // Custom rich renderers for ReactMarkdown
  const markdownComponents = {
    h1: ({ children }) => (
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pb-3 mb-6 border-b border-slate-800">
        {children}
      </h1>
    ),
    h2: ({ children }) => {
      const text = String(children);
      const idx = stats.headings.findIndex(h => h.text === text);
      const id = idx !== -1 ? stats.headings[idx].id : undefined;
      return (
        <h2 id={id} className="text-xl sm:text-2xl font-bold text-white mt-10 mb-4 pb-2 border-b border-slate-800/80 scroll-mt-20">
          {children}
        </h2>
      );
    },
    h3: ({ children }) => (
      <h3 className="text-base sm:text-lg font-semibold text-slate-100 mt-6 mb-3">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-outside pl-5 mb-5 space-y-2 text-slate-300 text-sm sm:text-base">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside pl-5 mb-5 space-y-2 text-slate-300 text-sm sm:text-base">
        {children}
      </ol>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-indigo-500 bg-indigo-950/20 rounded-r-xl px-4 py-3 my-4 italic text-slate-300 text-sm">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/40 hover:decoration-indigo-400 transition-colors"
      >
        <span>{children}</span>
        <ExternalLink className="w-3 h-3 flex-shrink-0" />
      </a>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-6 rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
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
      <th className="px-4 py-3 font-semibold text-slate-200">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-slate-300">
        {children}
      </td>
    ),
    pre: ({ children }) => (
      <PreContext.Provider value={true}>
        {children}
      </PreContext.Provider>
    ),
    code: ({ node, className, children, ...props }) => {
      const isInsidePre = useContext(PreContext);
      const codeString = String(children).replace(/\n$/, '');

      // Check if code block is a Mermaid diagram
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
        <div className="relative group my-5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 select-none">
            <span>Code Snippet</span>
            <button
              onClick={() => handleCopyCodeSnippet(codeString, codeString.slice(0, 10))}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {copiedSnippetIdx === codeString.slice(0, 10) ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 leading-relaxed">
            <code>{children}</code>
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Article Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready to Publish
                </span>
                <span className="text-xs text-slate-400">Fact-Checked & Verified</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-xl">
                {articleTitle || 'Final Technical Article'}
              </h2>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{stats.words.toLocaleString()} words</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>~{stats.readTime} min read</span>
            </div>
          </div>
        </div>

        {/* Toolbar: Toggle View Mode & Export Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
          {/* View Mode Toggle Pill */}
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl self-start">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Formatted Preview</span>
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'edit'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Markdown</span>
              {isEdited && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" title="Custom edits active" />
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isEdited && (
              <button
                onClick={handleResetOriginal}
                title="Discard your manual edits and reset to the AI original"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Edits</span>
              </button>
            )}

            <button
              onClick={handleCopyFull}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-md shadow-emerald-600/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>

            <button
              onClick={onReset}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              New Article
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewer with Side Table of Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Table of Contents Sticky Sidebar (in Preview mode) */}
        {viewMode === 'preview' && stats.headings.length > 0 && (
          <aside className="hidden lg:block lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
              <List className="w-3.5 h-3.5 text-indigo-400" />
              <span>Table of Contents</span>
            </div>
            <nav className="space-y-1.5">
              {stats.headings.map((h, i) => (
                <a
                  key={i}
                  href={`#${h.id}`}
                  className="block text-xs text-slate-400 hover:text-indigo-300 hover:bg-slate-800/50 p-1.5 rounded-md transition-colors leading-snug truncate"
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </aside>
        )}

        {/* Article Body */}
        <div
          className={`${
            viewMode === 'preview' && stats.headings.length > 0
              ? 'lg:col-span-3'
              : 'lg:col-span-4'
          } bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl`}
        >
          {viewMode === 'preview' ? (
            <div className="prose prose-invert prose-indigo max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {articleContent}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800 select-none">
                <span className="flex items-center gap-1.5 font-medium text-indigo-400">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Interactive Markdown Editor (Edits sync live with Preview & Downloads)</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {articleContent.length.toLocaleString()} characters
                </span>
              </div>
              <textarea
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                rows={28}
                placeholder="Type or paste markdown to edit directly..."
                className="w-full bg-slate-950 font-mono text-xs sm:text-sm text-slate-200 p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent leading-relaxed resize-y"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

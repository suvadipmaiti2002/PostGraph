import React, { useState } from 'react';
import { Sparkles, ArrowRight, BookOpen, Users, Lightbulb } from 'lucide-react';

const SUGGESTIONS = [
  { topic: 'What is RAG? (Retrieval-Augmented Generation)', audience: 'Software Engineers & Learners' },
  { topic: 'What is MCP? (Model Context Protocol)', audience: 'Software Engineers' },
  { topic: 'Synchronous vs Asynchronous: Concurrency, Latency, and Throughput', audience: 'Developers & Learners' },
  { topic: 'REST vs gRPC: Serialization, Protocols, and Latency', audience: 'Software Engineers' },
  { topic: 'SQL vs NoSQL: ACID Guarantees, Scaling, and Trade-Offs', audience: 'Backend Developers' },
  { topic: 'Kafka vs RabbitMQ: Event Streaming vs Message Queues', audience: 'Developers & Architects' },
];

export default function StartBlogForm({ onStart, loading }) {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Software Engineers & Learners');
  const [style, setStyle] = useState('intuitive'); // 'intuitive' | 'practical' | 'deep'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onStart(topic.trim(), audience.trim(), style);
  };

  const applySuggestion = (s) => {
    setTopic(s.topic);
    setAudience(s.audience);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Create New Technical Article</h2>
          <p className="text-xs text-slate-400">
            Orchestrates Researcher, Writer, and Fact-Checker agents with Human-in-the-Loop review.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Topic Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Article Topic / Technical Thesis
          </label>
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Synchronous vs Asynchronous: Concurrency, Latency, and Throughput"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Explanation Style Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-indigo-400" /> Explanation Style & Tone
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setStyle('intuitive')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                style === 'intuitive'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🌟 Intuitive & Friendly</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Plain English, everyday analogies, simple code with comments. Easiest to remember.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStyle('practical')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                style === 'practical'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>⚡ Practical Developer</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Clean code patterns, step-by-step walkthroughs, and practical best practices.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStyle('deep')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                style === 'deep'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🔬 Deep Architectural</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Advanced internals, performance trade-off matrices, and systems mechanics.
              </p>
            </button>
          </div>
        </div>

        {/* Target Audience Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" /> Target Audience
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. Software Engineers & Learners, Python Developers"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Suggestion Pills */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">
            Quick Technical Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                type="button"
                key={i}
                onClick={() => applySuggestion(s)}
                className="text-left text-xs bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/60 hover:border-indigo-500/40 transition-all cursor-pointer"
              >
                {s.topic}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white font-medium py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Researching & Drafting Article...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Draft Article</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

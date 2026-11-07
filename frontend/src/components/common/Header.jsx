import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Sparkles, Plus } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const isFormPage = location.pathname === '/';

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight group-hover:text-indigo-300 transition-colors">PostGraph</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Editorial Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Technical Blog Engine</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {!isFormPage && (
            <Link
              to="/"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Article</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

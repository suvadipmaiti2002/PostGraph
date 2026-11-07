import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import CreateBlogPage from './pages/CreateBlogPage';
import BlogWorkspacePage from './pages/BlogWorkspacePage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Header />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          <Routes>
            <Route path="/" element={<CreateBlogPage />} />
            <Route path="/blog/:threadId" element={<BlogWorkspacePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
          PostGraph — Autonomous Technical Publishing Engine
        </footer>
      </div>
    </BrowserRouter>
  );
}

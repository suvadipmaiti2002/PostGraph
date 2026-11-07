import React from 'react';
import { Search, ShieldAlert, PenTool, CheckCircle, CheckCircle2, Clock } from 'lucide-react';

const STEPS = [
  { id: 'research', label: '1. Researcher Agent', icon: Search, desc: 'Tavily Search & Outline' },
  { id: 'review_research', label: 'Gate 1: Outline Review', icon: ShieldAlert, desc: 'Human Approval' },
  { id: 'writer', label: '2. Writer Agent', icon: PenTool, desc: 'Markdown & Code Drafting' },
  { id: 'review_draft', label: 'Gate 2: Draft Review', icon: ShieldAlert, desc: 'Human Approval' },
  { id: 'completed', label: '3. Editor & Published', icon: CheckCircle2, desc: 'Citations & Final Blog' }
];

export default function PipelineStepper({ currentStage, status }) {
  const getStepStatus = (stepId, index) => {
    if (status === 'completed') return 'completed';

    // Map stages to step indices
    const stageMap = {
      'researching': 0,
      'review_research': 1,
      'awaiting_research_review': 1,
      'writing': 2,
      'review_draft': 3,
      'awaiting_draft_review': 3,
      'editing': 4,
      'completed': 5
    };

    const currentIndex = stageMap[currentStage] ?? 0;

    if (index < currentIndex) return 'completed';
    if (index === currentIndex) {
      return status === 'awaiting_approval' ? 'awaiting' : 'active';
    }
    return 'pending';
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Editorial Review Pipeline
        </h3>
        {status === 'awaiting_approval' && (
          <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Human-in-the-Loop Checkpoint Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {STEPS.map((step, idx) => {
          const stepStatus = getStepStatus(step.id, idx);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`relative rounded-xl p-3 border transition-all duration-200 ${
                stepStatus === 'completed'
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                  : stepStatus === 'awaiting'
                  ? 'bg-amber-950/30 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10'
                  : stepStatus === 'active'
                  ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-300 animate-pulse'
                  : 'bg-slate-800/30 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`p-1.5 rounded-lg ${
                    stepStatus === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : stepStatus === 'awaiting'
                      ? 'bg-amber-500/20 text-amber-300'
                      : stepStatus === 'active'
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold leading-tight">{step.label}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

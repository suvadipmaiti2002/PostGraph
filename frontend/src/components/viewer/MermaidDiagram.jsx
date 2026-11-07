import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    darkMode: true,
    background: '#020617',
    primaryColor: '#6366f1',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#818cf8',
    lineColor: '#94a3b8',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a'
  }
});

// Sanitizes common LLM Mermaid syntax mistakes (e.g. unquoted parentheses inside square brackets)
function sanitizeMermaidChart(rawChart) {
  if (!rawChart) return '';
  return rawChart
    .split('\n')
    .map(line => {
      // Auto-quote bracketed node labels with parentheses, slashes, or colons
      // e.g. B[Event Loop (single thread)] -> B["Event Loop (single thread)"]
      return line.replace(/\[([^"\]\n]+)\]/g, (match, inner) => {
        const trimmed = inner.trim();
        if (/[(),/:]/.test(trimmed) && !trimmed.startsWith('"') && !trimmed.endsWith('"')) {
          return `["${trimmed}"]`;
        }
        return match;
      });
    })
    .join('\n');
}

export default function MermaidDiagram({ chart }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!chart || !chart.trim()) return;
      
      const cleanChart = sanitizeMermaidChart(chart.trim());
      const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

      try {
        const { svg } = await mermaid.render(uniqueId, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
          setError(false);
        }
      } catch (err) {
        console.warn('Mermaid rendering failed, using fallback display:', err);
        // Clean up any stray error elements Mermaid 10+ injects into document body
        const strayEl = document.getElementById(`d${uniqueId}`);
        if (strayEl) strayEl.remove();
        
        if (isMounted) setError(true);
      }
    };

    renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  if (error || !svgContent) {
    return (
      <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
        <div className="px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400 select-none">
          Architecture Diagram Source
        </div>
        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="my-6 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg">
      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 flex items-center justify-between select-none">
        <span>Architecture & Data Flow Diagram</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Interactive SVG</span>
      </div>
      <div
        ref={containerRef}
        className="p-6 flex items-center justify-center overflow-x-auto bg-slate-950/60"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}

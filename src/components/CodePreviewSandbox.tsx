import React, { useState, useEffect, useRef } from 'react';
import { Play, Copy, Check, RotateCcw, Code, Monitor, Terminal, Download, Sparkles } from 'lucide-react';

interface CodePreviewSandboxProps {
  initialCode?: string;
}

const DEFAULT_SANDBOX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
      color: #38bdf8;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      overflow: hidden;
    }
    .card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 30px;
      border-radius: 20px;
      backdrop-filter: blur(12px);
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.2);
      max-width: 400px;
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
    }
    button {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 15px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: scale(1.05);
      box-shadow: 0 0 15px rgba(2, 132, 199, 0.6);
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>GK EDIT Sandbox</h1>
    <p>Live interactive web component runtime powered by Nexus Engine.</p>
    <button onclick="handleClick()">Click Me</button>
    <p id="counter" style="margin-top:15px; font-weight:bold; color:#38bdf8;">Clicks: 0</p>
  </div>

  <script>
    let count = 0;
    function handleClick() {
      count++;
      document.getElementById('counter').innerText = 'Clicks: ' + count;
    }
  </script>
</body>
</html>`;

export function CodePreviewSandbox({ initialCode }: CodePreviewSandboxProps) {
  const [code, setCode] = useState<string>(initialCode || DEFAULT_SANDBOX_HTML);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'split' | 'code' | 'preview'>('split');

  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      setCode(initialCode);
      setIframeKey((prev) => prev + 1);
    }
  }, [initialCode]);

  const handleRun = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(DEFAULT_SANDBOX_HTML);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#040e24]/90 border border-cyan-500/25 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>GK EDIT Code Preview Sandbox</span>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                LIVE RUNTIME
              </span>
            </h2>
            <p className="text-xs text-slate-400">Inspect, edit, and instantly test AI-generated code snippets</p>
          </div>
        </div>

        {/* View toggles & Action buttons */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveView('split')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeView === 'split' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveView('code')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeView === 'code' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Code Only
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeView === 'preview' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Preview Only
            </button>
          </div>

          <button
            onClick={handleRun}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)] transition flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" /> Run
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reset Sandbox"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div className={`grid gap-4 ${activeView === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Code Editor Panel */}
        {(activeView === 'split' || activeView === 'code') && (
          <div className="flex flex-col bg-[#030818] border border-cyan-500/25 rounded-2xl overflow-hidden shadow-xl h-[560px]">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-cyan-500/20 text-xs text-slate-400">
              <span className="flex items-center gap-2 font-mono text-cyan-300">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> source.html
              </span>
              <span className="text-[11px] font-mono text-slate-500">{code.length} chars</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full flex-1 p-4 bg-transparent font-mono text-xs text-slate-200 resize-none focus:outline-none leading-relaxed selection:bg-cyan-500/30"
              spellCheck={false}
            />
          </div>
        )}

        {/* Live Iframe Sandbox Panel */}
        {(activeView === 'split' || activeView === 'preview') && (
          <div className="flex flex-col bg-[#030818] border border-cyan-500/25 rounded-2xl overflow-hidden shadow-xl h-[560px]">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-cyan-500/20 text-xs text-slate-400">
              <span className="flex items-center gap-2 font-mono text-emerald-400">
                <Monitor className="w-3.5 h-3.5" /> Live Render Viewport
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-slate-400">Sandboxed Iframe</span>
              </div>
            </div>
            <iframe
              key={iframeKey}
              srcDoc={code}
              title="Live Code Sandbox Preview"
              sandbox="allow-scripts allow-modals"
              className="w-full flex-1 border-0 bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}

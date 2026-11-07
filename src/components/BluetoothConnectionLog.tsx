import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Trash2,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  bluetoothService,
  BluetoothLogEntry,
  BluetoothLogStatus,
} from '../services/bluetoothService.ts';

interface BluetoothConnectionLogProps {
  logs: BluetoothLogEntry[];
  isIframe?: boolean;
  directUrl?: string;
  defaultExpanded?: boolean;
  className?: string;
}

export function BluetoothConnectionLog({
  logs,
  isIframe = false,
  directUrl,
  defaultExpanded = true,
  className = '',
}: BluetoothConnectionLogProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [filter, setFilter] = useState<'all' | 'error' | 'success' | 'warn'>('all');
  const [copied, setCopied] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);

  const handleCopyLogs = async () => {
    try {
      const text = bluetoothService.exportLogsAsText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleClearLogs = () => {
    bluetoothService.clearLogs();
  };

  const handleRunDiagnostics = async () => {
    setDiagnosing(true);
    try {
      await bluetoothService.runFullDiagnostics();
    } finally {
      setDiagnosing(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'error') return log.status === 'error';
    if (filter === 'success') return log.status === 'success';
    if (filter === 'warn') return log.status === 'warning';
    return true;
  });

  const errorCount = logs.filter((l) => l.status === 'error').length;
  const warningCount = logs.filter((l) => l.status === 'warning').length;

  return (
    <div
      className={`rounded-2xl bg-[#020b1c]/95 border border-cyan-500/30 overflow-hidden shadow-[0_4px_24px_rgba(6,182,212,0.12)] backdrop-blur-xl ${className}`}
    >
      {/* Header bar */}
      <div className="p-3.5 bg-gradient-to-r from-[#031535] to-[#020d24] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Web Bluetooth Connection & Telemetry Log</span>
              </h4>
              {errorCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  {errorCount} Error{errorCount > 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {warningCount} Warning{warningCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Live lifecycle events, native DOMExceptions, GATT handshakes & diagnostics
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRunDiagnostics}
            disabled={diagnosing}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
            title="Run environmental diagnostic checks"
          >
            <RefreshCw className={`w-3 h-3 ${diagnosing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Diagnose</span>
          </button>

          <button
            onClick={handleCopyLogs}
            className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400/50 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
            title="Copy entire log to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy Log</span>
              </>
            )}
          </button>

          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="p-1 rounded-lg bg-slate-900/80 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-[11px] transition cursor-pointer"
              title="Clear log history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title={expanded ? 'Collapse Log' : 'Expand Log'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Log Content */}
      {expanded && (
        <div className="p-3 space-y-2.5 text-xs">
          {/* Iframe Notice Prompt if running inside iframe */}
          {isIframe && (
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2 text-[11px] text-cyan-200">
                <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Preview Iframe Constraint:</strong> If the browser throws a
                  SecurityError, the host iframe lacks <code>allow="bluetooth"</code>. Launch the direct tab to connect.
                </span>
              </div>
              {directUrl && (
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 font-bold text-[10.5px] flex items-center justify-center gap-1.5 transition shrink-0"
                >
                  <span>Launch in Direct Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between pb-1 text-[11px]">
            <div className="flex items-center gap-1 font-mono text-[10.5px]">
              <span className="text-slate-400">Filter:</span>
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  filter === 'all'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({logs.length})
              </button>
              <button
                onClick={() => setFilter('error')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  filter === 'error'
                    ? 'bg-red-500/25 text-red-300 font-bold border border-red-500/40'
                    : 'text-slate-400 hover:text-red-300'
                }`}
              >
                Errors ({errorCount})
              </button>
              <button
                onClick={() => setFilter('warn')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  filter === 'warn'
                    ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                Warnings ({warningCount})
              </button>
              <button
                onClick={() => setFilter('success')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  filter === 'success'
                    ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                Success
              </button>
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              Showing {filteredLogs.length} events
            </span>
          </div>

          {/* Log Stream Container */}
          <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-2 pr-1 font-mono scrollbar-thin scrollbar-thumb-cyan-500/20">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <Clock className="w-6 h-6 mx-auto mb-2 opacity-40 text-cyan-400" />
                <p>No Bluetooth connection events recorded yet.</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Tap "Scan & Connect Peripheral" or "Diagnose" to record connection events.
                </p>
              </div>
            ) : (
              filteredLogs.map((entry) => {
                const isErr = entry.status === 'error';
                const isWarn = entry.status === 'warning';
                const isSucc = entry.status === 'success';
                const isRun = entry.status === 'running';

                return (
                  <div
                    key={entry.id}
                    className={`p-2.5 rounded-xl border text-[11px] transition-all duration-150 ${
                      isErr
                        ? 'bg-red-950/40 border-red-500/40 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                        : isWarn
                        ? 'bg-amber-950/30 border-amber-500/35 text-amber-200'
                        : isSucc
                        ? 'bg-emerald-950/30 border-emerald-500/35 text-emerald-200'
                        : isRun
                        ? 'bg-cyan-950/30 border-cyan-400/40 text-cyan-200 animate-pulse'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    {/* Log item top meta line */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Status Icon */}
                        {isErr ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : isSucc ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isRun ? (
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}

                        {/* Stage Chip */}
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase tracking-wider bg-black/40 border border-white/10 text-cyan-300">
                          {entry.stage}
                        </span>

                        {/* Error Class Name */}
                        {entry.errorName && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono bg-red-900/60 text-red-200 border border-red-500/40">
                            {entry.errorName}
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {entry.timestamp}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="font-bold text-white tracking-wide text-xs">
                      {entry.title}
                    </div>

                    {/* Details */}
                    {entry.details && (
                      <div className="mt-1 text-[10.5px] text-slate-300/90 whitespace-pre-wrap break-all leading-relaxed bg-black/20 p-1.5 rounded-lg border border-white/5 font-mono">
                        {entry.details}
                      </div>
                    )}

                    {/* Actionable Remedy Banner */}
                    {entry.remedy && (
                      <div className="mt-2 p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-400/40 text-[10.5px] text-cyan-200 flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white">Remedy: </strong>
                          {entry.remedy}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

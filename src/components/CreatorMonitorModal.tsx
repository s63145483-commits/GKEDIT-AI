import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Users,
  Terminal,
  RefreshCw,
  Trash2,
  X,
  Radio,
  CheckCircle,
  Clock,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface CreatorMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatorMonitorModal({ isOpen, onClose }: CreatorMonitorModalProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMonitorStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Unauthorized: Only the creator has access to this monitor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats();
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  const handleClear = async () => {
    if (!window.confirm('Clear all monitor event logs?')) return;
    try {
      await api.clearMonitorLogs();
      fetchStats();
    } catch (err: any) {
      alert('Failed to clear logs: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 liquid-glass-modal-backdrop animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] liquid-glass-modal-container rounded-3xl flex flex-col overflow-hidden">
        <div className="liquid-glass-modal-glare" />
        
        {/* Header */}
        <div className="p-5 border-b border-cyan-500/20 bg-[#041029]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <ShieldAlert className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  GKEDIT AI Secret Creator Monitor
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-[10px] font-mono font-bold">
                  MASTER ONLY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hidden system monitoring, live query audit & registered user registry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                autoRefresh
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-blue-950 border-cyan-500/20 text-slate-400'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-cyan-400' : ''}`} />
              <span>{autoRefresh ? 'Live' : 'Paused'}</span>
            </button>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 rounded-xl bg-blue-950 border border-cyan-500/20 text-slate-300 hover:text-white transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-blue-950/60 hover:bg-red-950/60 border border-cyan-500/20 text-slate-400 hover:text-red-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {error ? (
            <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-center space-y-2">
              <p className="text-red-300 font-bold text-sm">Access Denied</p>
              <p className="text-xs text-red-200/80">{error}</p>
            </div>
          ) : stats ? (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#020713] border border-cyan-500/25 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Registered Accounts</span>
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{stats.totalUsersCount}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">Real-time DB size</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#020713] border border-cyan-500/25 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Audit Events</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{stats.events?.length || 0}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Logged interactions</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#020713] border border-cyan-500/25 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Server Uptime</span>
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {Math.floor(stats.systemHealth?.uptimeSeconds / 60)}m {stats.systemHealth?.uptimeSeconds % 60}s
                  </div>
                  <div className="text-[10px] text-yellow-400 font-mono">Node {stats.systemHealth?.nodeVersion}</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#020713] border border-cyan-500/25 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>RAM Heap</span>
                    <Cpu className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{stats.systemHealth?.activeMemory}</div>
                  <div className="text-[10px] text-purple-400 font-mono">{stats.systemHealth?.aiEngine}</div>
                </div>
              </div>

              {/* Real-time Interaction Audit Logs */}
              <div className="p-4 rounded-2xl bg-[#020713] border border-cyan-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Real-Time Interaction & Query Feed</span>
                  </h3>
                  <button
                    onClick={handleClear}
                    className="px-2.5 py-1 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Feed</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {stats.events && stats.events.length > 0 ? (
                    stats.events.map((evt: any) => (
                      <div
                        key={evt.id}
                        className="p-3 rounded-xl bg-[#040e24] border border-cyan-500/15 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-cyan-500/35 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                evt.type === 'chat'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                                  : evt.type === 'auth'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                              }`}
                            >
                              {evt.type}
                            </span>
                            <span className="font-semibold text-white">{evt.summary}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            By <strong className="text-slate-300">{evt.userName}</strong> ({evt.userEmail})
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono shrink-0">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6">No interactions recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Registered Users Table */}
              <div className="p-4 rounded-2xl bg-[#020713] border border-cyan-500/25 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>All Active User Accounts</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-cyan-500/20">
                      <tr>
                        <th className="pb-2">User / Name</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Role</th>
                        <th className="pb-2">Registered At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-500/10">
                      {stats.users?.map((u: any) => (
                        <tr key={u.id} className="hover:bg-blue-950/20">
                          <td className="py-2.5 font-bold text-white">{u.name}</td>
                          <td className="py-2.5 font-mono text-cyan-300">{u.email}</td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.role === 'creator'
                                  ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400 text-[11px]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-cyan-400 animate-pulse">
              Connecting to GKEDIT AI Security Core...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-[#041029]/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Server authorization verified. Confidential to Master GK EDIT.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition"
          >
            Close Monitor
          </button>
        </div>
      </div>
    </div>
  );
}

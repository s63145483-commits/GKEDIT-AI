import React, { useState, useEffect } from 'react';
import {
  Hand,
  BarChart3,
  TrendingUp,
  Keyboard,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Flame,
  PieChart as PieIcon,
  HelpCircle,
  Clock,
} from 'lucide-react';
import {
  gestureEventService,
  GestureFrequencyStats,
} from '../services/gestureEventService.ts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface GestureAnalyticsItem {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
  bgGrad: string;
  action: string;
  description: string;
}

const GESTURE_CONFIG: Record<
  string,
  { name: string; icon: string; color: string; action: string; desc: string }
> = {
  Thumb_Up: {
    name: 'Thumb Up',
    icon: '👍',
    color: '#10b981', // emerald
    action: 'Send Message / Submit',
    desc: 'Triggers prompt submission in chat',
  },
  Victory: {
    name: 'Victory (Peace)',
    icon: '✌️',
    color: '#06b6d4', // cyan
    action: 'Toggle Voice Mode',
    desc: 'Activates microphone transcription',
  },
  Open_Palm: {
    name: 'Open Palm',
    icon: '🖐️',
    color: '#f59e0b', // amber
    action: 'Clear Input / Reset',
    desc: 'Wipes current typed prompt or screen',
  },
  Closed_Fist: {
    name: 'Closed Fist',
    icon: '✊',
    color: '#f43f5e', // rose
    action: 'Stop AI Stream',
    desc: 'Pauses live reasoning and voice',
  },
  Pointing_Up: {
    name: 'Pointing Up',
    icon: '☝️',
    color: '#8b5cf6', // purple
    action: 'Air Reticle Navigation',
    desc: 'Used for target lock and cursor hovering',
  },
  ILoveYou: {
    name: 'Love & Rock',
    icon: '🤟',
    color: '#ec4899', // pink
    action: 'Creator Quick Action',
    desc: 'Prodigy shortcut and aesthetic pulse',
  },
};

const CHART_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#ec4899'];

export function GestureFrequencyDashboard() {
  const [stats, setStats] = useState<GestureFrequencyStats>(() => gestureEventService.getStats());
  const [activeSubTab, setActiveSubTab] = useState<'frequency' | 'airtyping' | 'timeline'>('frequency');

  useEffect(() => {
    return gestureEventService.subscribeStats(setStats);
  }, []);

  // Format Gesture Items for Cards & Bar Chart
  const gestureList: GestureAnalyticsItem[] = Object.entries(stats.gestures).map(([key, count]) => {
    const meta = GESTURE_CONFIG[key] || {
      name: key.replace('_', ' '),
      icon: '👋',
      color: '#38bdf8',
      action: 'Custom Gesture',
      desc: 'Tracked hand position',
    };
    return {
      id: key,
      name: meta.name,
      icon: meta.icon,
      count,
      color: meta.color,
      bgGrad: `from-[${meta.color}]/15`,
      action: meta.action,
      description: meta.desc,
    };
  });

  // Sort by highest frequency
  gestureList.sort((a, b) => b.count - a.count);

  const totalGestureCount = gestureList.reduce((sum, g) => sum + g.count, 0) || 1;
  const topGesture = gestureList[0] || null;

  // Chart data for Recharts Bar Chart
  const barChartData = gestureList.map((g) => ({
    name: g.name.replace(' (Peace)', ''),
    count: g.count,
    icon: g.icon,
    fill: g.color,
  }));

  // Tap method distribution (Pinch vs Hover)
  const tapMethodData = [
    { name: 'Pinch (Thumb + Index)', value: stats.airTyping.pinchTaps, color: '#facc15' },
    { name: '0.8s Hover Dwell', value: stats.airTyping.hoverTaps, color: '#06b6d4' },
  ];

  // Air typing breakdown
  const totalAirTaps =
    stats.airTyping.totalCharsTyped +
    stats.airTyping.spaceCount +
    stats.airTyping.backspaceCount +
    stats.airTyping.sendCount;

  return (
    <div className="space-y-6">
      {/* Widget Header & Metric Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-950/80 via-[#040e24] to-[#020512] border border-cyan-500/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(2,6,23,0.85)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
              <Hand className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Air Keyboard & Hand Gesture Analytics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  MediaPipe Vision
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Frequency analysis of user hand gestures and holographic air-typing interactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Reset hand gesture frequency counters back to zero?')) {
                  gestureEventService.resetStats();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Reset Gesture Frequency History"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Counters</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Gestures</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {stats.totalDetections.toLocaleString()}
            </div>
            <div className="text-[10px] text-cyan-300/80 mt-0.5">Tracked with 75%+ confidence</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/20">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Most Common</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-300 truncate mt-1 flex items-center gap-1">
              <span>{topGesture?.icon}</span>
              <span>{topGesture?.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {topGesture?.count} triggers ({Math.round(((topGesture?.count || 0) / totalGestureCount) * 100)}%)
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/20">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Air Keystrokes</span>
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono mt-1">
              {totalAirTaps.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {stats.airTyping.totalCharsTyped} letters • {stats.airTyping.sendCount} sends
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/20">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Preferred Air-Tap</span>
              <Zap className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-black text-purple-300 mt-1">
              {stats.airTyping.pinchTaps >= stats.airTyping.hoverTaps ? 'Pinch Tap' : 'Hover Dwell'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {stats.airTyping.pinchTaps} pinch vs {stats.airTyping.hoverTaps} hover
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-cyan-500/15">
          <button
            onClick={() => setActiveSubTab('frequency')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'frequency'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Gesture Frequency</span>
          </button>

          <button
            onClick={() => setActiveSubTab('airtyping')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'airtyping'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Air Keyboard Typing</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'timeline'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Action Mapping Guide</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: GESTURE FREQUENCY CHART & RANKINGS */}
      {activeSubTab === 'frequency' && (
        <div className="space-y-6">
          {/* Recharts Visual Bar Chart */}
          <div className="p-6 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Gesture Usage Distribution</span>
                </h3>
                <p className="text-xs text-slate-400">Total detected triggers across all active sessions</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#03091e',
                      borderColor: '#06b6d4',
                      borderRadius: '1rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} detections`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {gestureList.map((g, idx) => {
              const percent = Math.round((g.count / totalGestureCount) * 100);
              return (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900/60 border border-cyan-500/20 flex flex-col justify-between hover:border-cyan-400/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{g.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white">{g.name}</h4>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              #1 Most Used
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-cyan-300 font-mono font-semibold">{g.action}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-white font-mono">{g.count}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{percent}% total</div>
                    </div>
                  </div>

                  {/* Frequency meter */}
                  <div className="mt-3">
                    <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: g.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: AIR KEYBOARD TYPING ANALYTICS */}
      {activeSubTab === 'airtyping' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tap Mechanism Comparison (Pinch vs Hover) */}
            <div className="p-6 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 backdrop-blur-xl shadow-lg">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                <span>Pinch vs Hover Tap Ratio</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Comparison of trigger style used when pressing air-keys
              </p>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tapMethodData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                    >
                      {tapMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#03091e',
                        borderColor: '#06b6d4',
                        borderRadius: '1rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-cyan-500/15">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div>
                    <div className="font-semibold text-white">Pinch: {stats.airTyping.pinchTaps}</div>
                    <div className="text-[10px] text-slate-400">Thumb + Index Snap</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <div>
                    <div className="font-semibold text-white">Hover: {stats.airTyping.hoverTaps}</div>
                    <div className="text-[10px] text-slate-400">0.8s Dwell Timer</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Action Breakdown */}
            <div className="p-6 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 backdrop-blur-xl shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                  <Keyboard className="w-4 h-4 text-cyan-400" />
                  <span>Air-Typing Action Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">Volume of specific air keyboard functions</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <span className="text-base">🔤</span> Character Keystrokes (A-Z)
                    </span>
                    <span className="text-sm font-mono font-bold text-cyan-300">
                      {stats.airTyping.totalCharsTyped}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <span className="text-base">␣</span> Space Key Presses
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-200">
                      {stats.airTyping.spaceCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <span className="text-base">⌫</span> Backspace (Del) Corrections
                    </span>
                    <span className="text-sm font-mono font-bold text-rose-300">
                      {stats.airTyping.backspaceCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <span className="text-base">➤</span> Air "Send" Submissions
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {stats.airTyping.sendCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-cyan-500/15 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tip: Pinching is ~3x faster than 0.8s hover for rapid text entry.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: ACTION MAPPING GUIDE */}
      {activeSubTab === 'timeline' && (
        <div className="p-6 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 backdrop-blur-xl shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Air Keyboard & Gesture Action Reference</span>
            </h3>
            <p className="text-xs text-slate-400">
              Quick reference on how hand positions trigger app behaviors in real time
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👍</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Thumb Up</h4>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                    Action: Send Message / Submit
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Sends the currently typed chat message or executes the top suggestion chip.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/40 border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✌️</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Victory (Peace)</h4>
                  <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                    Action: Toggle Voice Mode
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Toggles live microphone recording for Gemini multilingual speech transcription.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/40 border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🖐️</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Open Palm</h4>
                  <span className="text-[10px] text-amber-400 font-mono font-semibold">
                    Action: Clear Input / Reset
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Clears any text currently in the chat input box or triggers 1-tap delete options.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/40 border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✊</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Closed Fist</h4>
                  <span className="text-[10px] text-rose-400 font-mono font-semibold">
                    Action: Stop AI Generation
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Immediately halts ongoing neural network streaming and stops audio playback.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/40 border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👌</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Pinch Thumb & Index</h4>
                  <span className="text-[10px] text-yellow-400 font-mono font-semibold">
                    Action: Instant Air-Key Press
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Taps whichever holographic key your index cursor is targeting with zero delay.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/40 border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏳</span>
                <div>
                  <h4 className="text-xs font-bold text-white">0.8s Hover Dwell</h4>
                  <span className="text-[10px] text-sky-400 font-mono font-semibold">
                    Action: Dwell Air-Key Press
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Holding the reticle cursor over any key for 0.8s fills the circle and registers a press.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

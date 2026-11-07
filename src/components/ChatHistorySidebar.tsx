import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  X,
  MessageSquare,
  Sparkles,
  Star,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { ChatSession } from '../types/index.ts';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export function ChatHistorySidebar({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
}: ChatHistorySidebarProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteWithFeedback = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(() => {
      onDeleteSession(id);
      setDeletingId(null);
    }, 120);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex transition-[visibility] duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none delay-300'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop with Dynamic Island smooth glass fade (GPU accelerated, zero lag) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[#010512]/80 backdrop-blur-md transition-opacity duration-300 ease-out will-change-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Dynamic Island styled Sidebar Drawer (Spring Morph Physics: cubic-bezier(0.16, 1, 0.3, 1), Zero Lag) */}
      <aside
        className={`relative z-10 w-full max-w-[310px] sm:max-w-sm h-full bg-[#020719]/95 backdrop-blur-2xl border-r border-cyan-500/35 flex flex-col shadow-[20px_0_60px_rgba(0,0,0,0.95)] will-change-transform will-change-opacity transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left ${
          isOpen
            ? 'translate-x-0 scale-100 opacity-100'
            : '-translate-x-full scale-95 opacity-0'
        }`}
      >
        {/* Dynamic Island Top Morph Pill */}
        <div className="pt-3 px-3 pb-1 flex justify-center">
          <div className="px-3.5 py-1 rounded-full bg-black/90 border border-cyan-500/40 flex items-center gap-2 shadow-[0_0_18px_rgba(6,182,212,0.25)] select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-cyan-300">
              GKEDIT AI • DYNAMIC ISLAND
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30">
              {sessions.length}
            </span>
          </div>
        </div>

        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-cyan-500/20 flex items-center justify-between bg-[#040e27]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Chat History</span>
                <span className="text-[11px] text-cyan-400 font-normal">
                  (చాట్ హిస్టరీ)
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                {sessions.length} {sessions.length === 1 ? 'chat saved' : 'chats saved'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-blue-900/40 active:scale-95 transition"
            title="Close Sidebar (మూసివేయి)"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-cyan-500/15">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Chat (క్రొత్త చాట్ ప్రారంభించండి)</span>
          </button>
        </div>

        {/* Saved Sessions List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {sessions.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-950/70 border border-cyan-500/20 mx-auto flex items-center justify-center text-cyan-400/60 shadow-inner">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-300">
                చాట్ హిస్టరీ ఏమీ లేదు (No chat history saved yet)
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                మీ రాశిని సెలెక్ట్ చేసుకోండి లేదా AI తో మాట్లాడండి - మీ సంభాషణలు ఇక్కడే సేవ్ అవుతాయి!
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isAstrology = session.category === 'astrology';
              const isBeingDeleted = deletingId === session.id;
              const lastMsg = session.messages[session.messages.length - 1]?.text || '';
              const cleanPreview = lastMsg.replace(/[*#_`]/g, '').slice(0, 70);

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isBeingDeleted
                      ? 'opacity-0 scale-90 translate-x-4'
                      : isActive
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-[#040e24]/75 border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#051538]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {isAstrology ? (
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0 text-sm font-bold shadow-sm">
                          {session.rashiSymbol || '🔮'}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0 text-cyan-300 shadow-sm">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-white truncate max-w-[170px]">
                            {session.title}
                          </p>
                          {isAstrology && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/25 text-purple-300 border border-purple-400/40 font-medium shrink-0">
                              రాశి ఫలాలు
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-cyan-400/70 font-mono mt-0.5">
                          {formatDate(session.updatedAt || session.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Delete Specific Session Button (Request 5: డిలీట్ చేసే బటన్) */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteWithFeedback(session.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/50 border border-transparent hover:border-red-500/40 transition active:scale-90 shrink-0"
                      title="ఈ చాట్ తొలగించు (Delete this session)"
                      aria-label="Delete chat session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {cleanPreview && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed pl-10">
                      {cleanPreview}...
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: 1-Tap Clear All History */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-cyan-500/20 bg-[#041029]/90 space-y-2">
            <button
              type="button"
              onClick={() => {
                onClearAll();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm cursor-pointer"
              title="1-Tap Delete: మొత్తం చాట్ హిస్టరీ ఒక్క ట్యాప్‌తో తొలగించండి"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>1-Tap Delete: మొత్తం హిస్టరీ తొలగించు</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 font-mono">
              Undo సదుపాయంతో చాట్ హిస్టరీ మాత్రమే డిలీట్ అవుతుంది
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

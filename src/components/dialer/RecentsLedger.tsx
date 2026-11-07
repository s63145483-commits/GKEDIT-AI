import React, { useState } from 'react';
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  ShieldAlert, 
  ShieldCheck, 
  Bot, 
  Voicemail, 
  Search, 
  Phone, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  X,
  Play,
  RotateCcw
} from 'lucide-react';
import { CallRecord, CallTag } from '../../types/telephony.ts';
import { dtmfAudio } from '../../services/dtmfAudio.ts';

interface RecentsLedgerProps {
  records: CallRecord[];
  onRedial: (number: string) => void;
  onScreenNumber: (number: string) => void;
}

export const RecentsLedger: React.FC<RecentsLedgerProps> = ({
  records,
  onRedial,
  onScreenNumber,
}) => {
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<CallRecord | null>(null);

  // Filter records
  const filteredRecords = records.filter((r) => {
    // Tag match
    if (filterTag !== 'all' && r.statusTag !== filterTag) return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.caller.name.toLowerCase().includes(q);
      const matchNumber = r.caller.number.includes(q);
      const matchCompany = r.caller.company?.toLowerCase().includes(q);
      const matchSummary = r.aiSummary?.toLowerCase().includes(q);
      return matchName || matchNumber || matchCompany || matchSummary;
    }

    return true;
  });

  const getTagBadgeStyle = (tag: CallTag) => {
    switch (tag) {
      case 'Spam Filtered':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'AI Handled':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Direct Voicemail':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Verified Caller':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-white/10';
    }
  };

  const getTagIcon = (tag: CallTag) => {
    switch (tag) {
      case 'Spam Filtered':
        return <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />;
      case 'AI Handled':
        return <Bot className="w-3 h-3 text-cyan-400 shrink-0" />;
      case 'Direct Voicemail':
        return <Voicemail className="w-3 h-3 text-amber-400 shrink-0" />;
      case 'Verified Caller':
        return <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-xl mx-auto px-4 py-2 select-none">
      {/* Search Bar */}
      <div className="relative mb-2.5">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search calls, numbers, or AI transcripts..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Smart-Filter Horizontal Segmented Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-2">
        {[
          { key: 'all', label: 'All Recents', count: records.length },
          { key: 'AI Handled', label: 'AI Handled', count: records.filter((r) => r.statusTag === 'AI Handled').length },
          { key: 'Spam Filtered', label: 'Spam Filtered', count: records.filter((r) => r.statusTag === 'Spam Filtered').length },
          { key: 'Direct Voicemail', label: 'Voicemail', count: records.filter((r) => r.statusTag === 'Direct Voicemail').length },
          { key: 'Verified Caller', label: 'Verified', count: records.filter((r) => r.statusTag === 'Verified Caller').length },
        ].map((tab) => {
          const isActive = filterTag === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setFilterTag(tab.key);
                dtmfAudio.playTone(550, 40, 0.05);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-400/50 text-cyan-200 shadow-md'
                  : 'bg-slate-900/80 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-800 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Recents Ledger List */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="hyperos-glass-card rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-cyan-400/30 active:scale-[0.99] transition-all group shadow-md"
            >
              {/* Left Slot: Avatar & Direction */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-tr ${record.caller.avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
                  {record.caller.name.charAt(0)}
                  
                  {/* Call Direction Indicator */}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-950 border border-white/20 flex items-center justify-center text-[10px]">
                    {record.direction === 'incoming' && <PhoneIncoming className="w-2.5 h-2.5 text-emerald-400" />}
                    {record.direction === 'outgoing' && <PhoneOutgoing className="w-2.5 h-2.5 text-cyan-400" />}
                    {record.direction === 'missed' && <PhoneMissed className="w-2.5 h-2.5 text-amber-400" />}
                    {record.direction === 'blocked' && <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />}
                  </span>
                </div>

                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {record.caller.name}
                    </h3>
                    {record.caller.e2eeVerified && (
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {record.caller.number}
                  </p>

                  {/* AI Summary Snip */}
                  {record.aiSummary && (
                    <p className="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-xs mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                      <span>{record.aiSummary}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Right Slot: Dynamic Status Tag & Redial Action */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  {/* Dynamic Status Tag */}
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-medium ${getTagBadgeStyle(record.statusTag)}`}>
                    {getTagIcon(record.statusTag)}
                    <span>{record.statusTag}</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {record.timestamp}
                  </p>
                </div>

                {/* Quick Redial button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dtmfAudio.playTone(700, 50, 0.08);
                    onRedial(record.caller.number);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-900/90 hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 flex items-center justify-center transition-all active:scale-90"
                  title="Call back"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-500 font-mono text-xs">
            No call records found matching this filter.
          </div>
        )}
      </div>

      {/* Transcript & Call Inspection Modal */}
      {selectedRecord && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            className="w-full max-w-lg hyperos-glass-card rounded-3xl p-5 shadow-2xl border border-white/15 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${selectedRecord.caller.avatarGradient} flex items-center justify-center text-white font-bold text-base shadow-lg`}>
                  {selectedRecord.caller.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{selectedRecord.caller.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getTagBadgeStyle(selectedRecord.statusTag)}`}>
                      {selectedRecord.statusTag}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedRecord.caller.number} · {selectedRecord.timestamp} ({selectedRecord.duration}s)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Summary Banner */}
            {selectedRecord.aiSummary && (
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>GKEDIT AI Call Intelligence Summary</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedRecord.aiSummary}
                </p>
              </div>
            )}

            {/* Action Items (if any) */}
            {selectedRecord.actionItems && selectedRecord.actionItems.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 mb-3">
                <h4 className="text-xs font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Key Action Items & Notes</span>
                </h4>
                <div className="space-y-1">
                  {selectedRecord.actionItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transcription Log */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 p-2 rounded-2xl bg-slate-950/60 border border-white/5">
              <h4 className="text-[11px] font-mono text-slate-400 mb-2 px-1 flex items-center justify-between">
                <span>Call Voice-to-Text Transcript</span>
                <span>{selectedRecord.transcript ? selectedRecord.transcript.length : 0} messages</span>
              </h4>

              {selectedRecord.transcript && selectedRecord.transcript.length > 0 ? (
                selectedRecord.transcript.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl text-xs ${
                      msg.speaker === 'caller'
                        ? 'bg-slate-900/90 border border-amber-500/20 text-amber-100 ml-0 mr-4'
                        : 'bg-cyan-950/80 border border-cyan-500/20 text-cyan-100 ml-4 mr-0'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                      <span className="font-semibold text-white">
                        {msg.speaker === 'caller' ? selectedRecord.caller.name : 'GKEDIT AI Assistant'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic p-2">Direct call connection (no transcript recorded).</p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  onScreenNumber(selectedRecord.caller.number);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Screen with AI</span>
              </button>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  onRedial(selectedRecord.caller.number);
                }}
                className="px-4 py-2 rounded-xl hyperos-call-btn text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Phone,
  Video,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  Smartphone,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { GKContact } from '../../types/gkChat.ts';
import { webRtcCallService } from '../../services/webRtcCallService.ts';

interface DialerCallOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: GKContact;
  initialMode?: 'audio' | 'video';
}

export function DialerCallOptionsModal({
  isOpen,
  onClose,
  contact,
  initialMode = 'audio',
}: DialerCallOptionsModalProps) {
  const [callMode, setCallMode] = useState<'audio' | 'video'>(initialMode);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Clean phone number for standard tel: protocol (e.g. +919848021410)
  const rawPhone = contact.phone.trim();
  const hasPlus = rawPhone.startsWith('+');
  const digitsOnly = rawPhone.replace(/\D/g, '');
  const dialerTelUrl = hasPlus ? `tel:+${digitsOnly}` : `tel:${digitsOnly}`;

  // WhatsApp link (requires digits with country code)
  const whatsappUrl = `https://wa.me/${digitsOnly}`;

  // Google Meet (the default video call engine bundled with Google Phone dialer)
  const googleMeetUrl = 'https://meet.google.com/new';

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(contact.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartWebRtc = (isVideo: boolean) => {
    onClose();
    webRtcCallService.startCall(contact.name, contact.avatar, isVideo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 liquid-glass-modal-backdrop animate-in fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl liquid-glass-modal-container p-5 sm:p-6 text-slate-200 space-y-4 overflow-hidden">
        <div className="liquid-glass-modal-glare" />
        {/* Subtle Cyber Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-blue-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Google Phone & Dialer Hub</span>
              </h3>
              <p className="text-[11px] text-slate-400">Choose real mobile dialer or internet call</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-cyan-500/20 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contact Info Header Card */}
        <div className="p-3.5 rounded-2xl bg-[#081535] border border-cyan-500/25 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-900 ring-2 ring-emerald-400/50">
                <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#030712]" />
            </div>

            <div className="truncate">
              <h4 className="text-sm font-bold text-white truncate">{contact.name}</h4>
              <p className="text-xs text-cyan-300 font-mono tracking-wide truncate">{contact.phone}</p>
            </div>
          </div>

          <button
            onClick={handleCopyNumber}
            className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/25 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 transition shrink-0"
            title="Copy Phone Number"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Audio vs Video Mode Toggle */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-cyan-500/20 text-xs">
          <button
            onClick={() => setCallMode('audio')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              callMode === 'audio'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Audio Call</span>
          </button>

          <button
            onClick={() => setCallMode('video')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              callMode === 'video'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Call</span>
          </button>
        </div>

        {/* Options List for Selected Mode */}
        <div className="space-y-2 pt-1">
          {callMode === 'audio' ? (
            /* --- AUDIO CALL OPTIONS --- */
            <>
              {/* 1. Default Mobile Phone Dialer (Google Phone / SIM Call) */}
              <a
                href={dialerTelUrl}
                onClick={onClose}
                className="group p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#071936] to-emerald-950/60 border border-emerald-500/40 hover:border-emerald-400 transition flex items-center justify-between gap-3 shadow-md hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                    <Phone className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Default Mobile Dialer</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Google Phone
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-300">
                      Real SIM cellular call to <span className="font-mono text-cyan-300">{contact.phone}</span>
                    </p>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 shrink-0">
                  <span>Call Now</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>

              {/* 2. WhatsApp Audio Call */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="group p-3 rounded-2xl bg-[#061530] border border-cyan-500/25 hover:border-emerald-500/50 transition flex items-center justify-between gap-3 shadow-sm hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                    <MessageSquare className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>WhatsApp Audio Call</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">Free voice calling via WhatsApp app</p>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-cyan-500/20 text-slate-300 text-[11px] font-medium flex items-center gap-1 shrink-0 group-hover:text-emerald-300">
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>

              {/* 3. GK-Chat In-App Encrypted WebRTC Call */}
              <button
                type="button"
                onClick={() => handleStartWebRtc(false)}
                className="w-full group p-3 rounded-2xl bg-[#051126] border border-cyan-500/20 hover:border-cyan-400/50 transition flex items-center justify-between gap-3 shadow-sm hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>GK-Chat Browser HD Call</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        E2EE WebRTC
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-400">In-browser peer-to-peer encrypted audio</p>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold shrink-0">
                  <span>Start Call</span>
                </div>
              </button>
            </>
          ) : (
            /* --- VIDEO CALL OPTIONS --- */
            <>
              {/* 1. Google Meet (Google Phone Dialer built-in video call) */}
              <a
                href={googleMeetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="group p-3 rounded-2xl bg-gradient-to-r from-blue-950/60 via-[#071936] to-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 transition flex items-center justify-between gap-3 shadow-md hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                    <Video className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Google Meet Video Call</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Google Dialer
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-300">
                      Google Phone's default video calling integration
                    </p>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold flex items-center gap-1 shrink-0">
                  <span>Launch Meet</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>

              {/* 2. WhatsApp Video Call */}
              <a
                href={`${whatsappUrl}?text=Let's%20connect%20on%20Video%20Call`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="group p-3 rounded-2xl bg-[#061530] border border-cyan-500/25 hover:border-emerald-500/50 transition flex items-center justify-between gap-3 shadow-sm hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                    <Video className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>WhatsApp Video Call</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">Launch HD video call via WhatsApp</p>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-cyan-500/20 text-slate-300 text-[11px] font-medium flex items-center gap-1 shrink-0 group-hover:text-emerald-300">
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>

              {/* 3. GK-Chat In-App Encrypted WebRTC Video */}
              <button
                type="button"
                onClick={() => handleStartWebRtc(true)}
                className="w-full group p-3 rounded-2xl bg-[#051126] border border-cyan-500/20 hover:border-emerald-400/50 transition flex items-center justify-between gap-3 shadow-sm hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>GK-Chat In-App Video Call</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        E2EE WebRTC
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-400">Direct camera stream with zero app installs</p>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold shrink-0">
                  <span>Start Video</span>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Footer info note */}
        <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Opens your mobile's default dialer</span>
          </span>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

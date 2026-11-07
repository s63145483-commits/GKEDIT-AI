import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ShieldCheck,
  Globe,
  Sparkles,
  Phone,
  MessageSquare,
  QrCode,
} from 'lucide-react';
import { GKContact } from '../../types/gkChat.ts';

interface GuestInviteModalProps {
  contact: GKContact;
  hostName?: string;
  onClose: () => void;
}

export function GuestInviteModal({
  contact,
  hostName = 'GK EDIT',
  onClose,
}: GuestInviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const guestUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?view=guest&room=${encodeURIComponent(
          contact.id
        )}&to=${encodeURIComponent(hostName)}`
      : `?view=guest&room=${encodeURIComponent(contact.id)}&to=${encodeURIComponent(hostName)}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(guestUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = guestUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareNative = async () => {
    const shareData = {
      title: `Chat with ${hostName} on GK-Chat (P2P Encrypted)`,
      text: `Join private P2P encrypted chat with ${hostName}. Zero login or SMS fees required:`,
      url: guestUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hey! Chat with me on GK-Chat via private P2P Encrypted Web Messenger (No app install needed):\n${guestUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSmsShare = () => {
    const text = encodeURIComponent(
      `Private P2P chat link with ${hostName}: ${guestUrl}`
    );
    const phoneParam = contact.phone ? `&phone=${encodeURIComponent(contact.phone)}` : '';
    window.location.href = `sms:${contact.phone || ''}?body=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 liquid-glass-modal-backdrop animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl liquid-glass-modal-container p-5 sm:p-6 text-slate-200 relative overflow-hidden space-y-4">
        <div className="liquid-glass-modal-glare" />
        {/* Glow Accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>P2P Guest Web Chat</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  FREE & LIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Direct browser chat locked to{' '}
                <span className="text-cyan-300 font-semibold">{contact.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Details & Isolation Guard */}
        <div className="p-3 rounded-2xl bg-[#020713]/80 border border-cyan-500/20 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Recipient Locked:</span>
            <span className="font-mono text-cyan-300">{contact.name}</span>
          </div>
          {contact.phone && (
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Verified Phone:</span>
              <span className="font-mono text-emerald-300 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                {contact.phone}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Channel ID:</span>
            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">
              room_{contact.id}
            </span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 leading-tight">Zero-login & P2P Encrypted</span>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-300 leading-tight">No SMS fees / No app needed</span>
          </div>
        </div>

        {/* URL Box with One-Click Copy */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span>Invite Web URL</span>
            {copied && <span className="text-emerald-400 text-[10px] font-bold">✓ Copied to clipboard!</span>}
          </label>
          <div className="flex items-center gap-2 bg-[#020713] border border-cyan-500/40 rounded-2xl p-2">
            <input
              type="text"
              readOnly
              value={guestUrl}
              className="bg-transparent text-xs font-mono text-cyan-300 flex-1 outline-none truncate selection:bg-cyan-500/40"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-3 rounded-2xl bg-cyan-950/70 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98"
            >
              <Copy className="w-4 h-4 text-cyan-400" />
              <span>Copy Invite Link</span>
            </button>
            <button
              onClick={handleShareNative}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Web Link</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Send via WhatsApp</span>
            </button>
            {contact.phone && (
              <button
                onClick={handleSmsShare}
                className="flex-1 py-2 px-2.5 rounded-xl bg-blue-950/50 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>Send via SMS</span>
              </button>
            )}
            <button
              onClick={() => setShowQr(!showQr)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 transition"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR Code section if toggled */}
        {showQr && (
          <div className="p-4 rounded-2xl bg-white text-slate-950 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-44 h-44 mx-auto bg-slate-100 rounded-xl flex items-center justify-center p-2 border border-slate-300">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  guestUrl
                )}`}
                alt="Scan to Chat"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-[11px] text-slate-600 font-semibold">
              Scan with any phone camera to start chatting instantly
            </p>
          </div>
        )}

        <div className="text-[10px] text-slate-500 text-center pt-1">
          Guest messages sync two-way in real-time with GK-Chat via secure P2P WebSockets & BroadcastChannel.
        </div>
      </div>
    </div>
  );
}

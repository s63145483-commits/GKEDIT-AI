import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Check,
  CheckCheck,
  Copy,
  Download,
  Play,
  Pause,
  Image as ImageIcon,
  Volume2,
  Lock,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { GKMessage } from '../../types/gkChat.ts';

interface MessageBubbleProps {
  message: GKMessage;
  onQuickCopy?: (text: string) => void;
  onDeleteMessage?: (id: string) => void;
}

export function MessageBubble({ message, onQuickCopy, onDeleteMessage }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showFullImage, setShowFullImage] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleCopyText = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    if (onQuickCopy) onQuickCopy(textToCopy);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleVoicePlayback = () => {
    if (message.audioBase64) {
      if (isPlayingAudio && audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(`data:audio/webm;base64,${message.audioBase64}`);
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => setIsPlayingAudio(false);
      }

      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => setIsPlayingAudio(false));
      return;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (isPlayingAudio) {
        setIsPlayingAudio(false);
        return;
      }
      const clean = message.text.replace(/[*#_`]/g, '').slice(0, 350);
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = playbackSpeed;
      setIsPlayingAudio(true);
      utter.onend = () => setIsPlayingAudio(false);
      utter.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utter);
    }
  };

  const handleCycleSpeed = () => {
    const nextSpeed = playbackSpeed === 1.0 ? 1.5 : playbackSpeed === 1.5 ? 2.0 : 1.0;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <div className={`flex w-full my-1.5 ${isUser ? 'justify-end' : 'justify-start'} group select-text`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-3.5 shadow-lg transition ${
          isUser
            ? 'bg-gradient-to-br from-emerald-600/90 to-cyan-700/90 text-white rounded-tr-xs border border-emerald-400/30'
            : 'bg-[#091533]/95 text-slate-100 rounded-tl-xs border border-cyan-500/25 shadow-[0_4px_20px_rgba(3,7,18,0.7)]'
        }`}
      >
        {/* Media / Image Attachment Card */}
        {message.imageUrl && (
          <div className="mb-2.5 rounded-xl overflow-hidden border border-cyan-400/30 bg-black/60 shadow-lg">
            <div className="relative group/img cursor-pointer" onClick={() => setShowFullImage(true)}>
              <img
                src={message.imageUrl}
                alt="Shared attachment"
                className="w-full max-h-72 object-cover transition hover:scale-[1.01]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5 justify-between">
                <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Photo Attachment</span>
                </span>
                <a
                  href={message.imageUrl}
                  download="shared_image.jpg"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-black/60 hover:bg-cyan-500 text-white hover:text-black transition"
                  title="Download Image"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Voice Note Waveform Player */}
        {message.audioBase64 && (
          <div className="mb-2 p-2.5 rounded-xl bg-black/50 border border-cyan-500/30 flex items-center gap-2.5 shadow-inner">
            <button
              onClick={handleToggleVoicePlayback}
              className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center hover:scale-105 transition shrink-0"
              title={isPlayingAudio ? 'Pause Voice Note' : 'Play Voice Note'}
            >
              {isPlayingAudio ? (
                <Pause className="w-4 h-4 fill-slate-950" />
              ) : (
                <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
              )}
            </button>
            <div className="flex-1 flex items-center gap-1 h-5 overflow-hidden">
              {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65, 90, 45, 60].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`w-1 rounded-full transition-all ${
                    isPlayingAudio ? 'bg-cyan-300 animate-pulse' : 'bg-cyan-600/60'
                  }`}
                />
              ))}
            </div>

            {/* Playback speed toggle (1x / 1.5x / 2x) */}
            <button
              onClick={handleCycleSpeed}
              className="px-2 py-0.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/30 text-cyan-300 font-mono text-[10.5px] font-bold transition shrink-0"
              title="Change Playback Speed"
            >
              {playbackSpeed}x
            </button>
          </div>
        )}

        {/* Text Message Content */}
        {message.text && (
          <div className="text-xs sm:text-[13px] leading-relaxed break-words font-sans space-y-1.5 prose prose-invert prose-p:my-1 prose-headings:my-1.5 prose-code:text-cyan-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.text}
            </ReactMarkdown>
          </div>
        )}

        {/* Bottom Metadata: Timestamp + Read Status + Quick Actions */}
        <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] opacity-85 select-none">
          {!isUser && (
            <button
              onClick={handleToggleVoicePlayback}
              className="mr-auto text-slate-400 hover:text-cyan-300 transition"
              title="Speak message aloud"
            >
              <Volume2 className="w-3 h-3" />
            </button>
          )}

          {/* Quick Copy */}
          {message.text && (
            <button
              onClick={() => handleCopyText(message.text)}
              className="text-slate-400 hover:text-white transition opacity-0 group-hover:opacity-100"
              title="Copy message text"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}

          {/* Delete Message option */}
          {onDeleteMessage && (
            <button
              onClick={() => onDeleteMessage(message.id)}
              className="text-slate-400 hover:text-rose-400 transition opacity-0 group-hover:opacity-100 ml-0.5"
              title="Delete message"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          <span className="font-mono text-slate-300">{message.timestamp}</span>

          {/* Sent / Delivered / Read double checkmarks */}
          {isUser && (
            <span title={message.status === 'read' ? 'Read' : message.status === 'delivered' ? 'Delivered' : 'Sent'}>
              {message.status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-cyan-300 inline" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-slate-300 inline" />
              ) : (
                <Check className="w-3.5 h-3.5 text-slate-400 inline" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {showFullImage && message.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden border border-cyan-500/40 shadow-2xl">
            <img src={message.imageUrl} alt="Enlarged preview" className="w-full h-full object-contain" />
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

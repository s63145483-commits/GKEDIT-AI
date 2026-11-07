import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  Upload,
  PhoneCall,
} from 'lucide-react';
import { compressImageClient } from '../../services/imageCompression.ts';

interface ChatInputProps {
  onSendMessage: (text: string, options?: { audioBase64?: string; imageUrl?: string }) => void;
  onTyping?: (isTyping: boolean) => void;
  onOpenDialer?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '😊', '🙏', '🎬', '⚡', '💯', '🚀', '😎', '🤝', '✨', '👋', '🎉'];

export function ChatInput({
  onSendMessage,
  onTyping,
  onOpenDialer,
  disabled,
  placeholder = 'Type a message... (Enter to send)',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showClipMenu, setShowClipMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const typingTimerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Clean up recording context on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (onTyping) {
      if (val.trim().length > 0) {
        onTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          onTyping(false);
        }, 2500);
      } else {
        onTyping(false);
      }
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (onTyping) onTyping(false);

    onSendMessage(trimmed);
    setText('');
    setShowEmojiPicker(false);
    setShowClipMenu(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Voice Note Web Audio Recording with Interactive Waveform Canvas
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const drawLoop = () => {
          if (!canvasRef.current || !analyserRef.current) return;
          const canvas = canvasRef.current;
          const drawCtx = canvas.getContext('2d');
          if (!drawCtx) return;

          const bufferLen = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLen);
          analyserRef.current.getByteFrequencyData(dataArray);

          drawCtx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / bufferLen) * 1.5;
          let x = 0;

          for (let i = 0; i < bufferLen; i++) {
            const barHeight = Math.max(3, (dataArray[i] / 255) * canvas.height);
            const gradient = drawCtx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, '#06b6d4');
            gradient.addColorStop(1, '#10b981');
            drawCtx.fillStyle = gradient;
            drawCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
          }

          animFrameRef.current = requestAnimationFrame(drawLoop);
        };
        requestAnimationFrame(drawLoop);
      } catch (audioErr) {
        console.warn('AudioContext visualization setup error:', audioErr);
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          onSendMessage('🎤 Voice Note', { audioBase64: base64Data });
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('Microphone access is required for voice notes.');
    }
  };

  const stopRecording = (cancel: boolean = false) => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        audioChunksRef.current = [];
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  return (
    <div className="p-2 sm:p-3 bg-[#03091e] border-t border-cyan-500/20 relative select-none">
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-3 z-30 p-2.5 rounded-2xl bg-[#040e24] border border-cyan-500/30 shadow-2xl flex flex-wrap gap-1.5 max-w-[280px] animate-in fade-in slide-in-from-bottom-2">
          {COMMON_EMOJIS.map((e, idx) => (
            <button
              key={idx}
              onClick={() => handleInsertEmoji(e)}
              className="w-8 h-8 rounded-lg hover:bg-cyan-500/20 text-base flex items-center justify-center transition hover:scale-110 active:scale-90"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Clip Menu Popover */}
      {showClipMenu && (
        <div className="absolute bottom-16 left-12 z-30 p-2 rounded-2xl bg-[#040e24] border border-cyan-500/30 shadow-2xl flex flex-col gap-1 min-w-[220px] animate-in fade-in slide-in-from-bottom-2">
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-cyan-500/20 text-xs text-left text-cyan-200 font-bold transition cursor-pointer">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Upload Photo (E2EE Compressed)</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const compressed = await compressImageClient(file, 1080, 0.78);
                  onSendMessage(`📷 Sent photo (${file.name})`, {
                    imageUrl: compressed.base64,
                  });
                  setShowClipMenu(false);
                } catch {
                  alert('Could not process image.');
                }
              }}
            />
          </label>
        </div>
      )}

      {/* Input Field or Recording Bar */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/70 border border-rose-500/40 shadow-lg">
          <div className="flex items-center gap-2 text-rose-300 font-mono text-xs shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold">{recordingSeconds}s</span>
          </div>

          {/* Interactive Web Audio Waveform Canvas */}
          <div className="flex-1 flex justify-center px-1 max-w-[200px] sm:max-w-[260px]">
            <canvas
              ref={canvasRef}
              width={160}
              height={28}
              className="w-full h-7 rounded-lg bg-black/60 border border-cyan-500/30 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => stopRecording(true)}
              className="px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={() => stopRecording(false)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 text-white font-bold text-xs shadow-md transition transform hover:scale-105 active:scale-95"
            >
              Send Voice Note
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowClipMenu(false);
            }}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment Clip Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowClipMenu(!showClipMenu);
              setShowEmojiPicker(false);
            }}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
            title="Attach Media / Photos"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* HyperOS 4 / Google Phone Glass Dialer Toggle */}
          {onOpenDialer && (
            <button
              type="button"
              onClick={onOpenDialer}
              className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition"
              title="Xiaomi HyperOS 4 Glass Dialer"
            >
              <PhoneCall className="w-5 h-5 text-emerald-400" />
            </button>
          )}

          {/* Auto-resizing Textarea */}
          <div className="flex-1 bg-[#050f24] rounded-2xl border border-cyan-500/35 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/40 transition shadow-inner flex items-center px-3 py-1.5 min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full bg-transparent text-white text-xs sm:text-[13px] placeholder-slate-500 resize-none focus:outline-none max-h-28 overflow-y-auto leading-relaxed"
            />
          </div>

          {/* Mic Button or Send Button */}
          {text.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled}
              className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)] transition transform hover:scale-105 active:scale-95"
              title="Send Message"
            >
              <Send className="w-4 h-4 fill-slate-950" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="p-2.5 sm:p-3 rounded-2xl bg-blue-950/80 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition hover:scale-105 active:scale-95"
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4 text-cyan-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

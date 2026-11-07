import React, { useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Activity,
  User,
  Radio,
} from 'lucide-react';
import { WebRTCCallSession, webRtcCallService } from '../../services/webRtcCallService.ts';

interface CallOverlayModalProps {
  session: WebRTCCallSession;
  onClose: () => void;
}

export function CallOverlayModal({ session, onClose }: CallOverlayModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local and remote streams if video call
  useEffect(() => {
    if (session.isVideo) {
      const local = webRtcCallService.getLocalStream();
      if (local && localVideoRef.current) {
        localVideoRef.current.srcObject = local;
      }
      const remote = webRtcCallService.getRemoteStream();
      if (remote && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote;
      }
    }
  }, [session.isVideo, session.status]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isIncoming = session.status === 'ringing';
  const isConnected = session.status === 'connected';
  const isReconnecting = session.status === 'reconnecting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 liquid-glass-modal-backdrop animate-in fade-in select-none">
      <div className="relative w-full max-w-sm sm:max-w-md h-[88vh] max-h-[740px] rounded-3xl overflow-hidden liquid-glass-modal-container flex flex-col justify-between p-6">
        <div className="liquid-glass-modal-glare" />
        {/* Top Bar: E2EE Security Badge & Status Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-300 z-20">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>E2EE Audio • {session.latencyMs}ms</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : isReconnecting
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-cyan-400 animate-ping'
              }`}
            />
            <span className="font-semibold text-[11px] capitalize text-white">
              {session.status === 'calling'
                ? 'Calling...'
                : session.status === 'ringing'
                ? 'Incoming Call...'
                : session.status === 'connected'
                ? formatDuration(session.durationSeconds)
                : session.status === 'reconnecting'
                ? 'Reconnecting ICE...'
                : 'Ended'}
            </span>
          </div>
        </div>

        {/* Center Canvas: Peer Avatar or Video Feed */}
        <div className="relative flex-1 flex flex-col items-center justify-center py-6 z-10">
          {session.isVideo && isConnected ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black border border-cyan-500/30">
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Local Video PIP */}
              <div className="absolute bottom-3 right-3 w-28 h-40 rounded-xl overflow-hidden bg-slate-900 border-2 border-cyan-400 shadow-xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 text-center">
              {/* Glowing Avatar */}
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-cyan-400/60 shadow-[0_0_35px_rgba(6,182,212,0.35)] p-1 bg-[#020512]">
                  <img
                    src={session.peerAvatar}
                    alt={session.peerName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                {/* Pulsing Acoustic Rings */}
                {session.status !== 'connected' && (
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping pointer-events-none" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-white tracking-wide">
                  {session.peerName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {session.isVideo ? 'GK Video Call' : 'GK HD Voice Call'}
                </p>
              </div>

              {/* Connected Audio Waveform Animation */}
              {isConnected && (
                <div className="flex items-center gap-1.5 h-6 pt-2">
                  {[30, 80, 50, 100, 60, 90, 40, 70, 95, 45, 60].map((h, idx) => (
                    <span
                      key={idx}
                      style={{ height: `${h}%` }}
                      className="w-1 bg-gradient-to-t from-cyan-500 to-emerald-400 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="z-20 space-y-4 pt-4 border-t border-cyan-500/15">
          {isIncoming ? (
            /* Incoming Call Actions: Accept (Green) & Decline (Red) */
            <div className="flex items-center justify-around px-4">
              <button
                onClick={() => webRtcCallService.endCall()}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)] transition transform hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-6 h-6" />
                <span className="text-[10px] font-bold mt-0.5">Decline</span>
              </button>

              <button
                onClick={() => webRtcCallService.acceptIncomingCall()}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] transition transform hover:scale-105 active:scale-95 animate-bounce"
              >
                <Phone className="w-6 h-6 fill-slate-950" />
                <span className="text-[10px] font-black mt-0.5">Accept</span>
              </button>
            </div>
          ) : (
            /* Connected / Outgoing In-Call Action Toggles */
            <div className="flex items-center justify-around">
              {/* Mic Toggle */}
              <button
                onClick={() => webRtcCallService.toggleMute()}
                className={`p-3.5 rounded-2xl border transition ${
                  session.isMuted
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                    : 'bg-blue-950/70 border-cyan-500/30 text-white hover:border-cyan-400'
                }`}
                title={session.isMuted ? 'Unmute' : 'Mute'}
              >
                {session.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle (if video session) */}
              {session.isVideo && (
                <button
                  onClick={() => webRtcCallService.toggleVideo()}
                  className={`p-3.5 rounded-2xl border transition ${
                    session.isVideoOff
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                      : 'bg-blue-950/70 border-cyan-500/30 text-white hover:border-cyan-400'
                  }`}
                  title={session.isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {session.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* Speaker Toggle */}
              <button
                onClick={() => webRtcCallService.toggleSpeaker()}
                className={`p-3.5 rounded-2xl border transition ${
                  session.isSpeakerOn
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-blue-950/70 border-cyan-500/30 text-slate-400'
                }`}
                title="Speaker Mode"
              >
                {session.isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* End Call Button (Red) */}
              <button
                onClick={() => {
                  webRtcCallService.endCall();
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] transition transform hover:scale-105 active:scale-95"
                title="End Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

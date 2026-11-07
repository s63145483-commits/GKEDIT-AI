import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  Sparkles,
  Music,
  Wind,
  CloudRain,
  Flame,
  Bell,
  Minimize2,
  Maximize2,
  X,
  Activity,
  Layers,
} from 'lucide-react';

export type AmbientTrackId =
  | 'temple_bells'
  | 'rain'
  | 'om_chant'
  | 'river_stream'
  | 'flute_drone'
  | 'singing_bowl';

export interface AmbientTrack {
  id: AmbientTrackId;
  name: string;
  teluguName: string;
  emoji: string;
  description: string;
  category: 'sacred' | 'nature' | 'mantra';
  color: string;
}

export const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: 'temple_bells',
    name: 'Vedic Temple Bells',
    teluguName: 'దేవాలయ ఘంటానాదం',
    emoji: '🔔',
    description: 'Harmonic bronze temple bells with reverberating brass echoes',
    category: 'sacred',
    color: '#f59e0b',
  },
  {
    id: 'om_chant',
    name: 'Cosmic Om Drone (136.1Hz)',
    teluguName: 'ఓంకార ప్రణవ నాదం',
    emoji: '🕉️',
    description: 'Deep primordial Earth frequency Om drone with warm vocal resonance',
    category: 'mantra',
    color: '#a855f7',
  },
  {
    id: 'rain',
    name: 'Monsoon Ashram Rain',
    teluguName: 'ధ్యాన వర్షపు ధ్వని',
    emoji: '🌧️',
    description: 'Gentle continuous rainfall on temple leaves & tranquil courtyard',
    category: 'nature',
    color: '#06b6d4',
  },
  {
    id: 'singing_bowl',
    name: 'Tibetan Singing Bowl (528Hz)',
    teluguName: 'సింగింగ్ బౌల్ ధ్వని',
    emoji: '🥣',
    description: 'Continuous Solfeggio 528Hz DNA repair & heart chakra frequency',
    category: 'sacred',
    color: '#10b981',
  },
  {
    id: 'river_stream',
    name: 'Ganges Mountain Stream',
    teluguName: 'గంగా నదీ ప్రవాహం',
    emoji: '🌊',
    description: 'Crisp babbling Himalayan brook flowing smoothly over pebbles',
    category: 'nature',
    color: '#3b82f6',
  },
  {
    id: 'flute_drone',
    name: 'Bansuri Tanpura Drone',
    teluguName: 'తంబుర & వేణువు',
    emoji: '🪈',
    description: 'Sacred Sa-Pa Indian Tanpura drone with meditative flute overtones',
    category: 'mantra',
    color: '#ec4899',
  },
];

interface DevotionalAmbientPlayerProps {
  compact?: boolean;
}

export function DevotionalAmbientPlayer({ compact = false }: DevotionalAmbientPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTrackId, setActiveTrackId] = useState<AmbientTrackId>('temple_bells');
  const [volume, setVolume] = useState<number>(0.55);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showMixer, setShowMixer] = useState<boolean>(false);

  // Secondary overlay track for dual-ambience (e.g. Om Chant + Temple Bells)
  const [secondaryTrackId, setSecondaryTrackId] = useState<AmbientTrackId | null>('om_chant');
  const [secondaryVolume, setSecondaryVolume] = useState<number>(0.35);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Active Sound Nodes references
  const primaryNodesRef = useRef<any[]>([]);
  const secondaryNodesRef = useRef<any[]>([]);
  const bellIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeTrack = AMBIENT_TRACKS.find((t) => t.id === activeTrackId) || AMBIENT_TRACKS[0];

  // -------------------------------------------------------------
  // 1. Audio Engine Initialization
  // -------------------------------------------------------------
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);
      master.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = master;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // -------------------------------------------------------------
  // 2. Synthesize High-Quality Procedural Audio Loops (Zero Asset MP3s)
  // -------------------------------------------------------------
  const stopAllNodes = () => {
    if (bellIntervalRef.current) {
      clearInterval(bellIntervalRef.current);
      bellIntervalRef.current = null;
    }

    primaryNodesRef.current.forEach((n) => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch {}
    });
    primaryNodesRef.current = [];

    secondaryNodesRef.current.forEach((n) => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch {}
    });
    secondaryNodesRef.current = [];
  };

  // A. Synthesize Temple Bell Strike
  const triggerTempleBellStrike = (ctx: AudioContext, dest: AudioNode, pitchMultiplier = 1.0) => {
    const now = ctx.currentTime;
    const baseFreq = 440 * pitchMultiplier; // A4
    const partials = [1, 2.756, 5.404, 8.932, 13.34];
    const weights = [1, 0.45, 0.25, 0.15, 0.08];

    partials.forEach((partial, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq * partial, now);

      const decay = (4.5 / partial) * 1.2;
      const peakVol = weights[i] * 0.12;

      gain.gain.setValueAtTime(peakVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + decay);
    });
  };

  // B. Start Specific Procedural Track Generator
  const startTrackGenerator = (
    trackId: AmbientTrackId,
    ctx: AudioContext,
    trackGain: GainNode,
    isSecondary = false
  ) => {
    const nodes: any[] = [trackGain];

    switch (trackId) {
      case 'temple_bells': {
        // Continuous subtle atmospheric bronze drone + periodic periodic rhythmic temple bells
        const droneOsc = ctx.createOscillator();
        const droneGain = ctx.createGain();
        droneOsc.type = 'sine';
        droneOsc.frequency.setValueAtTime(216, ctx.currentTime); // 216Hz sacred root
        droneGain.gain.setValueAtTime(0.06, ctx.currentTime);
        droneOsc.connect(droneGain);
        droneGain.connect(trackGain);
        droneOsc.start();
        nodes.push(droneOsc, droneGain);

        // Initial bell
        triggerTempleBellStrike(ctx, trackGain, 1.0);

        // Periodic strikes with natural musical intervals (A4, E5, D5, C#5)
        const strikes = [1.0, 1.5, 1.33, 1.25, 0.75];
        let strikeIdx = 0;
        const interval = setInterval(() => {
          if (ctx.state === 'running') {
            const pitch = strikes[strikeIdx % strikes.length];
            triggerTempleBellStrike(ctx, trackGain, pitch);
            strikeIdx++;
          }
        }, 3400);

        if (!isSecondary) {
          bellIntervalRef.current = interval;
        }
        break;
      }

      case 'om_chant': {
        // 136.1 Hz (Om/Earth frequency) multi-harmonic binaural choir drone
        const rootFreq = 136.1;
        const omPitches = [rootFreq * 0.5, rootFreq, rootFreq * 1.5, rootFreq * 2]; // Octaves & Fifth

        omPitches.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Subtle LFO vibrato (0.2Hz gentle meditative breathing)
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(0.18 + idx * 0.04, ctx.currentTime);
          lfoGain.gain.setValueAtTime(1.8, ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start();

          gain.gain.setValueAtTime(0.08 / (idx + 1), ctx.currentTime);
          osc.connect(gain);
          gain.connect(trackGain);
          osc.start();

          nodes.push(osc, gain, lfo, lfoGain);
        });
        break;
      }

      case 'rain': {
        // High quality brown/pink noise generator shaped with bandpass filters for rain droplets
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02; // Pink noise integration
          lastOut = output[i];
          output[i] *= 2.8;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);

        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'highpass';
        filter2.frequency.setValueAtTime(220, ctx.currentTime);

        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(0.18, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(filter2);
        filter2.connect(rainGain);
        rainGain.connect(trackGain);
        whiteNoise.start();

        nodes.push(whiteNoise, filter, filter2, rainGain);
        break;
      }

      case 'singing_bowl': {
        // 528 Hz Solfeggio bowl harmonic with slow 0.1 Hz amplitude modulation
        const baseFreq = 528;
        const partials = [1, 2.76, 5.4];

        partials.forEach((p, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq * p, ctx.currentTime);

          // Tremolo breathing
          const tremolo = ctx.createOscillator();
          const tremoloGain = ctx.createGain();
          tremolo.frequency.setValueAtTime(0.12, ctx.currentTime);
          tremoloGain.gain.setValueAtTime(0.04, ctx.currentTime);
          tremolo.connect(tremoloGain);
          tremoloGain.connect(gain.gain);
          tremolo.start();

          gain.gain.setValueAtTime(0.1 / (idx + 1), ctx.currentTime);
          osc.connect(gain);
          gain.connect(trackGain);
          osc.start();

          nodes.push(osc, gain, tremolo, tremoloGain);
        });
        break;
      }

      case 'river_stream': {
        // Mountain stream water flowing (dual filtered noise streams)
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(680, ctx.currentTime);
        bp.Q.setValueAtTime(1.2, ctx.currentTime);

        // Water undulating filter
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.3, ctx.currentTime);
        lfoGain.gain.setValueAtTime(180, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(bp.frequency);
        lfo.start();

        const streamGain = ctx.createGain();
        streamGain.gain.setValueAtTime(0.14, ctx.currentTime);

        source.connect(bp);
        bp.connect(streamGain);
        streamGain.connect(trackGain);
        source.start();

        nodes.push(source, bp, lfo, lfoGain, streamGain);
        break;
      }

      case 'flute_drone': {
        // Indian Tanpura Pa-Sa-Sa-Sa drone (G3 & C4)
        const tanpuraFreqs = [196, 261.63, 261.63 * 1.002, 130.81];

        tanpuraFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.06 / (idx + 1), ctx.currentTime);
          osc.connect(gain);
          gain.connect(trackGain);
          osc.start();

          nodes.push(osc, gain);
        });
        break;
      }
    }

    if (isSecondary) {
      secondaryNodesRef.current = nodes;
    } else {
      primaryNodesRef.current = nodes;
    }
  };

  // -------------------------------------------------------------
  // 3. Play & Stop Controller
  // -------------------------------------------------------------
  const playCurrentAmbience = () => {
    const ctx = initAudio();
    if (!ctx || !masterGainRef.current) return;

    stopAllNodes();

    // Primary track gain
    const primaryGain = ctx.createGain();
    primaryGain.gain.setValueAtTime(0.7, ctx.currentTime);
    primaryGain.connect(masterGainRef.current);
    startTrackGenerator(activeTrackId, ctx, primaryGain, false);

    // Optional secondary layered track (if enabled)
    if (secondaryTrackId && secondaryTrackId !== activeTrackId) {
      const secondaryGain = ctx.createGain();
      secondaryGain.gain.setValueAtTime(secondaryVolume, ctx.currentTime);
      secondaryGain.connect(masterGainRef.current);
      startTrackGenerator(secondaryTrackId, ctx, secondaryGain, true);
    }

    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAllNodes();
      setIsPlaying(false);
    } else {
      playCurrentAmbience();
    }
  };

  const handleSelectTrack = (trackId: AmbientTrackId) => {
    setActiveTrackId(trackId);
    if (isPlaying) {
      setTimeout(() => {
        const ctx = initAudio();
        if (ctx && masterGainRef.current) {
          stopAllNodes();

          const primaryGain = ctx.createGain();
          primaryGain.gain.setValueAtTime(0.7, ctx.currentTime);
          primaryGain.connect(masterGainRef.current);
          startTrackGenerator(trackId, ctx, primaryGain, false);

          if (secondaryTrackId && secondaryTrackId !== trackId) {
            const secondaryGain = ctx.createGain();
            secondaryGain.gain.setValueAtTime(secondaryVolume, ctx.currentTime);
            secondaryGain.connect(masterGainRef.current);
            startTrackGenerator(secondaryTrackId, ctx, secondaryGain, true);
          }
        }
      }, 50);
    }
  };

  // Adjust master volume
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const targetVal = isMuted ? 0 : volume;
      masterGainRef.current.gain.setTargetAtTime(targetVal, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllNodes();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // -------------------------------------------------------------
  // COMPACT VIEW (Inline Pill in Japa Mala Header)
  // -------------------------------------------------------------
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md ${
            isPlaying
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse'
              : 'bg-black/60 border-amber-500/40 text-amber-200 hover:text-white hover:bg-amber-950/40'
          }`}
          title="Toggle Meditative Ambient Sound"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>{activeTrack.emoji} Ambience: ON</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{activeTrack.emoji} Ambience: OFF</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowMixer(true)}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-300 transition"
          title="Customize Ambient Sound & Volume"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Mixer Modal for Compact Mode */}
        {showMixer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="max-w-md w-full p-5 rounded-3xl bg-slate-950 border border-amber-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Ambient Sound Studio</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMixer(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Track Grid */}
              <div className="grid grid-cols-2 gap-2">
                {AMBIENT_TRACKS.map((track) => {
                  const isCurrent = track.id === activeTrackId;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleSelectTrack(track.id)}
                      className={`p-3 rounded-2xl text-left border transition ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                          : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="text-xl mb-1">{track.emoji}</div>
                      <div className="text-xs font-bold">{track.name}</div>
                      <div className="text-[10px] text-amber-300/80 font-serif">
                        {track.teluguName}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>Volume</span>
                  <span className="text-amber-400 font-bold">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md"
                >
                  {isPlaying ? 'Pause Sound' : 'Play Ambient Sound'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL EXPANDED AMBIENT STUDIO CARD (For Devotional Tab)
  // -------------------------------------------------------------
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1c1007]/95 via-[#0e0703]/90 to-[#050201] border border-amber-500/35 shadow-2xl relative overflow-hidden space-y-4">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-md">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Devotional Ambient Sanctuary</h3>
              <span className="text-[9.5px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                PRO-SYNTH
              </span>
            </div>
            <p className="text-xs text-amber-200/80 font-sans">
              Continuous meditative soundscape to elevate your Japa Mala chanting focus
            </p>
          </div>
        </div>

        {/* Master Play Button & Sound Wave */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-mono font-bold">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>PLAYING</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-lg cursor-pointer ${
              isPlaying
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white border border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Ambience</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Meditative Sound</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* TRACK SELECTION GRID (Temple Bells, Rain, Om Chant, etc.) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        {AMBIENT_TRACKS.map((track) => {
          const isSelected = track.id === activeTrackId;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => handleSelectTrack(track.id)}
              className={`p-3.5 rounded-2xl text-left border transition active:scale-95 relative overflow-hidden group ${
                isSelected
                  ? 'bg-gradient-to-br from-amber-500/25 via-yellow-500/15 to-transparent border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-black/60 border-white/10 hover:border-amber-500/40 text-slate-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
              <div className="text-2xl mb-1">{track.emoji}</div>
              <div className="text-xs font-extrabold text-white group-hover:text-amber-200">
                {track.name}
              </div>
              <div className="text-[10px] text-amber-300 font-serif mt-0.5">
                {track.teluguName}
              </div>
              <p className="text-[9.5px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                {track.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* LOWER CONTROLS: VOLUME, MUTE & DUAL-LAYER SOUND MIXER */}
      <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-300">
        {/* Master Volume Bar */}
        <div className="flex items-center gap-3 w-full sm:w-72">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-900 rounded-lg"
          />
          <span className="text-[11px] text-amber-300 font-bold shrink-0">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>

        {/* Layer Second Sound Option */}
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Layer Overlay:</span>
          </span>
          <select
            value={secondaryTrackId || ''}
            onChange={(e) => {
              const val = e.target.value ? (e.target.value as AmbientTrackId) : null;
              setSecondaryTrackId(val);
              if (isPlaying) {
                setTimeout(playCurrentAmbience, 50);
              }
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-amber-300 focus:outline-none focus:border-amber-400"
          >
            <option value="">None (Single Track)</option>
            {AMBIENT_TRACKS.filter((t) => t.id !== activeTrackId).map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

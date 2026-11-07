import React, { useState } from 'react';
import {
  Youtube,
  Play,
  Sparkles,
  ExternalLink,
  Award,
  Flame,
  Check,
  Copy,
  Film,
  Scissors,
  Layers,
  Sliders,
  Palette,
  Volume2,
  Tv,
  ArrowRight,
  Share2,
  Star,
  CheckCircle2,
  Bookmark,
  TrendingUp,
  Clapperboard,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { notificationService } from '../services/notificationService.ts';

// ---------------------------------------------------------------------------
// SHOWCASE PROJECT DATA
// ---------------------------------------------------------------------------
export interface ShowcaseVideo {
  id: string;
  title: string;
  channel: '@GKEDIT2141' | '@GKEDITOFFICIAL2141';
  channelUrl: string;
  category: 'cinematic' | 'velocity' | 'typography' | 'mobile' | 'tutorials';
  categoryLabel: string;
  duration: string;
  resolution: string;
  software: string[];
  thumbnailGradient: string;
  embedId?: string; // YouTube video embed ID
  youtubeUrl: string;
  description: string;
  techniques: string[];
  tips: string;
  likesCount?: string;
  viewsCount?: string;
}

const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  {
    id: 'vid_1',
    title: 'Cinematic Velocity & Seamless Zoom Transition Masterclass',
    channel: '@GKEDIT2141',
    channelUrl: 'https://youtube.com/@GKEDIT2141',
    category: 'velocity',
    categoryLabel: 'Velocity & Zoom',
    duration: '04:12',
    resolution: '4K 60FPS',
    software: ['Alight Motion', 'CapCut Pro', 'After Effects'],
    thumbnailGradient: 'from-cyan-900/80 via-blue-950/90 to-black',
    embedId: '77ZozI0rw7w',
    youtubeUrl: 'https://youtube.com/@GKEDIT2141',
    description:
      'Learn how to execute lightning-fast velocity speed ramps synchronized to kick drums, combined with smooth motion blur and optical flow interpolation.',
    techniques: ['Twixtor Speed Curve', 'Optical Flow Blur', 'Flash Overlay Glow', 'Screen Shake FX'],
    tips: 'Set velocity points on beat drops: Slow down to 30% before the drop, then spike to 400% on the snare.',
    likesCount: '4.8K',
    viewsCount: '52K',
  },
  {
    id: 'vid_2',
    title: 'Hollywood Teal & Orange Cinematic Color Grading LUT Workflow',
    channel: '@GKEDITOFFICIAL2141',
    channelUrl: 'https://youtube.com/@GKEDITOFFICIAL2141',
    category: 'cinematic',
    categoryLabel: 'Color Grading',
    duration: '06:45',
    resolution: '4K HDR',
    software: ['DaVinci Resolve', 'Premiere Pro', 'CapCut PC'],
    thumbnailGradient: 'from-amber-900/80 via-slate-950/90 to-black',
    embedId: 'jfKfPfyJRdk',
    youtubeUrl: 'https://youtube.com/@GKEDITOFFICIAL2141',
    description:
      'Step-by-step breakdown of color science for phone footage: isolating warm skin tones while pushing shadows into rich cinematic cyan and teal shadows.',
    techniques: ['HSL Skin Isolation', 'Split Toning Cyan/Orange', 'Film Grain 35mm', 'Anamorphic Glow'],
    tips: 'Never crush shadows completely to 0 IRE. Keep minimum blacks at 5-8 IRE for rich organic film depth.',
    likesCount: '3.9K',
    viewsCount: '41K',
  },
  {
    id: 'vid_3',
    title: '3D Kinetic Typography & Neon Glow Lyrics Animation',
    channel: '@GKEDIT2141',
    channelUrl: 'https://youtube.com/@GKEDIT2141',
    category: 'typography',
    categoryLabel: 'Kinetic 3D Text',
    duration: '03:50',
    resolution: '1080p 60FPS',
    software: ['Alight Motion', 'After Effects', 'Photoshop'],
    thumbnailGradient: 'from-purple-900/80 via-indigo-950/90 to-black',
    embedId: 'M7lc1UVf-VE',
    youtubeUrl: 'https://youtube.com/@GKEDIT2141',
    description:
      'Create viral trending lyrics and title sequences with 3D camera tracking, Saber neon strokes, and chromatic aberration split rgb.',
    techniques: ['Saber Neon Strokes', 'Camera 3D Orbit', 'RGB Split Glitch', 'Null Object Linking'],
    tips: 'Add 15% RGB chromatic aberration on text exit animations to produce high-energy punchy cuts.',
    likesCount: '5.2K',
    viewsCount: '68K',
  },
  {
    id: 'vid_4',
    title: 'Mobile Video Editing Masterclass: High-FPS Reels on Android/iOS',
    channel: '@GKEDITOFFICIAL2141',
    channelUrl: 'https://youtube.com/@GKEDITOFFICIAL2141',
    category: 'mobile',
    categoryLabel: 'Mobile Editing',
    duration: '08:20',
    resolution: '1080x1920 (9:16)',
    software: ['Alight Motion', 'CapCut', 'VN Editor'],
    thumbnailGradient: 'from-emerald-900/80 via-teal-950/90 to-black',
    embedId: 'dQw4w9WgXcQ',
    youtubeUrl: 'https://youtube.com/@GKEDITOFFICIAL2141',
    description:
      'Unlock pro-level editing on your smartphone: keyframing curves, custom XML project imports, and bit-rate settings for Instagram & YouTube Shorts compression.',
    techniques: ['Bezier Curve Keyframes', 'Mask Tracking', 'XML Project Import', 'Export Bitrate 50Mbps'],
    tips: 'Export at 1080p 60fps with H.264 High Profile and 25-30 Mbps to prevent Instagram compression crunch.',
    likesCount: '6.1K',
    viewsCount: '79K',
  },
  {
    id: 'vid_5',
    title: 'Epic Sound Design Secrets: Risers, Sub-Bass & Transition Whooshes',
    channel: '@GKEDIT2141',
    channelUrl: 'https://youtube.com/@GKEDIT2141',
    category: 'tutorials',
    categoryLabel: 'Sound Design',
    duration: '05:15',
    resolution: '4K 60FPS',
    software: ['Premiere Pro', 'FL Studio', 'CapCut'],
    thumbnailGradient: 'from-rose-900/80 via-red-950/90 to-black',
    embedId: 'kJQP7kiw5Fk',
    youtubeUrl: 'https://youtube.com/@GKEDIT2141',
    description:
      'Sound is 60% of video emotion! Learn how GK EDIT layers sub-bass impacts, reversed cymbals, and binaural stereo pan sweeps for mind-bending transitions.',
    techniques: ['Binaural Panning', 'Sub-Bass Drop (40Hz)', 'White Noise Riser', 'Audio Ducking'],
    tips: 'Always align the peak of your whoosh sound 2 frames BEFORE the visual cut for maximum visceral impact.',
    likesCount: '4.4K',
    viewsCount: '48K',
  },
  {
    id: 'vid_6',
    title: 'AI Video Editing Revolution: Prompt to Cinematic B-Roll with Veo',
    channel: '@GKEDITOFFICIAL2141',
    channelUrl: 'https://youtube.com/@GKEDITOFFICIAL2141',
    category: 'tutorials',
    categoryLabel: 'AI + Editing',
    duration: '07:10',
    resolution: '4K Ultra',
    software: ['Google Veo', 'GKEDIT AI', 'Premiere Pro'],
    thumbnailGradient: 'from-cyan-900/80 via-indigo-950/90 to-black',
    embedId: 'L_LUpnjgPso',
    youtubeUrl: 'https://youtube.com/@GKEDITOFFICIAL2141',
    description:
      'Integrating generative AI video tools into real editing timelines: creating hyper-realistic drone plates and seamless morph transitions with GKEDIT AI.',
    techniques: ['Veo Prompt Engineering', 'Morph Cut Interpolation', 'Speed Ramping AI Clips', 'LUT Matching'],
    tips: 'Use 24fps film motion blur when blending AI-generated B-roll with live camera footage.',
    likesCount: '5.7K',
    viewsCount: '63K',
  },
];

const EDITING_PRINCIPLES = [
  {
    num: '01',
    title: 'The Golden 3-Frame Cut',
    desc: 'Match actions on movement. Cut 3 frames before a kick, punch, or vehicle turn so the viewer’s eye glides effortlessly into the next camera angle.',
    icon: Scissors,
  },
  {
    num: '02',
    title: 'Bezier Velocity Curves',
    desc: 'Linear speed changes feel robotic. Always use custom S-curves: steep acceleration on impact, followed by a gentle decay curve.',
    icon: TrendingUp,
  },
  {
    num: '03',
    title: 'Color Separation & Depth',
    desc: 'Contrast warmth in your subject with cool tones in the background. Keep skin tones locked between 60-70 IRE on the vectorscope.',
    icon: Palette,
  },
  {
    num: '04',
    title: 'Impact Sound Layering',
    desc: 'Never use a single whoosh. Stack a low-frequency rumble (40-60Hz) with a metallic whoosh and a vinyl reverse cymbal.',
    icon: Volume2,
  },
];

export function VideoEditingShowcase({
  onNavigateTab,
  onOpenCreatorHub,
}: {
  onNavigateTab?: (tab: any) => void;
  onOpenCreatorHub?: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeVideo, setActiveVideo] = useState<ShowcaseVideo>(SHOWCASE_VIDEOS[0]);
  const [isPlayingEmbed, setIsPlayingEmbed] = useState<boolean>(false);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  const handleConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#3b82f6', '#ef4444', '#fbbf24', '#10b981'],
    });
  };

  const handleCopy = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedChannel(label);
    notificationService.showInAppToast('Link Copied', `Copied ${label} to clipboard!`, 'success');
    setTimeout(() => setCopiedChannel(null), 2500);
  };

  const filteredVideos =
    selectedCategory === 'all'
      ? SHOWCASE_VIDEOS
      : SHOWCASE_VIDEOS.filter((v) => v.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-32 space-y-8 animate-fade-in">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO BANNER: GK EDIT DEDICATED SHOWCASE & CHANNELS          */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#040e24] via-[#020716] to-[#01030a] border border-cyan-500/35 shadow-[0_12px_45px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>OFFICIAL CREATOR SHOWCASE</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                <span>YOUTUBE NETWORK</span>
              </span>
            </div>

            {onOpenCreatorHub && (
              <button
                onClick={onOpenCreatorHub}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 border border-white/10 hover:border-cyan-400/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>Creator Dossier</span>
              </button>
            )}
          </div>

          {/* Headline & Description */}
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              GK EDIT <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-red-400">Video Editing Showcase</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Explore high-impact video editing tutorials, aesthetic cinematic grading, velocity speed ramping, and creative project breakdowns by <strong className="text-white">Master GK EDIT</strong> (9th Class Prodigy & Creator of GKEDIT AI).
            </p>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* DUAL CHANNEL SUBSCRIBE CARDS                                  */}
          {/* ------------------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* CHANNEL 1: @GKEDIT2141 */}
            <div className="group relative p-5 rounded-2xl bg-[#030919]/90 border border-cyan-500/30 hover:border-cyan-400/80 shadow-[0_4px_25px_rgba(6,182,212,0.15)] hover:shadow-[0_0_35px_rgba(6,182,212,0.3)] transition-all duration-300 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-red-500 fill-red-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-cyan-200 transition">
                        GK EDIT
                      </h3>
                      <p className="text-xs font-mono font-bold text-cyan-400">@GKEDIT2141</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                    MAIN CHANNEL
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Premier channel for high-level mobile video editing, trending velocity transitions, Alight Motion XMLs, and viral short-form cinematic hacks.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-white/5 text-slate-400">
                    Velocity FX
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-white/5 text-slate-400">
                    Alight Motion
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-white/5 text-slate-400">
                    Trending XMLs
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <a
                  href="https://youtube.com/@GKEDIT2141?sub_confirmation=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleConfetti}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer transition transform active:scale-95"
                >
                  <Youtube className="w-4 h-4 fill-white" />
                  <span>Subscribe @GKEDIT2141</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('https://youtube.com/@GKEDIT2141', '@GKEDIT2141')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Copy Channel Link"
                >
                  {copiedChannel === '@GKEDIT2141' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* CHANNEL 2: @GKEDITOFFICIAL2141 */}
            <div className="group relative p-5 rounded-2xl bg-[#030919]/90 border border-red-500/30 hover:border-red-400/80 shadow-[0_4px_25px_rgba(239,68,68,0.15)] hover:shadow-[0_0_35px_rgba(239,68,68,0.3)] transition-all duration-300 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-red-500 fill-red-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-red-300 transition">
                        GK EDIT OFFICIAL
                      </h3>
                      <p className="text-xs font-mono font-bold text-red-400">@GKEDITOFFICIAL2141</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                    OFFICIAL CHANNEL
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Official home for long-form editing masterclasses, Hollywood color grading LUTs, sound design packs, and AI-powered production workflows.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-white/5 text-slate-400">
                    Color LUTs
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-white/5 text-slate-400">
                    Masterclasses
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-white/5 text-slate-400">
                    Sound Design
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <a
                  href="https://youtube.com/@GKEDITOFFICIAL2141?sub_confirmation=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleConfetti}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer transition transform active:scale-95"
                >
                  <Youtube className="w-4 h-4 fill-white" />
                  <span>Subscribe @GKEDITOFFICIAL2141</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('https://youtube.com/@GKEDITOFFICIAL2141', '@GKEDITOFFICIAL2141')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Copy Channel Link"
                >
                  {copiedChannel === '@GKEDITOFFICIAL2141' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. FEATURED CINEMATIC SPOTLIGHT PLAYER                         */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Featured Video Player & Technique Breakdown
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Selected: <span className="text-cyan-300 font-bold">{activeVideo.categoryLabel}</span>
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl bg-[#030919] border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          {/* Top Video Stage: 16:9 Responsive Embed / Custom Player Card */}
          <div className="relative aspect-video w-full bg-black overflow-hidden group">
            {isPlayingEmbed && activeVideo.embedId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.embedId}?autoplay=1&rel=0&modestbranding=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div
                className={`relative w-full h-full bg-gradient-to-br ${activeVideo.thumbnailGradient} flex flex-col items-center justify-center p-6 text-center cursor-pointer`}
                onClick={() => setIsPlayingEmbed(true)}
              >
                {/* Tech grid overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none" />

                {/* Big Center Play Button */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-red-600 p-0.5 shadow-[0_0_40px_rgba(6,182,212,0.6)] group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-slate-950/90 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  </div>
                </div>

                {/* Video Info Overlay */}
                <div className="relative z-10 mt-5 max-w-xl space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-xs font-mono text-cyan-300">
                    <span>{activeVideo.channel}</span>
                    <span>•</span>
                    <span>{activeVideo.resolution}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                    {activeVideo.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2">{activeVideo.description}</p>
                </div>

                {/* Badges on Bottom Bar */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-cyan-300 font-bold">
                    ⏱ {activeVideo.duration}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-red-600/80 text-white font-bold">
                    Click to Play Video
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Under-video Detailed Breakdown Bar */}
          <div className="p-6 space-y-4 bg-gradient-to-b from-[#040e24] to-[#020614] border-t border-cyan-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{activeVideo.channel}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono text-slate-400">{activeVideo.resolution}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">{activeVideo.title}</h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleConfetti}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition cursor-pointer"
                >
                  <Youtube className="w-4 h-4 fill-white" />
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{activeVideo.description}</p>

            {/* Techniques Used & Software Stack */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              {/* Techniques */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Key Techniques Mastered</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeVideo.techniques.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 border border-cyan-400/30 text-cyan-200"
                    >
                      ✓ {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Software Stack & Pro Tip */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Software Stack</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeVideo.software.map((sw) => (
                    <span
                      key={sw}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-white/10 text-slate-200"
                    >
                      {sw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pro Creator Tip Callout */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/25 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-cyan-300">GK EDIT Pro Tip: </span>
                <span className="text-slate-300">{activeVideo.tips}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SHOWCASE FILTER TABS & PROJECT CARDS GRID                   */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-cyan-400" />
              <span>Explore Editing Projects & Masterclasses</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select any project to inspect the editing breakdown or watch the tutorial
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'velocity', label: 'Velocity FX' },
              { id: 'cinematic', label: 'Color Grading' },
              { id: 'typography', label: 'Kinetic 3D' },
              { id: 'mobile', label: 'Mobile Editing' },
              { id: 'tutorials', label: 'Masterclasses' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => {
            const isSelected = activeVideo.id === video.id;

            return (
              <div
                key={video.id}
                onClick={() => {
                  setActiveVideo(video);
                  setIsPlayingEmbed(false);
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                className={`group relative rounded-3xl p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#081a38] to-[#040e24] border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40'
                    : 'bg-[#030919]/80 hover:bg-[#071328] border-cyan-500/20 hover:border-cyan-400/50'
                }`}
              >
                {/* Thumbnail Preview Banner */}
                <div
                  className={`relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ${video.thumbnailGradient} flex items-center justify-center p-3 mb-3 border border-white/5`}
                >
                  <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-cyan-400/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 text-cyan-300 fill-cyan-300 ml-0.5" />
                  </div>

                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/80 text-cyan-300 border border-white/10">
                    {video.duration}
                  </span>

                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-red-600/80 text-white">
                    {video.channel}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400">
                      <span>{video.categoryLabel}</span>
                      <span>{video.resolution}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-200 transition line-clamp-2 mt-1">
                      {video.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{video.description}</p>
                  </div>

                  {/* Software Pills */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1 truncate max-w-[170px]">
                      {video.software.slice(0, 2).map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-white/10 text-slate-300 truncate"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. GK EDIT VIDEO EDITING MASTERCLASS PRINCIPLES               */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#061430] via-[#030919] to-[#01030a] border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.6)] space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Creator Guidelines</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              The 4 Pillars of Cinematic Video Editing
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Core editing philosophies taught across GK EDIT’s YouTube channels for maximum viewer retention
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EDITING_PRINCIPLES.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.num}
                className="p-5 rounded-2xl bg-[#030818]/90 border border-cyan-500/20 hover:border-cyan-400/50 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-cyan-400/40">{pillar.num}</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white">{pillar.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. TIE-IN: AI SCRIPT GENERATOR & VEO VIDEO CALL-TO-ACTION     */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-indigo-950/40 border border-cyan-500/35 shadow-[0_8px_30px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[11px] font-mono font-bold">
            INTEGRATED CREATIVE SUITE
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Have an Edit Idea? Generate Scripts & AI B-Roll
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Use GKEDIT AI's built-in generators to write multi-scene video scripts in Telugu, Tanglish, or English, and render cinematic shots using Google Veo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('generators')}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer transition transform active:scale-95"
            >
              <Clapperboard className="w-4 h-4" />
              <span>Launch AI Video Studio</span>
            </button>
          )}

          <a
            href="https://youtube.com/@GKEDIT2141?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleConfetti}
            className="py-3 px-5 rounded-2xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] cursor-pointer transition transform active:scale-95"
          >
            <Youtube className="w-4 h-4 fill-white" />
            <span>Join 100K+ Editors</span>
          </a>
        </div>
      </div>
    </div>
  );
}

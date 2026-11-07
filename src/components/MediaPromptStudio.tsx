import React, { useState } from 'react';
import { Sparkles, Copy, Check, Wand2, Image as ImageIcon, Video, Film, Sliders, RefreshCw, Layers } from 'lucide-react';
import { ImageStudio } from './ImageStudio.tsx';
import { LiquidGlassNav } from './LiquidGlassNav.tsx';

export function MediaPromptStudio() {
  const [activeMode, setActiveMode] = useState<'prompt_crafter' | 'image_studio'>('image_studio');
  const [subject, setSubject] = useState('Futuristic Telugu cinematic superhero');
  const [style, setStyle] = useState('Photorealistic 8K');
  const [lighting, setLighting] = useState('Volumetric Neon Golden Hour');
  const [cameraAngle, setCameraAngle] = useState('Low angle dynamic heroic shot');
  const [mood, setMood] = useState('Epic, Inspiring, High Stakes');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [copied, setCopied] = useState(false);

  const styles = [
    'Photorealistic 8K',
    'Cinematic VFX Panavision',
    'Anime Studio Ghibli',
    'Cyberpunk Neon Noir',
    'Unreal Engine 5 3D Render',
    'Dark Fantasy Hyper-detailed',
    'Telugu Mythological Epic Style',
    'Minimalist Modern Vector',
  ];

  const lightings = [
    'Volumetric Neon Golden Hour',
    'Dramatic Studio Chiaroscuro',
    'Bioluminescent Cyber Glow',
    'Soft Diffused Sunlight',
    'High-Contrast Cyberpunk Rim Light',
    'Moody God Rays & Atmospheric Fog',
  ];

  const angles = [
    'Low angle dynamic heroic shot',
    'Extreme close-up macro details',
    'Wide-angle establishing cinematic landscape',
    'Over-the-shoulder dramatic perspective',
    'Bird-eye aerial drone view',
    'Dutch tilt dynamic action angle',
  ];

  const fullPrompt = `${subject}, ${style}, ${cameraAngle}, ${lighting}, mood: ${mood}, 8k resolution, masterpieces, ultra-fine details, Unreal Engine 5 render, raytracing, sharp focus`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Switcher */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#040e24]/90 border border-cyan-500/25">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-cyan-400" />
            <span>GK EDIT Media Prompt & Image Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Craft high-fidelity prompts for Imagen, Pollinations AI, and Veo video generators
          </p>
        </div>

        <LiquidGlassNav
          activeId={activeMode}
          className="flex border border-cyan-500/30 rounded-full p-1 text-xs"
        >
          <button
            data-nav-id="image_studio"
            onClick={() => setActiveMode('image_studio')}
            className={`liquid-nav-btn px-3 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'image_studio'
                ? 'text-cyan-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Image Studio
          </button>
          <button
            data-nav-id="prompt_crafter"
            onClick={() => setActiveMode('prompt_crafter')}
            className={`liquid-nav-btn px-3 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'prompt_crafter'
                ? 'text-cyan-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Prompt Crafter
          </button>
        </LiquidGlassNav>
      </div>

      {activeMode === 'image_studio' ? (
        <ImageStudio />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls Panel */}
          <div className="p-6 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 space-y-4 shadow-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">Core Subject / Concept</label>
              <textarea
                rows={3}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#030818] border border-cyan-500/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="Describe character, landscape, action, or theme..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">Visual Art Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-[#030818] border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              >
                {styles.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Lighting</label>
                <select
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value)}
                  className="w-full bg-[#030818] border border-cyan-500/30 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  {lightings.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Camera Angle</label>
                <select
                  value={cameraAngle}
                  onChange={(e) => setCameraAngle(e.target.value)}
                  className="w-full bg-[#030818] border border-cyan-500/30 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  {angles.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">Mood & Vibe</label>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-[#030818] border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Compiled Prompt Panel */}
          <div className="p-6 rounded-3xl bg-[#040e24]/90 border border-cyan-500/25 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Compiled Synthesis Prompt
                </span>
                <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                  {fullPrompt.length} chars
                </span>
              </div>

              <div className="bg-[#020612] border border-cyan-500/20 rounded-2xl p-4 text-xs font-mono text-cyan-100 leading-relaxed max-h-64 overflow-y-auto">
                {fullPrompt}
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setActiveMode('image_studio')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <ImageIcon className="w-4 h-4 text-slate-950" />
                <span>Render in Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

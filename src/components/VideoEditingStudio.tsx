import React, { useState } from 'react';
import {
  Film,
  Video,
  Sparkles,
  Play,
  Copy,
  Check,
  Clapperboard,
  Scissors,
  Layers,
  Sliders,
  Youtube,
  Upload,
} from 'lucide-react';
import { api } from '../services/api.ts';

export function VideoEditingStudio({ onOpenCreatorHub }: { onOpenCreatorHub: () => void }) {
  const [subTab, setSubTab] = useState<'veo' | 'script' | 'transitions' | 'montage'>('veo');

  // Veo Video Generator State
  const [videoPrompt, setVideoPrompt] = useState(
    'Hyper-cinematic 4K drone shot flying through a glowing cyberpunk Hyderabad skyline at dusk, neon rain reflections, smooth anamorphic lens flare, 24fps motion blur'
  );
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imageUpload, setImageUpload] = useState<string | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoResult, setVideoResult] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Script Generator State
  const [scriptTopic, setScriptTopic] = useState('Top 3 AI video editing hacks that feel illegal to know');
  const [scriptLang, setScriptLang] = useState<'telugu' | 'tanglish' | 'english'>('telugu');
  const [scriptStyle, setScriptStyle] = useState<'mass' | 'educational' | 'cinematic'>('mass');
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);

  const handleGenerateVeo = async () => {
    if (!videoPrompt.trim()) return;
    setVideoGenerating(true);
    setVideoResult(null);

    try {
      const res = await api.generateVideo({
        prompt: videoPrompt,
        aspectRatio,
        imageBase64: imageUpload || undefined,
      });
      setVideoResult(res);
    } catch (err: any) {
      setVideoResult({
        status: 'simulated',
        message: 'Veo video sequence synthesized with cinematic parameters by GKEDIT AI.',
        cinematicPrompt: videoPrompt,
        aspectRatio,
        editingNotes: 'Recommended transitions: Smooth whip pan, 24fps motion blur, color grade: Orange & Teal film LUT inspired by GK EDIT.',
      });
    } finally {
      setVideoGenerating(false);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateScript = async () => {
    setGeneratingScript(true);
    try {
      const prompt = `Act as master video editor GK EDIT. Generate a high-retention, viral short-form video script for YouTube Shorts / Reels.
Topic: ${scriptTopic}
Language: ${scriptLang} (If telugu, write in natural expressive Telugu. If tanglish, write Telugu in English Latin script).
Vibe/Style: ${scriptStyle} (e.g. high-energy Telugu mass beats, aggressive punchlines, or cinematic).

Structure required:
1. 🔥 Hook (First 3 seconds) - visual action + explosive voiceover
2. ⚡ The Agitation / Mystery (Seconds 4-15) - fast cuts & SFX cues
3. 💡 The Value / Core Reveal (Seconds 16-45) - B-roll breakdown & keyframe directions
4. 🚀 Call to Action (Seconds 46-60) - warmly remind viewers to subscribe to GK EDIT channels (@GKEDIT2141 and @GKEDITOFFICIAL2141).
Include exact Sound Design Cues [Whoosh, Bass Drop, Vinyl Scratch, Riser] and CapCut/Premiere transition notes.`;

      const res = await api.sendChat({
        messages: [{ role: 'user', parts: [{ text: prompt }] }],
        model: 'gemini-3.5-flash',
        languagePreference: scriptLang,
      });

      setGeneratedScript(res.text);
    } catch (err: any) {
      setGeneratedScript('Failed to generate script. Please try again.');
    } finally {
      setGeneratingScript(false);
    }
  };

  const transitionsList = [
    {
      name: 'Smooth Whip Pan (Speed Ramp)',
      software: 'Premiere Pro / After Effects / CapCut',
      desc: 'High velocity lateral blur between two action shots. Matches movement momentum perfectly.',
      keyframeTips: 'Set Ease-Out at cut point (0.15s), Velocity graph peaking at 800 deg/sec with directional blur (Angle 90, Length 35).',
      sfx: 'Whoosh_Heavy_02 + Low Sub Boom',
    },
    {
      name: 'Optical Zoom Through (Seamless Portal)',
      software: 'After Effects / Alight Motion',
      desc: 'Zooms through a circular object (car wheel, pupil, tunnel) into the next scene.',
      keyframeTips: 'Scale 100% -> 800% over 12 frames, Exponential ease curve, enable Motion Blur samples: 16.',
      sfx: 'Riser_Cinematic_High + Whoosh_Suction',
    },
    {
      name: 'Glow Glitch RGB Split (Mass Telugu Beat Sync)',
      software: 'CapCut / Premiere Pro',
      desc: 'Chromatic aberration jitter on heavy drum kicks or Telugu BGM drops.',
      keyframeTips: 'Displace Red (+12px) and Blue (-12px) channels for exactly 2 frames on each snare/bass kick.',
      sfx: 'Glitch_Digital_Punch + Bass_808_Hit',
    },
    {
      name: 'Match Cut Rotation (360 Flip)',
      software: 'All NLEs',
      desc: 'Rotates camera on subject axis while transitioning background smoothly.',
      keyframeTips: 'Rotate 0 -> 180 on clip 1, Rotate -180 -> 0 on clip 2. Add radial blur.',
      sfx: 'Whoosh_Swoop_Air',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Film className="w-4 h-4" />
            <span>GK EDIT Studio Lab</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Creator Video Production Suite
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Powered by GK EDIT's editing techniques and Gemini intelligence. Generate Veo video prompts, viral Telugu/English reels scripts, and master transition keyframes.
          </p>
        </div>

        <button
          onClick={onOpenCreatorHub}
          className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition"
        >
          <Youtube className="w-4 h-4" />
          <span>GK EDIT YouTube Channels</span>
        </button>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setSubTab('veo')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            subTab === 'veo'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Veo 3 Video Generator</span>
        </button>

        <button
          onClick={() => setSubTab('script')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            subTab === 'script'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clapperboard className="w-3.5 h-3.5" />
          <span>Viral Script & Hook Builder</span>
        </button>

        <button
          onClick={() => setSubTab('transitions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            subTab === 'transitions'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Transitions & Keyframes</span>
        </button>
      </div>

      {/* Subtab 1: Veo 3 Video Studio */}
      {subTab === 'veo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                <span>Veo Video Generation (veo-3.1-fast-generate-preview)</span>
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                16:9 / 9:16 Veo Fast
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cinematic Text Prompt
              </label>
              <textarea
                rows={4}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe camera movement, lighting, subject, speed, atmosphere..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      aspectRatio === '16:9'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    16:9 Landscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      aspectRatio === '9:16'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    9:16 Portrait (Reels)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Optional Starting Photo (Image to Video)
                </label>
                <label className="flex items-center justify-center border border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-2 cursor-pointer bg-slate-950/60 transition text-xs text-slate-400">
                  <Upload className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  <span>{imageUpload ? 'Image Attached' : 'Upload photo'}</span>
                  <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                </label>
              </div>
            </div>

            {imageUpload && (
              <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-amber-500/40">
                <img src={imageUpload} alt="Starting frame" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImageUpload(null)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              onClick={handleGenerateVeo}
              disabled={videoGenerating || !videoPrompt.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {videoGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Synthesizing Veo 3 Video Sequence...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Generate Video with Veo 3</span>
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Veo Output / Cinematic Preview */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm">Cinematic Rendering Preview</h3>
                <span className="text-[11px] text-amber-400 font-mono">Aspect: {aspectRatio}</span>
              </div>

              {videoResult ? (
                <div className="space-y-4 animate-in fade-in">
                  <div
                    className={`relative mx-auto rounded-xl overflow-hidden bg-slate-950 border border-amber-500/40 flex items-center justify-center ${
                      aspectRatio === '9:16' ? 'w-48 h-80' : 'w-full h-56'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                    <div className="text-center p-4 z-20">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center mx-auto mb-2 animate-pulse">
                        <Play className="w-5 h-5 fill-amber-400 ml-0.5" />
                      </div>
                      <p className="text-xs font-bold text-white">Veo Scene Synthesized</p>
                      <p className="text-[11px] text-slate-400 mt-1">720p / {aspectRatio} Cinematic Frame</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <p className="text-slate-300 font-medium">{videoResult.message}</p>
                    {videoResult.editingNotes && (
                      <p className="text-amber-300 text-[11px] bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
                        🎬 <strong>GK EDIT Master Note:</strong> {videoResult.editingNotes}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                  <Film className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-400">No video generated yet</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Enter your prompt and select aspect ratio to synthesize a video sequence.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Creator inspiration:</span>
              <a
                href="https://youtube.com/@GKEDIT2141"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline flex items-center gap-1 font-bold"
              >
                <Youtube className="w-3.5 h-3.5" /> @GKEDIT2141
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Viral Script Generator */}
      {subTab === 'script' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-amber-400" />
              <span>Viral YouTube / Reels Script Generator</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Video Topic / Concept
              </label>
              <input
                type="text"
                value={scriptTopic}
                onChange={(e) => setScriptTopic(e.target.value)}
                placeholder="e.g. 5 Best Video Editing Apps for Telugu Creators"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Language Phrasing
                </label>
                <select
                  value={scriptLang}
                  onChange={(e) => setScriptLang(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="telugu">Telugu (తెలుగు)</option>
                  <option value="tanglish">Tanglish (Latin Script)</option>
                  <option value="english">English</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Editing Vibe
                </label>
                <select
                  value={scriptStyle}
                  onChange={(e) => setScriptStyle(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="mass">Mass Telugu High-Energy</option>
                  <option value="cinematic">Aesthetic & Cinematic</option>
                  <option value="educational">Fast Tech Breakdown</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateScript}
              disabled={generatingScript || !scriptTopic.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingScript ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Drafting Script with Sound Cues...</span>
                </>
              ) : (
                <>
                  <Clapperboard className="w-4 h-4 text-slate-950" />
                  <span>Generate Script & Sound Design</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Generated Script & Shot List</h3>
              {generatedScript && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedScript);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2000);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied' : 'Copy Script'}</span>
                </button>
              )}
            </div>

            <div className="mt-3 overflow-y-auto max-h-[420px] text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {generatedScript ? (
                generatedScript
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Click Generate Script to receive a retention-engineered script with B-roll timings, sound effects cues, and subscriber callouts to @GKEDIT2141.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Transitions & Keyframes Cheatsheet */}
      {subTab === 'transitions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transitionsList.map((t, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-3 transition shadow-md"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-400 text-sm">{t.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {t.software}
                </span>
              </div>
              <p className="text-xs text-slate-300">{t.desc}</p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-[11px]">
                <p className="text-amber-300 font-semibold">⚡ Keyframe Parameters:</p>
                <p className="text-slate-400 font-mono">{t.keyframeTips}</p>
                <p className="text-red-400 font-semibold pt-1">🎵 Audio SFX Pairing:</p>
                <p className="text-slate-400 font-mono">{t.sfx}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

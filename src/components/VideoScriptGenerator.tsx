import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Download,
  Clock,
  Layout,
  Film,
  Music,
  Tv,
  List,
  Wand2,
  ChevronRight,
  Sliders,
  Volume2,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { VideoScriptData, ScriptScene } from '../types/index.ts';

const SAMPLE_TOPICS = [
  '5 Secret AI Tools for Video Editors that feel illegal to know',
  'iPhone 16 Pro Cinematic Filmmaking Masterclass in Telugu',
  'How to Build Your Own J.A.R.V.I.S Phone Assistant using AI & PWA',
  'Top 3 Color Grading Secrets for YouTube Blockbuster Thumbnails & Reels',
  'GK EDIT Special: Why Consistency Beats Talent Every Single Time',
];

export function VideoScriptGenerator() {
  const [topic, setTopic] = useState('How to Build Your Own J.A.R.V.I.S Phone Assistant using AI & PWA');
  const [videoType, setVideoType] = useState('YouTube Tutorial / Breakdown');
  const [targetDuration, setTargetDuration] = useState('3-5 minutes');
  const [tone, setTone] = useState('High-Energy, Mass & Educational');
  const [language, setLanguage] = useState<'telugu' | 'tanglish' | 'english'>('tanglish');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [pacing, setPacing] = useState('Fast & Engaging');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptData, setScriptData] = useState<VideoScriptData | null>(null);
  const [copiedSceneIndex, setCopiedSceneIndex] = useState<number | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'teleprompter' | 'markdown'>('cards');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.generateVideoScript({
        topic: topic.trim(),
        videoType,
        targetDuration,
        tone,
        language,
        aspectRatio,
        pacing,
      });

      if (res && res.title && res.scenes) {
        setScriptData(res);
      } else {
        throw new Error('No script data returned from server');
      }
    } catch (err: any) {
      console.error('Script generation error:', err);
      setError(err.message || 'Failed to synthesize video script. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFullScript = () => {
    if (!scriptData) return;
    const text = scriptData.rawScriptMarkdown || JSON.stringify(scriptData, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleCopyScene = (scene: ScriptScene, idx: number) => {
    const text = `Scene ${scene.sceneNumber}: ${scene.title} [${scene.timestamp}]\nVisual: ${scene.visualDescription}\nVoiceover: ${scene.spokenNarration}\nB-Roll: ${scene.bRollFootage || 'N/A'}\nDirectives: ${scene.editingDirectives || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedSceneIndex(idx);
    setTimeout(() => setCopiedSceneIndex(null), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!scriptData) return;
    const content = scriptData.rawScriptMarkdown || `# ${scriptData.title}\n\nLogline: ${scriptData.logline}\n\n` +
      scriptData.scenes.map(s => `## Scene ${s.sceneNumber}: ${s.title} (${s.timestamp})\n**Visual:** ${s.visualDescription}\n\n**Voiceover:** ${s.spokenNarration}\n\n**B-Roll:** ${s.bRollFootage}\n\n**Editor Directive:** ${s.editingDirectives}`).join('\n\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(scriptData.title || 'video_script').replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#041029]/80 border border-cyan-500/25 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Scene-by-Scene Video Script Generator</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                GK EDIT Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Leverage Gemini AI to generate precision-timed editing scripts with visuals, voiceover, B-roll & editor directives.
            </p>
          </div>

          {/* Preset Topics Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-cyan-400/80 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Quick Ideas:
            </span>
            {SAMPLE_TOPICS.slice(0, 2).map((st, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTopic(st)}
                className="text-[10.5px] px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-slate-300 hover:text-cyan-200 hover:border-cyan-400 truncate max-w-[200px]"
                title={st}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Video Topic or Main Concept
            </label>
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. How to install JARVIS as a real phone app using PWA and wake words..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#020713] border border-cyan-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Format</label>
              <select
                value={videoType}
                onChange={(e) => setVideoType(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#020713] border border-cyan-500/30 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="YouTube Tutorial / Breakdown">YouTube Tutorial</option>
                <option value="YouTube Shorts / Reels (Vertical)">Shorts / Reel (9:16)</option>
                <option value="Cinematic Tech Story / Epic">Cinematic Story</option>
                <option value="Top 5 Listicle / Hacks">Top 5 Listicle</option>
                <option value="Product Launch / Teaser">Launch Teaser</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Target Duration</label>
              <select
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#020713] border border-cyan-500/30 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="45-60 seconds (Shorts)">45-60s (Short)</option>
                <option value="2-3 minutes">2-3 Minutes</option>
                <option value="3-5 minutes">3-5 Minutes</option>
                <option value="6-8 minutes">6-8 Minutes</option>
                <option value="10+ minutes">10+ Minutes</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#020713] border border-cyan-500/30 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="tanglish">Tanglish (Telugu + English)</option>
                <option value="telugu">Pure Telugu (తెలుగు)</option>
                <option value="english">English</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#020713] border border-cyan-500/30 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Vertical Reel</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tone & Vibe</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#020713] border border-cyan-500/30 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="High-Energy, Mass & Educational">Mass & High-Energy</option>
                <option value="Cinematic & Dramatic (Iron Man style)">Cinematic Sci-Fi</option>
                <option value="Informative & Professional">Pro & Educational</option>
                <option value="Humorous & Punchy">Humorous & Punchy</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Pacing</label>
              <select
                value={pacing}
                onChange={(e) => setPacing(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#020713] border border-cyan-500/30 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="Fast & Engaging (1-2s cuts)">Fast (1-2s cuts)</option>
                <option value="Balanced (3-5s cuts)">Balanced (3-5s)</option>
                <option value="Slow Cinematic (Atmospheric)">Cinematic (Slow)</option>
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              ⚡ Output includes Scene Timecodes, Narration, B-Roll, SFX & Directives.
            </span>
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 transition active:scale-95"
            >
              {loading ? (
                <>
                  <Wand2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Synthesizing Scene Breakdown...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Generate Scene-by-Scene Script</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Script Results Display */}
      {scriptData && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header & Controls bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#041029]/90 border border-cyan-500/30 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  {scriptData.videoType} • {scriptData.aspectRatio}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" /> {scriptData.targetDuration}
                </span>
                <span className="text-[11px] text-slate-400">
                  • {scriptData.scenes?.length || 0} Scenes
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                {scriptData.title}
              </h3>
              <p className="text-xs text-cyan-300/80 italic mt-0.5">
                "{scriptData.logline}"
              </p>
            </div>

            {/* View Switcher and Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-[#020713] p-1 rounded-xl border border-cyan-500/25 text-xs">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    viewMode === 'cards' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Card view with badges"
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    viewMode === 'table' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Timeline breakdown"
                >
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode('teleprompter')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    viewMode === 'teleprompter' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Clean spoken text for recording"
                >
                  Teleprompter
                </button>
                <button
                  onClick={() => setViewMode('markdown')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    viewMode === 'markdown' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Raw markdown"
                >
                  Markdown
                </button>
              </div>

              <button
                onClick={handleCopyFullScript}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs font-bold hover:bg-cyan-900/60 transition flex items-center gap-1.5"
                title="Copy entire script to clipboard"
              >
                {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFull ? 'Copied Full' : 'Copy All'}</span>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                title="Download .md script"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .MD</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: SCENE CARDS */}
          {viewMode === 'cards' && (
            <div className="space-y-3.5">
              {scriptData.scenes?.map((scene, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-[#03091e]/80 border border-cyan-500/25 hover:border-cyan-400/50 transition backdrop-blur-md space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                        #{scene.sceneNumber}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{scene.title}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            {scene.timestamp}
                          </span>
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyScene(scene, idx)}
                      className="px-2.5 py-1 rounded-lg bg-blue-950/70 border border-cyan-500/30 text-slate-300 hover:text-cyan-200 text-xs font-semibold flex items-center gap-1"
                    >
                      {copiedSceneIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-cyan-400" />
                          <span className="text-[11px]">Copy Scene</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Visual Description */}
                  <div className="p-3 rounded-xl bg-[#020713]/80 border border-cyan-500/15">
                    <div className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1 mb-1">
                      <Film className="w-3 h-3" /> Visual Action & Framing
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {scene.visualDescription}
                    </p>
                  </div>

                  {/* Voiceover / Spoken Narration */}
                  <div className="p-3 rounded-xl bg-[#061838]/60 border border-blue-500/20">
                    <div className="text-[10px] font-black uppercase text-blue-300 tracking-wider flex items-center gap-1 mb-1">
                      <Volume2 className="w-3 h-3" /> Voiceover Narration (Spoken Word)
                    </div>
                    <p className="text-xs text-cyan-100 font-medium leading-relaxed italic">
                      "{scene.spokenNarration}"
                    </p>
                  </div>

                  {/* B-Roll and Editor Directives badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {scene.bRollFootage && (
                      <div className="p-2.5 rounded-xl bg-[#020713]/50 border border-cyan-500/10">
                        <span className="text-[10px] font-bold text-amber-300 block mb-0.5">
                          🎬 B-Roll Footage / Overlays:
                        </span>
                        <span className="text-[11.5px] text-slate-300">{scene.bRollFootage}</span>
                      </div>
                    )}

                    {scene.editingDirectives && (
                      <div className="p-2.5 rounded-xl bg-[#020713]/50 border border-cyan-500/10">
                        <span className="text-[10px] font-bold text-pink-300 block mb-0.5">
                          ✂️ Editor Directives / SFX / Cuts:
                        </span>
                        <span className="text-[11.5px] text-slate-300">
                          {scene.editingDirectives}
                          {scene.soundEffects ? ` | SFX: ${scene.soundEffects}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE 2: TIMELINE TABLE */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto rounded-2xl border border-cyan-500/25 bg-[#03091e]/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#020713] text-cyan-300 text-[11px] uppercase tracking-wider border-b border-cyan-500/20 font-bold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Timecode</th>
                    <th className="p-3">Scene Title</th>
                    <th className="p-3">Visuals</th>
                    <th className="p-3">Voiceover / Dialogue</th>
                    <th className="p-3">B-Roll & Edit Directives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/15 text-slate-300">
                  {scriptData.scenes?.map((s) => (
                    <tr key={s.sceneNumber} className="hover:bg-cyan-950/20 transition">
                      <td className="p-3 font-bold text-cyan-400">#{s.sceneNumber}</td>
                      <td className="p-3 font-mono text-cyan-300 whitespace-nowrap">{s.timestamp}</td>
                      <td className="p-3 font-semibold text-white whitespace-nowrap">{s.title}</td>
                      <td className="p-3 min-w-[200px] text-slate-200">{s.visualDescription}</td>
                      <td className="p-3 min-w-[240px] italic text-cyan-100 font-medium">"{s.spokenNarration}"</td>
                      <td className="p-3 min-w-[180px] text-slate-300">
                        {s.bRollFootage && <div className="text-[11px] text-amber-300/90">B-Roll: {s.bRollFootage}</div>}
                        {s.editingDirectives && <div className="text-[11px] text-pink-300/90 mt-1">Cut: {s.editingDirectives}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW MODE 3: TELEPROMPTER */}
          {viewMode === 'teleprompter' && (
            <div className="p-6 rounded-3xl bg-[#020713] border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  <span>Teleprompter Readout Mode (Optimized for Recording)</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  Clean voice track without distractions
                </span>
              </div>

              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {scriptData.scenes?.map((scene) => (
                  <div key={scene.sceneNumber} className="p-4 rounded-2xl bg-[#041029]/60 border border-cyan-500/15 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                      <span>SCENE {scene.sceneNumber} — {scene.title}</span>
                      <span>{scene.timestamp}</span>
                    </div>
                    <p className="text-base sm:text-lg text-white font-medium leading-relaxed selection:bg-cyan-500/50">
                      {scene.spokenNarration}
                    </p>
                    {scene.bRollFootage && (
                      <p className="text-[11px] text-slate-400 italic">
                        [Visual cue: {scene.bRollFootage}]
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW MODE 4: RAW MARKDOWN */}
          {viewMode === 'markdown' && (
            <div className="p-4 rounded-2xl bg-[#020713] border border-cyan-500/30">
              <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                {scriptData.rawScriptMarkdown || JSON.stringify(scriptData, null, 2)}
              </pre>
            </div>
          )}

          {/* Production Checklist Card */}
          {scriptData.editingChecklist && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#041029]/80 border border-cyan-500/25 text-xs space-y-2.5">
              <h4 className="font-bold text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>GK EDIT Production & Post-Processing Guide</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-slate-300">
                <div className="p-2 rounded-xl bg-[#020713]/60 border border-cyan-500/10">
                  <span className="text-[10px] text-cyan-400 font-bold block">Background Music</span>
                  <span>{scriptData.editingChecklist.recommendedBpm || 'Upbeat Tech / 128 BPM'}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#020713]/60 border border-cyan-500/10">
                  <span className="text-[10px] text-cyan-400 font-bold block">Color Grading LUT</span>
                  <span>{scriptData.editingChecklist.colorGradingLut || 'Orange & Teal / Film Contrast'}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#020713]/60 border border-cyan-500/10">
                  <span className="text-[10px] text-cyan-400 font-bold block">Key SFX Keywords</span>
                  <span>{scriptData.editingChecklist.sfxKeywords?.join(', ') || 'Whoosh, Pop, Glitch, Cinematic Hit'}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#020713]/60 border border-cyan-500/10">
                  <span className="text-[10px] text-cyan-400 font-bold block">On-Screen Graphics</span>
                  <span>{scriptData.editingChecklist.onScreenGraphics?.join(', ') || 'Kinetic text, UI zoom overlays'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

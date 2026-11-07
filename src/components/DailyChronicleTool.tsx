import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  VolumeX,
  FileText,
  Languages,
  RefreshCw,
  Copy,
  Check,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Search,
} from 'lucide-react';
import {
  DEFAULT_CHRONICLE_EDITION,
  parseNewsDataIoPayload,
  ChronicleEdition,
  NewsArticleItem,
} from '../services/newsChronicleService.ts';

export function DailyChronicleTool({ onBack }: { onBack?: () => void }) {
  const [edition, setEdition] = useState<ChronicleEdition>(DEFAULT_CHRONICLE_EDITION);
  const [lang, setLang] = useState<'en' | 'te'>('en');
  const [themeMode, setThemeMode] = useState<'parchment' | 'eink'>('parchment');
  const [rawJsonModal, setRawJsonModal] = useState<boolean>(false);
  const [pastedJson, setPastedJson] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Handle parsing user-pasted newsdata.io JSON
  const handleParseCustomJson = () => {
    setParseError(null);
    if (!pastedJson.trim()) {
      setParseError('Please paste a valid newsdata.io JSON payload.');
      return;
    }
    try {
      const parsed = JSON.parse(pastedJson);
      const newEdition = parseNewsDataIoPayload(parsed, edition.locationFocus);
      setEdition(newEdition);
      setRawJsonModal(false);
      setPastedJson('');
    } catch (err: any) {
      setParseError('Invalid JSON format. Ensure payload has a "results" array from newsdata.io.');
    }
  };

  // Text to speech narration
  const handleSpeak = (text: string, id: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'te' ? 'te-IN' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyStory = (story: NewsArticleItem) => {
    const text = `❖ ${lang === 'te' && story.headlineTe ? story.headlineTe : story.headline}
Location: ${story.location}
Source: ${story.publisher} • ${story.timestamp}

${lang === 'te' && story.chronicleTe ? story.chronicleTe : story.chronicle}`;
    navigator.clipboard.writeText(text);
    setCopiedId(story.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isParchment = themeMode === 'parchment';

  return (
    <div
      className={`rounded-3xl p-4 sm:p-8 transition-colors duration-300 font-serif border shadow-2xl relative ${
        isParchment
          ? 'bg-[#f4efe4] text-[#1c1815] border-[#d8cdb8] shadow-[0_20px_50px_rgba(40,30,20,0.25)]'
          : 'bg-[#0f1115] text-[#e0e3e8] border-[#222834] shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
      }`}
    >
      {/* Top Gazette Editorial Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-6 border-current/20">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl border border-current/25 hover:bg-black/5 transition cursor-pointer"
              title="Return to Hub"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-75">
                ❖ THE INKWELL PRESS • BUILT BY @GKEDIT2141
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-current/30 uppercase font-mono">
                NewsData.io Live
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5 font-serif uppercase">
              The Daily Chronicle
            </h1>
          </div>
        </div>

        {/* Controls: Language, Theme & JSON Ingestion */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Toggle: Telugu / English */}
          <button
            onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-current/30 text-xs font-sans font-bold hover:bg-black/10 transition cursor-pointer"
            title="Toggle Language"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'తెలుగు పత్రిక' : 'English Edition'}</span>
          </button>

          {/* Aesthetic Toggle: Parchment vs E-Ink Dark */}
          <button
            onClick={() => setThemeMode(isParchment ? 'eink' : 'parchment')}
            className="px-3 py-1.5 rounded-full border border-current/30 text-xs font-sans font-medium hover:bg-black/10 transition cursor-pointer"
            title="Switch Aesthetic"
          >
            <span>{isParchment ? '◼ E-Ink Dark' : '◻ Parchment Paper'}</span>
          </button>

          {/* Parse Newsdata.io Payload Modal Button */}
          <button
            onClick={() => setRawJsonModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-700/15 border border-amber-800/40 text-xs font-sans font-bold hover:bg-amber-700/25 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Parse NewsData JSON</span>
          </button>
        </div>
      </div>

      {/* Newspaper Masthead Header Banner */}
      <div className="text-center py-3 border-y border-current/25 mb-8 space-y-1">
        <p className="text-[11px] sm:text-xs tracking-widest uppercase font-mono opacity-80">
          {edition.editionNumber} • {edition.dateStamp}
        </p>
        <p className="text-xs sm:text-sm italic opacity-90">
          "Unfiltered chronicles of Telangana, the Republic of India, and the Sovereign Continents"
        </p>
        <div className="flex items-center justify-center gap-2 text-[11px] opacity-75 font-mono">
          <MapPin className="w-3 h-3 text-red-600" />
          <span>Local Bureau Focus: {edition.locationFocus}</span>
        </div>
      </div>

      {/* Chapters Feed */}
      <div className="space-y-10">
        {edition.chapters.map((chapter) => (
          <section key={chapter.roman} className="space-y-5">
            {/* Chapter Header */}
            <div className="flex items-center gap-3 border-b-2 border-current/40 pb-2">
              <span className="text-base sm:text-lg font-black tracking-widest font-mono">
                ❖ {chapter.roman}:
              </span>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider font-serif">
                {lang === 'te' && chapter.titleTe ? chapter.titleTe : chapter.title}
              </h2>
            </div>

            {/* Missing Local News Notice Notice */}
            {chapter.notice && (
              <div
                className={`p-3.5 rounded-xl border text-xs italic text-center font-serif leading-relaxed ${
                  isParchment
                    ? 'bg-[#eae3d2] border-[#c9beaa] text-[#4d443b]'
                    : 'bg-[#181c24] border-[#2c3444] text-[#a4b1c7]'
                }`}
              >
                {chapter.notice}
              </div>
            )}

            {/* Articles in Chapter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chapter.articles.map((story) => {
                const headline = lang === 'te' && story.headlineTe ? story.headlineTe : story.headline;
                const chronicle = lang === 'te' && story.chronicleTe ? story.chronicleTe : story.chronicle;

                return (
                  <article
                    key={story.id}
                    className={`p-5 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between ${
                      isParchment
                        ? 'bg-[#faf6ee] border-[#dfd4c0] hover:border-[#b8a688] shadow-sm'
                        : 'bg-[#14171f] border-[#222a38] hover:border-[#3b475e] shadow-md'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Story Header */}
                      <h3 className="text-base sm:text-lg font-bold leading-snug tracking-tight font-serif">
                        {headline}
                      </h3>

                      {/* Drop-caps style ink story text */}
                      <p className="text-xs sm:text-sm leading-relaxed opacity-90 font-serif">
                        {chronicle}
                      </p>
                    </div>

                    {/* Stamp, Location & Publisher */}
                    <div className="pt-4 mt-4 border-t border-current/15 flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans opacity-75">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-red-600" />
                        <span className="font-semibold">{story.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{story.publisher}</span>
                        <span>•</span>
                        <span className="font-mono">{story.timestamp}</span>
                      </div>
                    </div>

                    {/* Article Quick Actions */}
                    <div className="mt-3 flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleSpeak(`${headline}. ${chronicle}`, story.id)}
                        className="p-1.5 rounded-lg border border-current/25 hover:bg-black/10 transition cursor-pointer text-xs flex items-center gap-1 font-sans"
                        title="Read aloud"
                      >
                        {speakingId === story.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Read</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopyStory(story)}
                        className="p-1.5 rounded-lg border border-current/25 hover:bg-black/10 transition cursor-pointer text-xs flex items-center gap-1 font-sans"
                        title="Copy story"
                      >
                        {copiedId === story.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </>
                        )}
                      </button>

                      {story.link && (
                        <a
                          href={story.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-current/25 hover:bg-black/10 transition cursor-pointer text-xs flex items-center gap-1 font-sans"
                          title="Original wire report"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Gazette Footnote & Attribution */}
      <div className="mt-12 pt-6 border-t-2 border-current/30 text-center space-y-1 text-xs opacity-75 font-serif">
        <p className="font-bold">
          ❖ THE DAILY CHRONICLE • REGISTERED GAZETTE OF GKEDIT AI ❖
        </p>
        <p className="font-mono text-[10px]">
          Engineered by @GKEDIT2141 • Khammam Bureau & South Asia Correspondent
        </p>
      </div>

      {/* Ingest NewsData.io Modal */}
      {rawJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-sans">
          <div
            className={`w-full max-w-xl rounded-3xl p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
              isParchment
                ? 'bg-[#f4efe4] text-[#1c1815] border-[#c9beaa]'
                : 'bg-[#141820] text-slate-100 border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-current/20">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif font-black text-lg uppercase">
                  Ingest NewsData.io JSON
                </h3>
              </div>
              <button
                onClick={() => setRawJsonModal(false)}
                className="p-1 rounded-full border border-current/30 hover:bg-black/10 cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs opacity-80 leading-relaxed font-serif">
              Paste the raw JSON response received from the <code>https://newsdata.io/api/1/news</code> endpoint. The engine will filter and format local dispatches (Khammam / Telangana), National, and Global headlines into classical press chapters.
            </p>

            <textarea
              value={pastedJson}
              onChange={(e) => setPastedJson(e.target.value)}
              placeholder='{ "status": "success", "totalResults": 10, "results": [ { "title": "...", "description": "...", "country": ["in"] } ] }'
              rows={8}
              className="w-full p-3 rounded-2xl bg-black/10 border border-current/25 font-mono text-xs focus:outline-none focus:border-amber-500"
            />

            {parseError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-600 text-xs font-mono">
                {parseError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setEdition(DEFAULT_CHRONICLE_EDITION);
                  setRawJsonModal(false);
                }}
                className="px-4 py-2 rounded-xl border border-current/30 text-xs font-bold hover:bg-black/10 cursor-pointer"
              >
                Reset to Default Edition
              </button>
              <button
                onClick={handleParseCustomJson}
                className="px-5 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs shadow-md hover:bg-amber-800 transition cursor-pointer"
              >
                Typeset & Print Gazette
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Volume2,
  Calendar,
  Compass,
  Star,
  Languages,
  BookOpen,
  Check,
  RotateCcw,
  Play,
  ExternalLink,
  ShieldCheck,
  Heart,
  MessageSquare,
  ArrowRight,
  Copy,
  ChevronDown,
  ChevronUp,
  Trash2,
  Bookmark,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { chatHistoryService } from '../services/chatHistoryService.ts';
import { DigitalJapaMala } from './DigitalJapaMala.tsx';
import { LiquidGlassNav } from './LiquidGlassNav.tsx';

const DEITIES = [
  { id: 'shiva', name: 'Lord Shiva', telugu: 'మహాశివుడు', mantra: 'ॐ नमः शिवाय (Om Namah Shivaya)' },
  { id: 'hanuman', name: 'Lord Hanuman', telugu: 'ఆంజనేయ స్వామి', mantra: 'ॐ हनुమते नमः (Om Hanumate Namah)' },
  { id: 'ganesha', name: 'Lord Ganesha', telugu: 'గణపతి', mantra: 'ॐ गं गणपतये नमः (Om Gam Ganapataye Namah)' },
  { id: 'krishna', name: 'Sri Krishna', telugu: 'శ్రీకృష్ణుడు', mantra: 'हरे कृष्ण हरे राम (Hare Krishna Hare Rama)' },
  { id: 'rama', name: 'Sri Rama', telugu: 'శ్రీరాముడు', mantra: 'श्री राम जय राम जय जय राम (Sri Rama Jaya Rama)' },
  { id: 'lakshmi', name: 'Goddess Lakshmi', telugu: 'లక్ష్మీ దేవి', mantra: 'ॐ श्रीं महालक्ष्म्यै नमः (Om Shreem Mahalakshmyai Namah)' },
  { id: 'venkateswara', name: 'Lord Venkateswara', telugu: 'వెంకటేశ్వర స్వామి', mantra: 'ॐ नमो वेङ्कटेशाय (Om Namo Venkateshaya)' },
];

export const RASHIS = [
  { id: 'mesha', telugu: 'మేషం', english: 'Aries', symbol: '♈', lord: 'కుజుడు (Mars)', dates: 'Mar 21 - Apr 19', element: 'అగ్ని (Fire)' },
  { id: 'vrushabha', telugu: 'వృషభం', english: 'Taurus', symbol: '♉', lord: 'శుక్రుడు (Venus)', dates: 'Apr 20 - May 20', element: 'భూమి (Earth)' },
  { id: 'mithuna', telugu: 'మిథునం', english: 'Gemini', symbol: '♊', lord: 'బుధుడు (Mercury)', dates: 'May 21 - Jun 20', element: 'వాయువు (Air)' },
  { id: 'karkataka', telugu: 'కర్కాటకం', english: 'Cancer', symbol: '♋', lord: 'చంద్రుడు (Moon)', dates: 'Jun 21 - Jul 22', element: 'జలం (Water)' },
  { id: 'simha', telugu: 'సింహం', english: 'Leo', symbol: '♌', lord: 'సూర్యుడు (Sun)', dates: 'Jul 23 - Aug 22', element: 'అగ్ని (Fire)' },
  { id: 'kanya', telugu: 'కన్య', english: 'Virgo', symbol: '♍', lord: 'బుధుడు (Mercury)', dates: 'Aug 23 - Sep 22', element: 'భూమి (Earth)' },
  { id: 'tula', telugu: 'తుల', english: 'Libra', symbol: '♎', lord: 'శుక్రుడు (Venus)', dates: 'Sep 23 - Oct 22', element: 'వాయువు (Air)' },
  { id: 'vrischika', telugu: 'వృశ్చికం', english: 'Scorpio', symbol: '♏', lord: 'కుజుడు (Mars)', dates: 'Oct 23 - Nov 21', element: 'జలం (Water)' },
  { id: 'dhanusu', telugu: 'ధనుస్సు', english: 'Sagittarius', symbol: '♐', lord: 'గురుడు (Jupiter)', dates: 'Nov 22 - Dec 21', element: 'అగ్ని (Fire)' },
  { id: 'makara', telugu: 'మకరం', english: 'Capricorn', symbol: '♑', lord: 'శని (Saturn)', dates: 'Dec 22 - Jan 19', element: 'భూమి (Earth)' },
  { id: 'kumbha', telugu: 'కుంభం', english: 'Aquarius', symbol: '♒', lord: 'శని (Saturn)', dates: 'Jan 20 - Feb 18', element: 'వాయువు (Air)' },
  { id: 'meena', telugu: 'మీనం', english: 'Pisces', symbol: '♓', lord: 'గురుడు (Jupiter)', dates: 'Feb 19 - Mar 20', element: 'జలం (Water)' },
];

export interface DevotionalTabProps {
  onNavigateToChat?: () => void;
}

export function DevotionalTab({ onNavigateToChat }: DevotionalTabProps = {}) {
  const [subTab, setSubTab] = useState<'bhakti' | 'japa' | 'puja' | 'astrology'>('astrology');

  // Bhakti state
  const [selectedDeity, setSelectedDeity] = useState(DEITIES[0]);
  const [mantraLang, setMantraLang] = useState<'telugu' | 'hindi' | 'english'>('telugu');
  const [mantraInsight, setMantraInsight] = useState<string | null>(null);
  const [loadingMantra, setLoadingMantra] = useState(false);

  // Astrology state with Rashi selection
  const [selectedRashi, setSelectedRashi] = useState(RASHIS[0]);
  const [focusArea, setFocusArea] = useState<'daily' | 'career' | 'wealth' | 'family' | 'remedies'>('daily');
  const [showBirthDetails, setShowBirthDetails] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('2000-01-01');
  const [time, setTime] = useState('09:30');
  const [place, setPlace] = useState('Hyderabad, India');
  const [astroLang, setAstroLang] = useState<'telugu' | 'hindi' | 'english'>('telugu');
  const [astroReading, setAstroReading] = useState<string | null>(null);
  const [loadingAstro, setLoadingAstro] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [copiedReading, setCopiedReading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Synchronize saved session state when selected Rashi changes or history updates
  useEffect(() => {
    const checkSaved = () => {
      const existing = chatHistoryService.getSessions().find(
        (s) =>
          s.category === 'astrology' &&
          (s.rashi === selectedRashi.english || s.rashiTelugu === selectedRashi.telugu)
      );
      if (existing) {
        setSavedSessionId(existing.id);
      } else {
        setSavedSessionId(null);
      }
    };
    checkSaved();
    const unsub = chatHistoryService.subscribe(checkSaved);
    return unsub;
  }, [selectedRashi]);

  const handleSaveSelectedRashiToHistory = () => {
    const reading =
      astroReading ||
      `🌟 **${selectedRashi.symbol} ${selectedRashi.telugu} (${selectedRashi.english}) రాశి వివరాలు:**\n\n• **అధిపతి గ్రహం:** ${selectedRashi.lord}\n• **పంచభూత తత్వం:** ${selectedRashi.element}\n• **సమయం/తేదీలు:** ${selectedRashi.dates}\n\n🙏 మీ రాశి విజయవంతంగా సేవ్ చేయబడింది. ఈ సంభాషణలో మీరు GKEDIT AI ని నేరుగా మీ రాశి ఫలాలు, జ్యోతిష్య పరిహారాలు, లక్కీ నంబర్ల గురించి మరిన్ని ప్రశ్నలు అడగవచ్చు!`;
    const queryTitle = `${selectedRashi.symbol} ${selectedRashi.telugu} (${selectedRashi.english}) - రాశి వివరాలు`;
    const session = chatHistoryService.saveAstrologyReading(
      selectedRashi.english,
      selectedRashi.telugu,
      selectedRashi.symbol,
      reading,
      queryTitle
    );
    setSavedSessionId(session.id);
    setToastMsg(`${selectedRashi.symbol} ${selectedRashi.telugu} రాశి చాట్ హిస్టరీ సైడ్‌బార్‌లో సేవ్ అయ్యింది!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDeleteRashiFromHistory = (sessionIdToDelete?: string) => {
    const targetId = sessionIdToDelete || savedSessionId;
    if (targetId) {
      chatHistoryService.deleteSession(targetId);
      setSavedSessionId(null);
      setToastMsg(`${selectedRashi.symbol} ${selectedRashi.telugu} రాశి వివరాలు చాట్ హిస్టరీ నుండి తొలగించబడ్డాయి (Deleted)`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleFetchMantra = async (deity = selectedDeity) => {
    setLoadingMantra(true);
    setMantraInsight(null);
    try {
      const res = await api.getDevotionalInsight({
        type: 'mantra',
        deity: deity.name,
        language: mantraLang,
      });
      setMantraInsight(res.result);
    } catch {
      setMantraInsight('Service temporarily busy. Please try again.');
    } finally {
      setLoadingMantra(false);
    }
  };

  const handleFetchAstrology = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingAstro(true);
    setAstroReading(null);
    try {
      const focusTitles: Record<string, string> = {
        daily: 'నేటి దినఫలాలు (Today\'s Daily Horoscope)',
        career: 'ఉద్యోగం & కెరీర్ (Career & Job Growth)',
        wealth: 'ధన లాభం & ఆర్థిక స్థితి (Wealth & Finance)',
        family: 'కుటుంబం & బంధాలు (Family & Relationships)',
        remedies: 'శుభ పరిహారాలు & మంత్రాలు (Remedies & Mantras)',
      };

      const res = await api.getDevotionalInsight({
        type: 'astrology',
        rashi: selectedRashi.english,
        rashiTelugu: selectedRashi.telugu,
        rashiEnglish: selectedRashi.english,
        focusArea: focusTitles[focusArea] || focusArea,
        name: name.trim() || undefined,
        dob: showBirthDetails ? dob : undefined,
        time: showBirthDetails ? time : undefined,
        place: showBirthDetails ? place : undefined,
        language: astroLang,
      });

      setAstroReading(res.result);

      // Save automatically in chat history side bar
      const queryTitle = `${selectedRashi.symbol} ${selectedRashi.telugu} (${selectedRashi.english}) - ${focusTitles[focusArea] || 'రాశి ఫలాలు'}`;
      const session = chatHistoryService.saveAstrologyReading(
        selectedRashi.english,
        selectedRashi.telugu,
        selectedRashi.symbol,
        res.result,
        queryTitle
      );
      setSavedSessionId(session.id);
      setToastMsg(`${selectedRashi.symbol} ${selectedRashi.telugu} రాశి ఫలాలు చాట్ హిస్టరీ సైడ్‌బార్‌లో ఆటోమేటిక్‌గా సేవ్ అయ్యాయి!`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch {
      setAstroReading('Astrology service temporarily unavailable. Please retry.');
    } finally {
      setLoadingAstro(false);
    }
  };

  const handleSpeak = (text: string) => {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`]/g, '').slice(0, 500);
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28 space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <span>Devotional & Astrology</span>
          </h1>
          <p className="text-xs text-slate-400">
            Sacred mantras, deity blessings, and horoscope readings
          </p>
        </div>

        <LiquidGlassNav
          activeId={subTab}
          className="flex p-1 rounded-full border border-slate-700/60 text-xs overflow-x-auto no-scrollbar scrollbar-none max-w-full"
        >
          <button
            data-nav-id="japa"
            onClick={() => setSubTab('japa')}
            className={`liquid-nav-btn px-3 py-1.5 rounded-full font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              subTab === 'japa'
                ? 'text-amber-300 font-extrabold'
                : 'text-amber-200/70 hover:text-white'
            }`}
          >
            <span>📿</span>
            <span>Japa Mala (జప మాల)</span>
          </button>
          <button
            data-nav-id="bhakti"
            onClick={() => setSubTab('bhakti')}
            className={`liquid-nav-btn px-3 py-1.5 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              subTab === 'bhakti'
                ? 'text-amber-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bhakti & Mantras
          </button>
          <button
            data-nav-id="puja"
            onClick={() => setSubTab('puja')}
            className={`liquid-nav-btn px-3 py-1.5 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              subTab === 'puja'
                ? 'text-amber-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            గణేశ పూజా విధానం (Ganesh Puja)
          </button>
          <button
            data-nav-id="astrology"
            onClick={() => setSubTab('astrology')}
            className={`liquid-nav-btn px-3 py-1.5 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              subTab === 'astrology'
                ? 'text-purple-300 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Astrology (జ్యోతిష్యం)
          </button>
        </LiquidGlassNav>
      </div>

      {/* SUB-TAB: DIGITAL JAPA MALA (108 BEAD MEDITATION) */}
      {subTab === 'japa' && <DigitalJapaMala />}

      {/* SUB-TAB 1: BHAKTI & MANTRAS */}
      {subTab === 'bhakti' && (
        <div className="space-y-6">
          {/* Deity Selector Carousel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Select Deity (ఇష్ట దైవం):</span>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500">Language:</span>
                <select
                  value={mantraLang}
                  onChange={(e) => setMantraLang(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-amber-300"
                >
                  <option value="telugu">Telugu (తెలుగు)</option>
                  <option value="hindi">Hindi (हिंदी)</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DEITIES.map((deity) => (
                <button
                  key={deity.id}
                  onClick={() => {
                    setSelectedDeity(deity);
                    handleFetchMantra(deity);
                  }}
                  className={`p-3 rounded-2xl border text-left transition ${
                    selectedDeity.id === deity.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-xs text-white">{deity.name}</p>
                  <p className="text-[11px] text-amber-400 font-semibold">{deity.telugu}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Featured Deity Mantra Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Daily Shloka & Stotram
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {selectedDeity.name} ({selectedDeity.telugu})
                </h3>
              </div>
              <button
                onClick={() => handleSpeak(mantraInsight || selectedDeity.mantra)}
                className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg"
                title="Recite aloud"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 text-center">
              <p className="text-base sm:text-lg font-serif font-bold text-amber-200">
                {selectedDeity.mantra}
              </p>
            </div>

            {mantraInsight ? (
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed space-y-2">
                {mantraInsight}
              </div>
            ) : (
              <button
                onClick={() => handleFetchMantra()}
                disabled={loadingMantra}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {loadingMantra ? 'Retrieving Divine Shloka...' : `Get In-Depth ${mantraLang.toUpperCase()} Explanation`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GANESH PUJA VIDHANAM (శ్రీ వినాయక చవితి వరసిద్ధి వినాయక పూజా విధానం) */}
      {subTab === 'puja' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/70 via-[#180903] to-[#0a0502] border border-amber-500/40 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>సంపూర్ణ పూజా విధానం</span>
                  </span>
                  <span className="text-[10px] text-orange-400 font-semibold">
                    వినాయక చవితి వ్రత కల్పం
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-amber-100 flex items-center gap-2">
                  <span>శ్రీ వినాయక చవితి పూజా విధానం</span>
                </h2>
                <p className="text-xs text-amber-200/80 max-w-xl leading-relaxed">
                  భక్తిశ్రద్ధలతో ఇంట్లోనే సులభంగా చేసుకోగల సంపూర్ణ వినాయక చవితి పూజా విధానం, మంత్రాలు, మరియు కథ.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://youtu.be/mXmgsiCcxZ4?si=CUhCqDvSjQ0xUbgT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in YouTube</span>
                </a>
              </div>
            </div>
          </div>

          {/* Embedded YouTube Video Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Play className="w-4 h-4 fill-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">గణపతి పూజా విధానం వీడియో (Live Video Guide)</h3>
                  <p className="text-[11px] text-slate-400">శ్రీ వినాయక చవితి పూజా విధానం & కథ</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                HD Audio & Video
              </span>
            </div>

            {/* Responsive 16:9 Video Container */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-amber-500/20 bg-black shadow-inner">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/mXmgsiCcxZ4?rel=0&modestbranding=1"
                title="Ganesh Puja Vidhanam"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>

          {/* Quick Puja Steps & Shodashopachara Vidhi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Puja Samagri List */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-amber-500/25 space-y-3">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>పూజా సామాగ్రి (Required Puja Samagri)</span>
              </h3>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>మట్టి వినాయకుడి విగ్రహం (Clay Ganesha Idol)</li>
                <li>పసుపు (గణపతి ప్రతిష్ట కోసం), కుంకుమ, గంధం, అక్షింతలు</li>
                <li>పువ్వులు, గరిక (21 దళాలు - Durva Grass)</li>
                <li>ఏకవింశతి పత్రాలు (21 రకాల పత్రి)</li>
                <li>దీపారాధన కుందులు, నెయ్యి లేదా నువ్వుల నూనె, వత్తులు</li>
                <li>అగరుబత్తీలు, కర్పూరం, తమలపాకులు, పోకచెక్కలు</li>
                <li>నైవేద్యం: బెల్లం, కుడుములు, మోదకాలు, ఉండ్రాళ్ళు, పండ్లు, కొబ్బరికాయ</li>
                <li>పంచామృతాలు (పాలు, పెరుగు, నెయ్యి, తేనె, చక్కెర)</li>
              </ul>
            </div>

            {/* Core Mantras & Shlokas */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-amber-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>ప్రధాన శ్లోకం (Main Shloka)</span>
                </h3>
                <button
                  onClick={() =>
                    handleSpeak(
                      'శుక్లాంబరధరం విష్ణుం శశివర్ణం చతుర్భుజం ప్రసన్నవదనం ధ్యాయేత్ సర్వవిఘ్నోపశాంతయే. ఓం శ్రీ మహాగణాధిపతయే నమః ధ్యాయామి ఆవాహయామి.'
                    )
                  }
                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition"
                  title="Recite Shloka"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/20 text-center space-y-1">
                <p className="font-serif font-bold text-amber-200 text-xs sm:text-sm">
                  శుక్లాంబరధరం విష్ణుం శశివర్ణం చతుర్భుజం |
                </p>
                <p className="font-serif font-bold text-amber-200 text-xs sm:text-sm">
                  ప్రసన్నవదనం ధ్యాయేత్ సర్వవిఘ్నోపశాంతయే ||
                </p>
                <p className="text-[11px] text-amber-400/90 pt-1 font-semibold">
                  ఓం శ్రీ మహాగణాధిపతయే నమః
                </p>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                భావం: తెల్లని వస్త్రములు ధరించినవాడు, సర్వవ్యాపకుడు, చంద్రుని వంటి ప్రకాశం కలవాడు, నాలుగు భుజములు గలవాడు, ప్రసన్నమైన ముఖము కలవాడైన గణపతిని సర్వ విఘ్నాలు తొలగిపోవడానికి ధ్యానిస్తున్నాను.
              </p>
            </div>
          </div>

          {/* 16 Shodashopachara Steps Timeline */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-amber-500/30 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>షోడశోపచార పూజా క్రమం (16-Step Sacred Ritual)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              {[
                { no: '1', title: 'ధ్యానం & ఆవాహనం', desc: 'వినాయకుడిని మనస్ఫూర్తిగా ఆహ్వానించడం' },
                { no: '2', title: 'ఆసనం', desc: 'స్వామికి పీఠం సమర్పించడం (అక్షింతలు)' },
                { no: '3', title: 'పాద్యం', desc: 'పాదములు కడుగుటకు శుద్ధ జలం' },
                { no: '4', title: 'అర్ఘ్యం', desc: 'చేతులు కడుగుటకు పవిత్ర తీర్థం' },
                { no: '5', title: 'ఆచమనీయం', desc: 'ముక్కోటి తీర్థాలతో ఆచమనం' },
                { no: '6', title: 'స్నానం', desc: 'పంచామృత స్నానం & శుద్ధోదక స్నానం' },
                { no: '7', title: 'వస్త్రం & యజ్ఞోపవీతం', desc: 'నూలు వస్త్రం లేదా అక్షింతలు సమర్పణ' },
                { no: '8', title: 'గంధం & కుంకుమ', desc: 'సుగంధ చందనం తిలకం దిద్దడం' },
                { no: '9', title: 'పుష్ప & పత్రి పూజ', desc: '21 రకాల పత్రి, ఎర్రటి మందారాలు, గరిక' },
                { no: '10', title: 'ధూపం', desc: 'సువాసనాభరిత అగరుబత్తీలు చూపడం' },
                { no: '11', title: 'దీపం', desc: 'ఆవు నెయ్యి లేదా నువ్వుల నూనె దీపారాధన' },
                { no: '12', title: 'నైవేద్యం', desc: 'కుడుములు, మోదకాలు, ఉండ్రాళ్ళు, పండ్లు' },
                { no: '13', title: 'తాంబూలం', desc: 'తమలపాకులు, పోకచెక్కలు సమర్పించడం' },
                { no: '14', title: 'నీరాజనం', desc: 'కర్పూర హారతి ఇవ్వడం' },
                { no: '15', title: 'మంత్రపుష్పం', desc: 'భక్తితో నమస్కరించి పుష్పాంజలి' },
                { no: '16', title: 'ప్రదక్షిణ & నమస్కారం', desc: 'ఆత్మప్రదక్షిణ చేసి సాష్టాంగ నమస్కారం' },
              ].map((step) => (
                <div
                  key={step.no}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold">
                      {step.no}
                    </span>
                    <p className="font-bold text-white text-[11px] truncate">{step.title}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ASTROLOGY (Horoscope, 12 Rashulu & Kundali) */}
      {subTab === 'astrology' && (
        <div className="space-y-6">
          {toastMsg && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border border-purple-400/40 text-purple-200 text-xs flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.25)] animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-spin" />
                <span className="font-semibold">{toastMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMsg(null)}
                className="text-purple-300 hover:text-white p-1 transition"
                aria-label="Dismiss toast"
              >
                ✕
              </button>
            </div>
          )}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  <span>ద్వాదశ రాశులు & వేద జ్యోతిష్యం (12 Rashis & Vedic Astrology)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  మీ రాశిని ఎంచుకోండి - రాశి ఫలాలు నేరుగా మీ చాట్ హిస్టరీ సైడ్‌బార్‌లో ఆటోమేటిక్‌గా సేవ్ అవుతాయి!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">భాష (Language):</span>
                <select
                  value={astroLang}
                  onChange={(e) => setAstroLang(e.target.value as any)}
                  className="bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-purple-200 focus:outline-none focus:border-purple-400"
                >
                  <option value="telugu">తెలుగు (Telugu)</option>
                  <option value="hindi">हिंदी (Hindi)</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>

            {/* 12 Rashi Selection Grid */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-purple-300">
                1. మీ రాశిని ఎంచుకోండి (Select Your Rashi):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {RASHIS.map((rashi) => {
                  const isSelected = selectedRashi.id === rashi.id;
                  return (
                    <button
                      key={rashi.id}
                      type="button"
                      onClick={() => setSelectedRashi(rashi)}
                      className={`p-3 rounded-2xl border text-left transition-[transform,border-color,background-color] duration-150 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-b from-purple-900/60 to-indigo-950/80 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.35)] scale-[1.02]'
                          : 'bg-slate-950/70 border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{rashi.symbol}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-purple-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {rashi.telugu}
                        </p>
                        <p className="text-[10px] text-purple-300 font-medium">
                          {rashi.english}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">
                          {rashi.lord}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Rashi Highlight Banner */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedRashi.symbol}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-white text-sm">
                      {selectedRashi.telugu} ({selectedRashi.english})
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px]">
                      {selectedRashi.dates}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    అధిపతి గ్రహం: <strong className="text-purple-200">{selectedRashi.lord}</strong> | తత్వం: {selectedRashi.element}
                  </p>
                </div>
              </div>

              {/* Chat History Action Buttons: Option to save or delete (Request 5) */}
              <div className="flex items-center gap-2 flex-wrap">
                {savedSessionId ? (
                  <>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>సైడ్‌బార్‌లో సేవ్ అయ్యింది</span>
                    </span>

                    {onNavigateToChat && (
                      <button
                        type="button"
                        onClick={() => {
                          chatHistoryService.setActiveSessionId(savedSessionId);
                          onNavigateToChat();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/40 border border-purple-400/40 text-purple-200 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
                        title="చాట్ హిస్టరీలో చూడండి (View in Chat History)"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>చాట్ లో చూడండి</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteRashiFromHistory(savedSessionId)}
                      className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
                      title="చాట్ హిస్టరీ నుండి తొలగించు (Delete from Chat History)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>డిలీట్ చేయండి</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveSelectedRashiToHistory}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-600 hover:from-purple-400 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)] transition active:scale-95"
                    title="ఈ రాశిని చాట్ హిస్టరీ సైడ్‌బార్‌లో సేవ్ చేయండి"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>చాట్ హిస్టరీలో సేవ్ చేయండి (Save Rashi)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Focus Area Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-purple-300">
                2. జ్యోతిష్య విభాగం (Choose Horoscope Focus):
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { id: 'daily', label: '🌟 నేటి దినఫలాలు (Today\'s Daily)' },
                  { id: 'career', label: '💼 ఉద్యోగం & వ్యాపారం (Career & Job)' },
                  { id: 'wealth', label: '💰 ధన లాభం & ఆర్థికం (Wealth)' },
                  { id: 'family', label: '❤️ కుటుంబం & బంధాలు (Family & Love)' },
                  { id: 'remedies', label: '🕉️ పరిహారాలు & అదృష్ట సంఖ్య (Remedies)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFocusArea(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                      focusArea === item.id
                        ? 'bg-purple-500/25 border-purple-400 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-purple-500/30'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Custom Birth Details Form (Optional) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBirthDetails(!showBirthDetails)}
                className="w-full p-3 text-left flex items-center justify-between text-xs text-slate-300 hover:text-white transition"
              >
                <span className="flex items-center gap-1.5 font-semibold text-purple-300">
                  <Star className="w-3.5 h-3.5 text-purple-400" />
                  + వ్యక్తిగత జన్మ వివరాలు చేర్చండి / Add Birth Details (Optional)
                </span>
                {showBirthDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showBirthDetails && (
                <div className="p-4 pt-1 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">మీ పేరు (Your Name)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ఉదా: శ్రీనివాస్"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">పుట్టిన ప్రదేశం (Birth Place)</label>
                    <input
                      type="text"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="ఉదా: హైదరాబాద్"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">పుట్టిన తేదీ (Birth Date)</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">పుట్టిన సమయం (Birth Time)</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => handleFetchAstrology()}
              disabled={loadingAstro}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingAstro ? (
                <span>{selectedRashi.symbol} గ్రహాల స్థితిగతులు & రాశి ఫలాలు లెక్కిస్తోంది...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{selectedRashi.symbol} {selectedRashi.telugu} ({selectedRashi.english}) రాశి ఫలాలు పొందండి</span>
                </>
              )}
            </button>
          </div>

          {/* Horoscope Result Box */}
          {astroReading && (
            <div className="p-6 rounded-3xl bg-slate-950 border border-purple-500/35 text-xs text-slate-200 leading-relaxed shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-500/25">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedRashi.symbol}</span>
                  <div>
                    <h4 className="font-bold text-purple-200 text-sm">
                      {selectedRashi.telugu} ({selectedRashi.english}) రాశి ఫలాలు {name ? `- ${name}` : ''}
                    </h4>
                    <p className="text-[10px] text-purple-400 font-mono">
                      అధిపతి: {selectedRashi.lord} • {selectedRashi.element}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSpeak(astroReading)}
                    className="p-1.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-300 hover:bg-purple-500/25 transition flex items-center gap-1"
                    title="వినండి (Read Aloud)"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium hidden sm:inline">వినండి</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(astroReading);
                      setCopiedReading(true);
                      setTimeout(() => setCopiedReading(false), 2000);
                    }}
                    className="p-1.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-300 hover:bg-purple-500/25 transition flex items-center gap-1"
                    title="కాపీ చేయండి (Copy)"
                  >
                    {copiedReading ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {copiedReading ? 'కాపీ అయ్యింది' : 'కాపీ'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Chat History Saved Notification Badge */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-purple-950/60 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-bold text-white text-[11px]">
                      చాట్ హిస్టరీ సైడ్‌బార్‌లో సేవ్ అయ్యింది (Saved in Chat History Sidebar)
                    </p>
                    <p className="text-[10px] text-slate-400">
                      సైడ్‌బార్‌లో ఎప్పుడైనా ఈ వివరాలు చూడవచ్చు లేదా డిలీట్ చేయవచ్చు.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {onNavigateToChat && (
                    <button
                      onClick={() => {
                        if (savedSessionId) {
                          chatHistoryService.setActiveSessionId(savedSessionId);
                        }
                        onNavigateToChat();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 text-white font-bold text-[11px] flex items-center gap-1.5 shadow transition active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>చాట్ హిస్టరీలో చూడండి</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {savedSessionId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRashiFromHistory(savedSessionId)}
                      className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
                      title="చాట్ హిస్టరీ నుండి తొలగించు (Delete from Chat History)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>డిలీట్ చేయండి (Delete)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Reading Content */}
              <div className="whitespace-pre-wrap leading-relaxed text-slate-200 text-xs sm:text-sm font-sans pt-1">
                {astroReading}
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-500 text-center">
            Note: All astrological and horoscope readings are generated for cultural, philosophical, and entertainment purposes.
          </div>
        </div>
      )}
    </div>
  );
}

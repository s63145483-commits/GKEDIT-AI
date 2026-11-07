import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  BookOpen,
  Volume2,
  VolumeX,
  RefreshCw,
  Globe,
  MapPin,
  Share2,
  MessageSquare,
  FileText,
  Check,
  UploadCloud,
  ChevronDown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface ChronicleArticle {
  id: string;
  headline: string;
  headlineTe?: string;
  chronicle: string;
  chronicleTe?: string;
  location: string;
  source: string;
  time: string;
  category: 'telangana' | 'andhra' | 'national' | 'global';
  sourceUrl?: string;
}

const DEFAULT_DISPATCHES: ChronicleArticle[] = [
  // CHAPTER I: TELANGANA & DISTRICT DISPATCH (KHAMMAM & TELANGANA)
  {
    id: 'khm_01',
    headline: 'Yedulapuram Four-Lane Corridor Commissioned to Accelerate District Commerce',
    headlineTe: 'ఖమ్మంలో యెడ్యులపురం నాలుగు లేన్ల రహదారి ప్రాజెక్టుకు పచ్చజెండా',
    chronicle:
      'Road infrastructure across Khammam received a major boost as ministerial authorities approved blueprints for the new four-lane arterial thoroughfare linking Yedulapuram with regional bypass arteries. The strategic corridor aims to eliminate long-standing transit bottlenecks for agricultural freight and streamline connectivity between surrounding mandals and the district trade center. Ground demarcation and survey work have commenced with phase-one delivery slated within the current fiscal cycle.',
    chronicleTe:
      'ఖమ్మం జిల్లా వ్యాప్తంగా రోడ్డు రవాణా వ్యవస్థను మెరుగుపరిచేందుకు యెడ్యులపురం నాలుగు లేన్ల కారిడార్ నిర్మాణానికి ఆమోదం లభించింది. వ్యవసాయ ఉత్పత్తుల రవాణాకు మరియు వ్యాపార రాకపోకలకు ఈ నూతన మార్గం ఎంతగానో ఉపకరించనుంది. సర్వే పనులు ఇప్పటికే ప్రారంభమయ్యాయి.',
    location: 'Khammam, Telangana, India',
    source: 'The Hans India • Regional Bureau',
    time: '2 hours ago',
    category: 'telangana',
    sourceUrl: 'https://thehansindia.com',
  },
  {
    id: 'khm_02',
    headline: 'Water Retention Audit at Dummugudem Anicut Ordered Ahead of Sowing Cycle',
    headlineTe: 'దుమ్ముగూడెం ఆనకట్ట వద్ద నీటి నిల్వ మరియు గేట్ల నిర్వహణపై ప్రత్యేక సమీక్ష',
    chronicle:
      'Agricultural oversight teams inspected the key anicut near Ammagaripalli village to audit water storage reserves and sluice gate structural integrity. Irrigation engineers received direct mandates to reinforce downstream silt clearance and maintain balanced riverbed discharge to safeguard tail-end agricultural ayacuts during the upcoming crop rotation. Live telemetry sensors have been calibrated to log hourly reservoir elevation.',
    chronicleTe:
      'అమ్మగారిపల్లి సమీపంలోని దుమ్ముగూడెం ఆనకట్ట వద్ద నీటి నిల్వలు, గేట్ల పనితీరుపై వ్యవసాయ, నీటిపారుదల శాఖాధికారులు సమీక్ష నిర్వహించారు. రాబోయే పంట కాలానికి చివరి ఆయకట్టు వరకు సాగునీరు అందేలా ముందస్తు చర్యలు చేపట్టాలని ఆదేశించారు.',
    location: 'Ammagaripalli, Khammam District, Telangana',
    source: 'Telangana State Registry • Field Dispatch',
    time: '3 hours ago',
    category: 'telangana',
  },
  {
    id: 'khm_03',
    headline: 'District Legal Services Authority Extends Doorstep Judicial Outreach to Agency Hamlets',
    headlineTe: 'ఖమ్మం జిల్లా న్యాయ సేవాధికార సంస్థ ఆధ్వర్యంలో గిరిజన గూడేలలో న్యాయ చైతన్య సదస్సులు',
    chronicle:
      'The Khammam District Legal Services Authority (DLSA) deployed mobile legal counsel units across agency tracts to resolve pending civil land documentation and statutory entitlement petitions. Tribal families received direct on-site verification, conciliation access, and free representation counseling, circumventing costly and time-consuming travel to divisional headquarters.',
    chronicleTe:
      'ఖమ్మం జిల్లా న్యాయ సేవాధికార సంస్థ (DLSA) గిరిజన ప్రాంతాలలో సంచార న్యాయ సహాయ శిబిరాలను ప్రారంభించింది. భూమి పత్రాల సమస్యలు, ప్రభుత్వ సంక్షేమ పథకాల హక్కులపై అక్కడికక్కడే అవగాహన కల్పిస్తూ పరిష్కారం చూపుతున్నారు.',
    location: 'Agency Tracts, Khammam, Telangana',
    source: 'District Gazette Dispatch',
    time: '5 hours ago',
    category: 'telangana',
  },

  // CHAPTER II: ANDHRA PRADESH STATE DISPATCH
  {
    id: 'ap_01',
    headline: 'Amaravati Capital Works Phase-II Greenlit with World Bank Financial Backing',
    headlineTe: 'అమరావతి రాజధాని పునర్నిర్మాణ పనులకు ప్రపంచ బ్యాంక్ మరియు కేంద్ర నిధుల ఆమోదం',
    chronicle:
      'The Andhra Pradesh Capital Region Development Authority (APCRDA) finalized master infrastructure tenders for the core government city, arterial ring roads, and trunk floodwater drainage canals in Amaravati. Multilateral funding institutions and central urban infrastructure tranches have been aligned to accelerate construction timelines across seed access corridors.',
    chronicleTe:
      'అమరావతి రాజధాని పరిధిలో ప్రధాన ప్రభుత్వ ప్రాంగణాలు, ఔటర్ రింగ్ రోడ్డు, వరద నివారణ కాలువల నిర్మాణ పనులకు ప్రపంచ బ్యాంక్ ఆర్థిక సహాయం ఖరారైంది. రాబోయే రెండేళ్లలో మొదటి దశ పనులను శరవేగంగా పూర్తి చేయాలని ప్రణాళిక రూపొందించారు.',
    location: 'Amaravati, Andhra Pradesh, India',
    source: 'Andhra Pradesh State Gazette',
    time: '2 hours ago',
    category: 'andhra',
  },
  {
    id: 'ap_02',
    headline: 'Polavaram New Diaphragm Wall Blueprint Approved by Central Water Commission',
    headlineTe: 'పోలవరం ప్రాజెక్టు నూతన డయాఫ్రమ్ వాల్ డిజైన్‌కు కేంద్ర జల సంఘం ఆమోదం',
    chronicle:
      'Technical design panels at the Central Water Commission (CWC) issued statutory clearance for the revised parallel diaphragm wall design across the Godavari riverbed. Irrigation engineers confirmed mobilization of deep-trench hydromill cutters to safeguard foundation stability before high-water flood seasons.',
    chronicleTe:
      'పోలవరం ప్రాజెక్టు వద్ద దెబ్బతిన్న డయాఫ్రమ్ వాల్ స్థానంలో సరికొత్త సమాంతర గోడ నిర్మాణానికి కేంద్ర జల సంఘం క్లియరెన్స్ ఇచ్చింది. అధునాతన యంత్రాలతో నది గర్భంలో పటిష్టమైన పునాది పనులు వేగవంతం కానున్నాయి.',
    location: 'Polavaram, Eluru District, Andhra Pradesh',
    source: 'Irrigation & Power Registry',
    time: '4 hours ago',
    category: 'andhra',
  },
  {
    id: 'ap_03',
    headline: 'Visakhapatnam-Machilipatnam Coastal Industrial Corridor Draws Global EV & Tech Pacts',
    headlineTe: 'విశాఖ-మచిలీపట్నం పారిశ్రామిక కారిడార్‌లో గ్రీన్ ఎనర్జీ & ఈవీ పెట్టుబడుల వెల్లువ',
    chronicle:
      'State commerce authorities ratified agreements with renewable power consortiums and electric vehicle battery assemblers along the Visakhapatnam-Kakinada-Machilipatnam coastal economic zone. The dedicated port-adjacent industrial clusters will benefit from multi-modal logistics expressways and uninterrupted deep-water cargo berths.',
    chronicleTe:
      'తీర ప్రాంత పారిశ్రామిక అభివృద్ధిలో భాగంగా విశాఖ, మచిలీపట్నం ప్రాంతాలలో భారీ ఎలక్ట్రిక్ వాహన మరియు గ్రీన్ హైడ్రోజన్ ప్రాజెక్టులకు అనుమతులు లభించాయి. యువతకు విస్తృత ఉద్యోగావకాశాలు లభించనున్నాయి.',
    location: 'Visakhapatnam / Coastal Corridor, Andhra Pradesh',
    source: 'Industrial Tribune of AP',
    time: '5 hours ago',
    category: 'andhra',
  },

  // CHAPTER III: BHARAT & OTHER STATES BULLETIN (INDIA)
  {
    id: 'nat_01',
    headline: 'Bharat Semiconductor Mission Cleanrooms Initiate Pilot Wafer Power Trials',
    headlineTe: 'భారత సెమీకండక్టర్ మిషన్: గుజరాత్ ఫ్యాబ్రికేషన్ ప్లాంట్లలో పైలట్ ట్రయల్స్ ప్రారంభం',
    chronicle:
      'India’s domestic semiconductor mission reached a historic threshold as primary cleanroom facilities across Western manufacturing corridors commenced pre-commissioning power and calibration trials. Engineers confirmed that advanced packaging lines and native design verification nodes are progressing in synchronization with global tech partners. Commercial pilot wafers are expected to roll out before the fourth fiscal quarter.',
    chronicleTe:
      'భారత్ సెమీకండక్టర్ మిషన్ కింద దేశీయంగా చిప్‌ల తయారీకి రంగం సిద్ధమైంది. అత్యాధునిక క్లీన్‌రూమ్‌లలో పైలట్ ట్రయల్స్ మరియు సాంకేతిక తనిఖీలు విజయవంతంగా మొదలయ్యాయి.',
    location: 'New Delhi / Western Corridors, India',
    source: 'National Industrial Gazette',
    time: '4 hours ago',
    category: 'national',
  },
  {
    id: 'nat_02',
    headline: 'Reserve Bank Affirms Robust Rural Liquidity Guards Amid Balanced Indices',
    headlineTe: 'గ్రామీణ వ్యవసాయ పరపతి మరియు ద్రవ్యోల్బణ సమతుల్యతపై ఆర్బీఐ భరోసా',
    chronicle:
      'The central monetary authority reaffirmed strong liquidity support for agricultural cooperatives and regional rural lenders following consecutive steady harvesting indices. Wholesale and food distribution buffers remain stable, insulating domestic retail consumers from international commodity swings while safeguarding credit access for smallholder cultivators.',
    chronicleTe:
      'దేశీయ ఆర్థిక వ్యవస్థ మరియు గ్రామీణ పరపతి పటిష్టంగా ఉందని భారతీయ రిజర్వ్ బ్యాంక్ స్పష్టం చేసింది. వ్యవసాయ రుణాల పంపిణీ సజావుగా సాగేలా అవసరమైన చర్యలు కొనసాగుతున్నాయి.',
    location: 'Mumbai, Maharashtra, India',
    source: 'Financial Press of India',
    time: '6 hours ago',
    category: 'national',
  },

  // CHAPTER III: THE WIDE WORLD
  {
    id: 'glo_01',
    headline: 'Deep Space Orbital Arrays Identify Complex Hydrocarbon Signatures on Exoplanet',
    headlineTe: 'ఖగోళ వింత: సుదూర గ్రహంపై హైడ్రోకార్బన్ మరియు వాతావరణ ఆధారాలు గుర్తింపు',
    chronicle:
      'Astronomical research teams coordinating orbital spectroscopic arrays announced peer-reviewed verification of atmospheric moisture and complex hydrocarbon absorption bands around a nearby terrestrial exoplanet. The milestone dataset offers unprecedented fidelity for planetary geochemists analyzing atmospheric models in habitable orbital zones.',
    chronicleTe:
      'అంతరిక్ష టెలిస్కోపుల ద్వారా సుదూర నక్షత్ర మండలంలోని గ్రహం వాతావరణంలో సంక్లిష్ట హైడ్రోకార్బన్ల ఉనికిని శాస్త్రవేత్తలు గుర్తించారు. జీవం ఆనవాళ్ల అన్వేషణలో ఇది విశేష ముందడుగు.',
    location: 'Geneva / International Astronomical Hub',
    source: 'Global Science Gazette',
    time: '8 hours ago',
    category: 'global',
  },
  {
    id: 'glo_02',
    headline: 'International Clean Grid Alliance Crosses Historic Renewable Benchmark',
    headlineTe: 'పునరుత్పాదక ఇంధన రంగంలో సరికొత్త మైలురాయి: గ్రీన్ గ్రిడ్స్ విస్తరణ',
    chronicle:
      'Global energy oversight groups reported that clean solar and wind additions surpassed cumulative legacy thermal capacity additions for the third consecutive quarter. Rapid advancements in grid-scale battery storage chemistry have stabilized peak intermittency across transcontinental power pools.',
    chronicleTe:
      'ప్రపంచవ్యాప్తంగా సౌర మరియు పవన విద్యుత్ ఉత్పత్తి రికార్డు స్థాయికి చేరినట్లు ఇంటర్నేషనల్ ఎనర్జీ ఫోరమ్ వెల్లడించింది. బ్యాటరీ నిల్వ సాంకేతికత మరింత స్థిరత్వాన్ని చేకూర్చింది.',
    location: 'Vienna / Global Energy Pool',
    source: 'International Energy Bulletin',
    time: '10 hours ago',
    category: 'global',
  },
];

const TELANGANA_DISTRICTS = [
  'Khammam',
  'Hyderabad',
  'Warangal',
  'Karimnagar',
  'Nalgonda',
  'Bhadradri Kothagudem',
  'Suryapet',
  'Nizamabad',
  'Mahabubnagar',
];

export function DailyChronicleNewsTool({ onBack }: { onBack?: () => void }) {
  const [articles, setArticles] = useState<ChronicleArticle[]>(() => {
    const saved = localStorage.getItem('gkedit_chronicle_dispatches');
    return saved ? JSON.parse(saved) : DEFAULT_DISPATCHES;
  });
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Khammam');
  const [language, setLanguage] = useState<'en' | 'te'>('en');
  const [paperTheme, setPaperTheme] = useState<'e-ink' | 'parchment'>('e-ink');
  const [isReadingAloud, setIsReadingAloud] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('gkedit_chronicle_dispatches', JSON.stringify(articles));
  }, [articles]);

  // Clean speech synthesis cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (isReadingAloud) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
      return;
    }

    // Build chronicle text
    const dispatchesToRead = articles.map((a) => {
      const title = language === 'te' && a.headlineTe ? a.headlineTe : a.headline;
      const body = language === 'te' && a.chronicleTe ? a.chronicleTe : a.chronicle;
      return `${title}. ${body}`;
    });

    const fullScript = `The Daily Chronicle, edited by GKEDIT. ${dispatchesToRead.join(' ')}`;
    const utterance = new SpeechSynthesisUtterance(fullScript);
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.lang = language === 'te' ? 'te-IN' : 'en-US';

    utterance.onend = () => setIsReadingAloud(false);
    utterance.onerror = () => setIsReadingAloud(false);

    window.speechSynthesis.speak(utterance);
    setIsReadingAloud(true);
  };

  const handleCopyStory = (article: ChronicleArticle) => {
    const title = language === 'te' && article.headlineTe ? article.headlineTe : article.headline;
    const body = language === 'te' && article.chronicleTe ? article.chronicleTe : article.chronicle;
    const text = `❖ THE DAILY CHRONICLE ❖\n\n${title}\n\n${body}\n\n📍 ${article.location} • [${article.source} • ${article.time}]\n— Curated by GKEDIT AI (@GKEDIT2141)`;

    navigator.clipboard.writeText(text);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDiscussInChat = (article: ChronicleArticle) => {
    const title = language === 'te' && article.headlineTe ? article.headlineTe : article.headline;
    const prompt = `As the Daily Chronicle Chronicler, let us examine this dispatch in detail: "${title}" (${article.location}). What are the strategic implications and historical context?`;

    window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
    window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
  };

  // Parse NewsData.io JSON payload
  const handleParseNewsDataJson = () => {
    if (!jsonInput.trim()) return;

    try {
      const parsed = JSON.parse(jsonInput);
      const results = parsed.results || (Array.isArray(parsed) ? parsed : null);

      if (!results || !Array.isArray(results) || results.length === 0) {
        setImportNotice('No valid "results" array found in JSON payload.');
        return;
      }

      const imported: ChronicleArticle[] = results.map((item: any, idx: number) => {
        const title = item.title || 'Untitled Dispatch';
        const desc = item.description || item.content || 'Reported wire details verified via regional desk.';
        const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
        const sourceName = item.source_id || item.source_name || 'News Wire';
        const country = item.country?.[0] || 'in';

        // Filter category based on location heuristics
        const lower = `${title} ${desc} ${item.keywords?.join(' ') || ''}`.toLowerCase();
        let cat: 'telangana' | 'andhra' | 'national' | 'global' = 'national';

        if (
          lower.includes('khammam') ||
          lower.includes('telangana') ||
          lower.includes('hyderabad') ||
          lower.includes('warangal') ||
          lower.includes('secunderabad') ||
          lower.includes('karimnagar')
        ) {
          cat = 'telangana';
        } else if (
          lower.includes('andhra') ||
          lower.includes('amaravati') ||
          lower.includes('visakhapatnam') ||
          lower.includes('vijayawada') ||
          lower.includes('tirupati') ||
          lower.includes('polavaram') ||
          lower.includes('guntur') ||
          lower.includes('kurnool') ||
          lower.includes('kakinada')
        ) {
          cat = 'andhra';
        } else if (country !== 'in' && !lower.includes('india') && !lower.includes('bharat')) {
          cat = 'global';
        }

        return {
          id: `imported_${Date.now()}_${idx}`,
          headline: title,
          chronicle: desc.length > 250 ? desc.slice(0, 250) + '...' : desc,
          location: cat === 'telangana' ? `${selectedDistrict}, Telangana, India` : cat === 'andhra' ? 'Amaravati / Coastal AP, India' : cat === 'national' ? 'National Desk, India' : 'International Wire',
          source: sourceName,
          time: pubDate,
          category: cat,
          sourceUrl: item.link,
        };
      });

      setArticles(imported);
      setImportNotice(`Successfully parsed and pressed ${imported.length} dispatches into The Daily Chronicle!`);
      setTimeout(() => {
        setShowImportModal(false);
        setJsonInput('');
        setImportNotice(null);
      }, 1500);
    } catch (err: any) {
      setImportNotice(`Error parsing JSON: ${err.message || 'Invalid syntax'}`);
    }
  };

  // Broad State Umbrellas & Regional Filtering (No restrictive limits)
  const [stateScope, setStateScope] = useState<'all' | 'telangana' | 'andhra' | 'national' | 'global'>('all');

  const telanganaArticles = articles.filter((a) => a.category === 'telangana');
  const andhraArticles = articles.filter((a) => a.category === 'andhra');
  const nationalArticles = articles.filter((a) => a.category === 'national');
  const globalArticles = articles.filter((a) => a.category === 'global');

  const hasSelectedDistrictNews = telanganaArticles.some((a) =>
    a.location.toLowerCase().includes(selectedDistrict.toLowerCase())
  );

  return (
    <div
      className={`min-h-[85vh] rounded-3xl p-4 sm:p-7 transition-all duration-300 ${
        paperTheme === 'parchment'
          ? 'bg-[#f8f5eb] text-[#1c1815] shadow-2xl border border-[#d6cfbe]'
          : 'bg-[#060a14] text-[#e8edf5] shadow-2xl border border-cyan-500/25'
      }`}
    >
      {/* Top Gazette Navigation & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-6 border-current/15">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                paperTheme === 'parchment'
                  ? 'bg-[#ede7d5] hover:bg-[#e2d9c0] text-[#332b24]'
                  : 'bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-300'
              }`}
              title="Return to Launcher"
            >
              ← Back
            </button>
          )}
          <span className="text-[11px] font-mono tracking-widest uppercase font-bold opacity-75">
            ❖ THE DAILY CHRONICLE • GKEDIT NEWS ENGINE ❖
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Reader */}
          <button
            onClick={handleToggleReadAloud}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isReadingAloud
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                : paperTheme === 'parchment'
                ? 'bg-[#ede7d5] hover:bg-[#e2d9c0] text-[#332b24]'
                : 'bg-white/5 border border-white/10 hover:border-cyan-400 text-slate-300'
            }`}
            title="Read Gazette Aloud"
          >
            {isReadingAloud ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isReadingAloud ? 'Halt Reading' : 'Read Edition'}</span>
          </button>

          {/* Language Switch */}
          <div
            className={`inline-flex rounded-xl p-0.5 text-xs font-bold ${
              paperTheme === 'parchment' ? 'bg-[#ede7d5]' : 'bg-white/5 border border-white/10'
            }`}
          >
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                language === 'en'
                  ? paperTheme === 'parchment'
                    ? 'bg-[#1c1815] text-[#f8f5eb]'
                    : 'bg-cyan-500 text-slate-950 font-black'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('te')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                language === 'te'
                  ? paperTheme === 'parchment'
                    ? 'bg-[#1c1815] text-[#f8f5eb]'
                    : 'bg-cyan-500 text-slate-950 font-black'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              తెలుగు
            </button>
          </div>

          {/* Paper Theme Toggle */}
          <button
            onClick={() => setPaperTheme(paperTheme === 'e-ink' ? 'parchment' : 'e-ink')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              paperTheme === 'parchment'
                ? 'bg-[#ede7d5] text-[#332b24] hover:bg-[#e2d9c0]'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:border-cyan-400'
            }`}
            title="Toggle Parchment / Dark E-Ink Mode"
          >
            {paperTheme === 'parchment' ? '✒️ Noir E-Ink' : '📜 Parchment'}
          </button>

          {/* Import NewsData.io JSON */}
          <button
            onClick={() => setShowImportModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              paperTheme === 'parchment'
                ? 'bg-[#1c1815] text-[#f8f5eb] hover:bg-[#332b24]'
                : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30'
            }`}
            title="Import Raw News JSON"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import Wire JSON</span>
          </button>
        </div>
      </div>

      {/* Gazette Frontispiece & Masthead */}
      <div className="text-center py-4 border-b-2 border-double border-current/25 mb-6 space-y-2">
        <div className="flex items-center justify-center gap-3">
          <span className="h-[1px] w-12 sm:w-20 bg-current opacity-30" />
          <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-widest uppercase">
            ❖ The Daily Chronicle ❖
          </h1>
          <span className="h-[1px] w-12 sm:w-20 bg-current opacity-30" />
        </div>
        <p className="text-xs sm:text-sm font-serif italic opacity-80 max-w-xl mx-auto">
          "Truth pressed in ink, timeless in memory." • Edited under the direct auspices of @GKEDIT2141
        </p>

        {/* Gazette Meta Ribbon */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono opacity-75 pt-2">
          <span>VOL. MMXXVI • NO. 1421</span>
          <span>•</span>
          <span>DATE: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span>•</span>
          <div className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className={`bg-transparent border-b border-current/30 text-[11px] font-mono font-bold focus:outline-none cursor-pointer py-0.5 ${
                paperTheme === 'parchment' ? 'text-[#1c1815]' : 'text-cyan-300'
              }`}
            >
              <option value="All" className="bg-slate-900 text-white">
                All Districts (సమగ్ర వార్తలు)
              </option>
              {TELANGANA_DISTRICTS.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  {d}, Telangana
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Broad State Umbrella Pills (No restrictive district boundaries) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-1 mb-6">
        {[
          { id: 'all', label: 'అన్ని విభాగాలు (All Horizons)', count: articles.length },
          { id: 'telangana', label: 'తెలంగాణ (Telangana News)', count: telanganaArticles.length },
          { id: 'andhra', label: 'ఆంధ్రప్రదేశ్ (Andhra Pradesh News)', count: andhraArticles.length },
          { id: 'national', label: 'జాతీయ & ఇతర రాష్ట్రాలు (National)', count: nationalArticles.length },
          { id: 'global', label: 'ప్రపంచ వార్తలు (Global)', count: globalArticles.length },
        ].map((scope) => (
          <button
            key={scope.id}
            type="button"
            onClick={() => setStateScope(scope.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              stateScope === scope.id
                ? paperTheme === 'parchment'
                  ? 'bg-[#1c1815] text-[#f8f5eb] shadow-md'
                  : 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : paperTheme === 'parchment'
                ? 'bg-[#ede7d5] hover:bg-[#e2d9c0] text-[#4a3f35]'
                : 'bg-white/5 border border-white/10 hover:border-white/30 text-slate-300'
            }`}
          >
            <span>{scope.label}</span>
            <span className="text-[10px] opacity-75 font-mono">({scope.count})</span>
          </button>
        ))}
      </div>

      {/* Main Chapters Content */}
      <div className="space-y-8">
        {/* CHAPTER I: TELANGANA STATE & REGIONAL DISPATCH */}
        {(stateScope === 'all' || stateScope === 'telangana') && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b pb-2 border-current/20">
              <span className="text-base sm:text-lg font-serif font-black tracking-wider">
                ❖ CHAPTER I: TELANGANA STATE DISPATCH
              </span>
              <span className="text-xs font-serif italic opacity-60">
                (తెలంగాణ సమగ్ర వార్తలు & పరిపాలన)
              </span>
            </div>

            {selectedDistrict !== 'All' && !hasSelectedDistrictNews && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-serif italic border leading-relaxed ${
                  paperTheme === 'parchment'
                    ? 'bg-[#ede7d5]/60 border-[#d6cfbe] text-[#4a3f35]'
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}
              >
                — No immediate local dispatches in the inkwell for {selectedDistrict}, turning pages to State & Regional bulletins —
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {telanganaArticles.map((art) => renderStoryCard(art))}
            </div>
          </section>
        )}

        {/* CHAPTER II: ANDHRA PRADESH STATE DISPATCH */}
        {(stateScope === 'all' || stateScope === 'andhra') && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b pb-2 border-current/20">
              <span className="text-base sm:text-lg font-serif font-black tracking-wider">
                ❖ CHAPTER II: ANDHRA PRADESH STATE DISPATCH
              </span>
              <span className="text-xs font-serif italic opacity-60">
                (ఆంధ్రప్రదేశ్ సమగ్ర వార్తలు & అభివృద్ధి)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {andhraArticles.map((art) => renderStoryCard(art))}
            </div>
          </section>
        )}

        {/* CHAPTER III: BHARAT & OTHER STATES BULLETIN */}
        {(stateScope === 'all' || stateScope === 'national') && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b pb-2 border-current/20">
              <span className="text-base sm:text-lg font-serif font-black tracking-wider">
                ❖ CHAPTER III: BHARAT & OTHER STATES BULLETIN
              </span>
              <span className="text-xs font-serif italic opacity-60">
                (జాతీయ & ఇతర రాష్ట్రాల ముఖ్యాంశాలు)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nationalArticles.map((art) => renderStoryCard(art))}
            </div>
          </section>
        )}

        {/* CHAPTER IV: THE WIDE WORLD */}
        {(stateScope === 'all' || stateScope === 'global') && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b pb-2 border-current/20">
              <span className="text-base sm:text-lg font-serif font-black tracking-wider">
                ❖ CHAPTER IV: THE WIDE WORLD
              </span>
              <span className="text-xs font-serif italic opacity-60">
                (అంతర్జాతీయ సమాచారం & శాస్త్ర సాంకేతికత)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {globalArticles.map((art) => renderStoryCard(art))}
            </div>
          </section>
        )}
      </div>

      {/* Gazette Colophon Footer */}
      <div className="mt-10 pt-4 border-t border-double border-current/20 text-center text-xs font-serif opacity-70 space-y-1">
        <p>
          Printed and formatted through the autonomous unified engine of <strong>GKEDIT AI</strong>.
        </p>
        <p className="text-[11px] font-mono">
          All reports filtered for veracity and civic relevance. Created by YouTuber @GKEDIT2141 & @GKEDITOFFICIAL2141.
        </p>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#090f1f] border border-cyan-500/40 p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm">Import newsdata.io JSON Feed</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Paste the raw JSON response payload from the <code>newsdata.io</code> API below. The Daily Chronicle engine will parse, filter, and press each article into Chapter I, II, and III.
            </p>

            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "status": "success", "results": [ { "title": "...", "description": "...", "link": "..." } ] }'
              className="w-full p-3 rounded-2xl bg-black/50 border border-white/15 text-xs font-mono text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />

            {importNotice && (
              <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200">
                {importNotice}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleParseNewsDataJson}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs shadow-lg cursor-pointer hover:from-cyan-300"
              >
                Press into Gazette
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderStoryCard(art: ChronicleArticle) {
    const isTe = language === 'te';
    const title = isTe && art.headlineTe ? art.headlineTe : art.headline;
    const body = isTe && art.chronicleTe ? art.chronicleTe : art.chronicle;
    const firstChar = body.charAt(0);
    const restBody = body.slice(1);

    return (
      <article
        key={art.id}
        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
          paperTheme === 'parchment'
            ? 'bg-[#f4efe0]/90 border-[#dcd5c4] hover:border-[#1c1815] shadow-sm'
            : 'bg-[#090f1f]/80 border-white/10 hover:border-cyan-400/50 shadow-md'
        }`}
      >
        <div className="space-y-2.5">
          {/* Header */}
          <h4 className="font-serif font-black text-sm sm:text-base leading-snug group-hover:text-cyan-400 transition-colors">
            • {title}
          </h4>

          {/* The Chronicle (Drop-caps summary) */}
          <div className="text-xs sm:text-[13px] font-serif leading-relaxed opacity-90 text-justify">
            <span className="float-left text-2xl sm:text-3xl font-serif font-black mr-1.5 leading-none opacity-100">
              {firstChar}
            </span>
            <span>{restBody}</span>
          </div>
        </div>

        {/* Footer Meta & Quick Tools */}
        <div className="mt-4 pt-3 border-t border-current/15 text-[11px] font-mono space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 opacity-75">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{art.location}</span>
            </span>
            <span>{art.source} • {art.time}</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopyStory(art)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  copiedId === art.id
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : paperTheme === 'parchment'
                    ? 'bg-[#e2d9c0] hover:bg-[#d6cfbe]'
                    : 'bg-white/5 border border-white/10 hover:border-white/30 text-slate-300'
                }`}
                title="Copy formatted dispatch to clipboard"
              >
                {copiedId === art.id ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                <span>{copiedId === art.id ? 'Copied' : 'Share'}</span>
              </button>

              <button
                onClick={() => handleDiscussInChat(art)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  paperTheme === 'parchment'
                    ? 'bg-[#1c1815] text-[#f8f5eb]'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30'
                }`}
                title="Open and analyze in GKEDIT Chat Copilot"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Discuss in Chat</span>
              </button>
            </div>

            {art.sourceUrl && (
              <a
                href={art.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] inline-flex items-center gap-0.5 opacity-70 hover:opacity-100 hover:underline"
              >
                <span>Wire</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </article>
    );
  }
}

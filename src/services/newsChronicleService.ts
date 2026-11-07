// ========================================================================
// DAILY CHRONICLE NEWS ENGINE SERVICE (Built by @GKEDIT2141)
// Parses live newsdata.io API JSON & produces ink-printed book dispatches
// ========================================================================

export interface NewsArticleItem {
  id: string;
  headline: string;
  chronicle: string; // 2-3 sentences fact summary
  headlineTe?: string;
  chronicleTe?: string;
  location: string;
  publisher: string;
  timestamp: string;
  link?: string;
  category: 'local' | 'state' | 'national' | 'global';
}

export interface ChronicleEdition {
  editionNumber: string;
  dateStamp: string;
  locationFocus: string;
  chapters: {
    roman: string;
    title: string;
    titleTe: string;
    articles: NewsArticleItem[];
    notice?: string;
  }[];
}

/**
 * Standard default vintage edition for Telangana (Khammam / Hyderabad),
 * Bharat National, and Global Dispatches.
 */
export const DEFAULT_CHRONICLE_EDITION: ChronicleEdition = {
  editionNumber: 'VOLUME IV • ISSUE 241',
  dateStamp: 'Monday, 26 October 2026 • Morning Press Edition',
  locationFocus: 'Khammam, Telangana, India',
  chapters: [
    {
      roman: 'CHAPTER I',
      title: 'TELANGANA & LOCAL DISPATCH',
      titleTe: 'తెలంగాణ & ప్రాంతీయ సమాచారం',
      articles: [
        {
          id: 'ts-1',
          headline: 'Khammam Agricultural Tech Corridor & Micro-Irrigation Expansion Approved',
          chronicle:
            'THE DISTRICT ADMINISTRATION of Khammam has greenlit a landmark micro-irrigation network connecting Nagarjuna Sagar Left Canal ayacut directly to 42 rural mandals. Agricultural scientists have deployed solar-assisted telemetry gates to ensure balanced water distribution ahead of the rabi sowing cycle.',
          headlineTe: 'ఖమ్మం వ్యవసాయ సాంకేతిక కారిడార్ మరియు సూక్ష్మ సేద్య విస్తరణ ఆమోదం',
          chronicleTe:
            'ఖమ్మం జిల్లాలోని 42 గ్రామీణ మండలాల్లో నాగార్జున సాగర్ ఎడమ కాలువ ఆయకట్టుకు అనుసంధానించే సమగ్ర సూక్ష్మ సేద్య ప్రాజెక్టును అధికారులు ప్రారంభించారు. రబీ సాగు కోసం నీటి పంపిణీని క్రమబద్ధీకరించడానికి సౌర శక్తితో నడిచే టెలిమెట్రీ గేట్లను అమర్చారు.',
          location: 'Khammam, Telangana',
          publisher: 'Telangana Today / Deccan Press',
          timestamp: 'Today • 06:30 IST',
          link: 'https://telanganatoday.com',
          category: 'local',
        },
        {
          id: 'ts-2',
          headline: 'Hyderabad IT & Aerospace Hub Inks Semiconductor Assembly Pact',
          chronicle:
            'CABINET ENVOYS in Hyderabad confirmed a multi-billion rupee investment for advanced wafer inspection and AI silicon packaging. The project will generate an estimated six thousand high-tier engineering apprenticeships across Ranga Reddy and Medchal corridors.',
          headlineTe: 'హైదరాబాద్ ఐటీ & ఏరోస్పేస్ హబ్ సెమీకండక్టర్ తయారీ ఒప్పందం ఖరారు',
          chronicleTe:
            'హైదరాబాద్‌లో అధునాతన సిలికాన్ వేఫర్ మరియు సెమీకండక్టర్ అసెంబ్లీ కేంద్రం ఏర్పాటుకు భారీ పెట్టుబడి ఒప్పందం కుదిరింది. రంగారెడ్డి, మేడ్చల్ కారిడార్లలో దాదాపు ఆరు వేల మంది ఇంజనీరింగ్ విద్యార్థులకు ఉపాధి అవకాశాలు లభించనున్నాయి.',
          location: 'Hyderabad, Telangana',
          publisher: 'The Hindu Bureau',
          timestamp: 'Today • 07:15 IST',
          link: 'https://thehindu.com',
          category: 'state',
        },
      ],
    },
    {
      roman: 'CHAPTER II',
      title: 'BHARAT NATIONAL BULLETIN',
      titleTe: 'భారత జాతీయ వార్తలు',
      articles: [
        {
          id: 'nat-1',
          headline: 'ISRO Completes Next-Gen Cryogenic Stage Firing for Gaganyaan Vector',
          chronicle:
            'PROPULSION SCIENTISTS at Mahendragiri have qualified the human-rated CE-20 cryogenic engine through a grueling 720-second vacuum trial. Telemetry confirmed flawless chamber pressure, paving the path for India’s crewed orbital insertion missions.',
          headlineTe: 'ఇస్రో గగన్‌యాన్ క్రయోజెనిక్ ఇంజిన్ హాట్ టెస్ట్ విజయవంతం',
          chronicleTe:
            'మహేంద్రగిరిలోని ఇస్రో ప్రొపల్షన్ కాంప్లెక్స్‌లో గగన్‌యాన్ మిషన్ కోసం నిర్దేశించిన CE-20 క్రయోజెనిక్ ఇంజిన్ 720 సెకన్ల పాటు విజయవంతంగా పరీక్షించబడింది. చాంబర్ ప్రెషర్ మరియు థ్రస్ట్ పారామితులు నిర్దేశిత ప్రమాణాలకు అనుగుణంగా ఉన్నాయని శాస్త్రవేత్తలు ప్రకటించారు.',
          location: 'New Delhi / Bengaluru, India',
          publisher: 'Press Trust of India',
          timestamp: 'Today • 08:00 IST',
          link: 'https://isro.gov.in',
          category: 'national',
        },
        {
          id: 'nat-2',
          headline: 'National Clean Energy Grid Crosses 185 Gigawatt Milestone',
          chronicle:
            'THE UNION POWER MINISTRY documented that renewable solar and hybrid wind stations met 44 percent of peak afternoon demand yesterday. Inter-regional transmission stability recorded zero phase deviations over the national synchronous corridor.',
          headlineTe: 'భారత పునరుత్పాదక ఇంధన గ్రిడ్ 185 గిగావాట్ల మైలురాయి దాటింది',
          chronicleTe:
            'దేశీయంగా సౌర మరియు పవన విద్యుత్ ఉత్పత్తి సామర్థ్యం గరిష్ట స్థాయికి చేరింది. మధ్యాహ్న సమయాల్లో దేశం మొత్తం విద్యుత్ అవసరాలలో 44 శాతం స్వచ్ఛమైన ఇంధనం నుండే లభించినట్లు కేంద్ర ఇంధన మంత్రిత్వ శాఖ ధృవీకరించింది.',
          location: 'New Delhi, India',
          publisher: 'LiveMint Financial Press',
          timestamp: 'Today • 08:45 IST',
          link: 'https://livemint.com',
          category: 'national',
        },
      ],
    },
    {
      roman: 'CHAPTER III',
      title: 'THE WIDE WORLD DISPATCH',
      titleTe: 'అంతర్జాతీయ ముఖ్యాంశాలు',
      articles: [
        {
          id: 'glob-1',
          headline: 'Global Fusion Reactor Achieves Sustained 100-Million-Degree Confinement',
          chronicle:
            'PHYSICISTS in Southern France sustained magnetic plasma confinement at temperatures hotter than the solar core for ten consecutive minutes without wall degradation. The milestone brings commercial clean energy generation within the reach of this decade.',
          headlineTe: 'ఫ్రాన్స్‌లో అంతర్జాతీయ ఫ్యూజన్ రియాక్టర్ చారిత్రాత్మక రికార్డు',
          chronicleTe:
            'సూర్యుడి అంతర్భాగం కంటే అధిక ఉష్ణోగ్రత వద్ద పది నిమిషాల పాటు ప్లాస్మాను స్థిరంగా నియంత్రించి శాస్త్రవేత్తలు సరికొత్త మైలురాయి సాధించారు. స్వచ్ఛమైన అణు సంలీన శక్తి ఉత్పత్తికి ఇది కీలక ముందడుగు.',
          location: 'Saint-Paul-lez-Durance, France',
          publisher: 'Reuters Science Wire',
          timestamp: 'Today • 09:10 IST',
          link: 'https://reuters.com',
          category: 'global',
        },
      ],
    },
  ],
};

/**
 * Parses raw newsdata.io JSON payload into ink-printed book chapters.
 */
export function parseNewsDataIoPayload(
  payload: any,
  userLocation: string = 'Khammam, Telangana, India'
): ChronicleEdition {
  if (!payload || !payload.results || !Array.isArray(payload.results)) {
    return DEFAULT_CHRONICLE_EDITION;
  }

  const results: any[] = payload.results;
  const locLower = userLocation.toLowerCase();

  const localArticles: NewsArticleItem[] = [];
  const nationalArticles: NewsArticleItem[] = [];
  const globalArticles: NewsArticleItem[] = [];

  results.forEach((item, idx) => {
    const title = item.title || 'Untitled Dispatch';
    const text = item.description || item.content || item.title || 'No additional summary recorded.';
    // Clean text and take 2-3 sentences
    const sentences = text
      .replace(/<[^>]*>?/gm, '')
      .split(/(?<=[.?!])\s+/)
      .slice(0, 3)
      .join(' ');

    const leadWords = sentences.length > 20 ? sentences.substring(0, 15).toUpperCase() : 'DISPATCH';
    const bodySentence = sentences.length > 20 ? sentences.substring(15) : sentences;

    const source = item.source_id || item.source_name || (item.creator && item.creator[0]) || 'Gazette Press';
    const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
    const country = Array.isArray(item.country) ? item.country[0] : (item.country || 'in');

    const hay = (title + ' ' + text + ' ' + (item.country || '')).toLowerCase();
    const isLocal = hay.includes('khammam') || hay.includes('telangana') || hay.includes('hyderabad') || hay.includes('warangal');
    const isIndia = country === 'in' || hay.includes('india') || hay.includes('delhi') || hay.includes('mumbai') || hay.includes('bharat');

    const articleItem: NewsArticleItem = {
      id: `art-${idx}-${Date.now()}`,
      headline: title,
      chronicle: `${leadWords}${bodySentence}`,
      location: isLocal ? 'Telangana / Khammam' : isIndia ? 'India (National)' : 'International',
      publisher: source,
      timestamp: pubDate,
      link: item.link,
      category: isLocal ? 'local' : isIndia ? 'national' : 'global',
    };

    if (isLocal) {
      localArticles.push(articleItem);
    } else if (isIndia) {
      nationalArticles.push(articleItem);
    } else {
      globalArticles.push(articleItem);
    }
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const chapters: ChronicleEdition['chapters'] = [];

  // Chapter 1: Local
  if (localArticles.length > 0) {
    chapters.push({
      roman: 'CHAPTER I',
      title: 'TELANGANA & LOCAL DISPATCH',
      titleTe: 'తెలంగాణ & ప్రాంతీయ సమాచారం',
      articles: localArticles.slice(0, 5),
    });
  } else {
    chapters.push({
      roman: 'CHAPTER I',
      title: 'TELANGANA & LOCAL DISPATCH',
      titleTe: 'తెలంగాణ & ప్రాంతీయ సమాచారం',
      notice: `— No immediate local dispatches in the inkwell for ${userLocation}, turning pages to State/National headlines —`,
      articles: DEFAULT_CHRONICLE_EDITION.chapters[0].articles,
    });
  }

  // Chapter 2: National
  if (nationalArticles.length > 0) {
    chapters.push({
      roman: 'CHAPTER II',
      title: 'BHARAT NATIONAL BULLETIN',
      titleTe: 'భారత జాతీయ వార్తలు',
      articles: nationalArticles.slice(0, 5),
    });
  } else {
    chapters.push(DEFAULT_CHRONICLE_EDITION.chapters[1]);
  }

  // Chapter 3: Global
  if (globalArticles.length > 0) {
    chapters.push({
      roman: 'CHAPTER III',
      title: 'THE WIDE WORLD DISPATCH',
      titleTe: 'అంతర్జాతీయ ముఖ్యాంశాలు',
      articles: globalArticles.slice(0, 5),
    });
  } else {
    chapters.push(DEFAULT_CHRONICLE_EDITION.chapters[2]);
  }

  return {
    editionNumber: `VOLUME ${now.getFullYear()} • ISSUE ${now.getDate() * 10 + 241}`,
    dateStamp: `${dateFormatted} • Live NewsData Press`,
    locationFocus: userLocation,
    chapters,
  };
}

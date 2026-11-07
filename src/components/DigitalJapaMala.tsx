import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Vibrate,
  RotateCcw,
  CheckCircle2,
  Flame,
  Award,
  BookOpen,
  Plus,
  Maximize2,
  Minimize2,
  X,
  Share2,
  Calendar,
  History,
  Target,
  Clock,
  Heart,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Search,
  Globe,
  Compass,
  ExternalLink,
  RefreshCw,
  Music,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { notificationService } from '../services/notificationService.ts';
import { DevotionalAmbientPlayer } from './DevotionalAmbientPlayer.tsx';

export interface PresetMantra {
  id: string;
  name: string;
  sanskrit: string;
  telugu: string;
  deity: string;
  meaning: string;
}

export const PRESET_MANTRAS: PresetMantra[] = [
  {
    id: 'shiva',
    name: 'Om Namah Shivaya',
    sanskrit: 'ॐ नमः शिवाय',
    telugu: 'ఓం నమః శివాయ',
    deity: 'Lord Shiva',
    meaning: 'I bow to Lord Shiva, the auspicious and supreme inner self.',
  },
  {
    id: 'narayana',
    name: 'Om Namo Narayanaya',
    sanskrit: 'ॐ नमो नारायणाय',
    telugu: 'ఓం నమో నారాయణాయ',
    deity: 'Lord Vishnu / Narayana',
    meaning: 'I surrender to Lord Narayana, the refuge of all living beings.',
  },
  {
    id: 'hare_krishna',
    name: 'Hare Krishna Mahamantra',
    sanskrit: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे । हरे राम हरे राम राम राम हरे हरे ॥',
    telugu: 'హరే కృష్ణ హరే కృష్ణ కృష్ణ కృష్ణ హరే హరే | హరే రామ హరే రామ రామ రామ హరే హరే ||',
    deity: 'Sri Radha Krishna & Sri Rama',
    meaning: 'The great chant for deliverance, awakening pure divine love.',
  },
  {
    id: 'ganesha',
    name: 'Om Gam Ganapataye Namaha',
    sanskrit: 'ॐ गं गणपतये नमः',
    telugu: 'ఓం గం గణపతయే నమః',
    deity: 'Lord Ganesha',
    meaning: 'Salutations to Lord Ganesha, the remover of all obstacles.',
  },
  {
    id: 'rama',
    name: 'Sri Ram Jai Ram Jai Jai Ram',
    sanskrit: 'श्री राम जय राम जय जय राम',
    telugu: 'శ్రీరామ జయరామ జయ జయ రామ',
    deity: 'Lord Sri Rama',
    meaning: 'Victory to Sri Rama, the embodiment of righteousness and truth.',
  },
  {
    id: 'gayatri',
    name: 'Gayatri Mantra',
    sanskrit: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥',
    telugu: 'ఓం భూర్భువస్సువః తత్సవితుర్వరేణ్యం భర్గో దేవస్య ధీమహి ధియో యో నః ప్రచోదయాత్ ||',
    deity: 'Goddess Gayatri / Savitr',
    meaning: 'May the radiant divine light illuminate our intellect and consciousness.',
  },
];

interface MalaStats {
  beadCount: number; // 0 to 108
  completedMalas: number; // rounds of 108
  lifetimeChants: number;
  dailyTarget: number; // e.g. 1, 3, 5, 11, 21
  todayDate: string; // YYYY-MM-DD
  todayCompletedMalas: number;
  history: Record<string, number>; // mantraId -> completed malas today
}

const STORAGE_KEY = 'gkedit_japa_mala_data';
const CUSTOM_MANTRAS_KEY = 'gkedit_custom_mantras';

export function DigitalJapaMala() {
  // Mantras state
  const [customMantras, setCustomMantras] = useState<PresetMantra[]>([]);
  const [selectedMantraId, setSelectedMantraId] = useState<string>('shiva');
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [customMantraInput, setCustomMantraInput] = useState<string>('');
  const [customMantraNameInput, setCustomMantraNameInput] = useState<string>('');

  // Mala Counter state
  const [beadCount, setBeadCount] = useState<number>(0);
  const [completedMalas, setCompletedMalas] = useState<number>(0);
  const [dailyTarget, setDailyTarget] = useState<number>(1);
  const [lifetimeChants, setLifetimeChants] = useState<number>(0);
  const [todayCompletedMalas, setTodayCompletedMalas] = useState<number>(0);
  const [history, setHistory] = useState<Record<string, number>>({});

  // Audio & Haptics preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);

  // Fullscreen Eyes-Closed mode
  const [isEyesClosedMode, setIsEyesClosedMode] = useState<boolean>(false);

  // Session duration timer
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // AI Insights & Celebration modal state
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState<boolean>(false);
  const [showInsightModal, setShowInsightModal] = useState<boolean>(false);
  const [celebrationBlessing, setCelebrationBlessing] = useState<string | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);

  // Mantra Discovery State (Google Search Grounding)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('Peace');
  const [customThemeInput, setCustomThemeInput] = useState<string>('');
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [discoveredMantras, setDiscoveredMantras] = useState<any[]>([]);
  const [searchSources, setSearchSources] = useState<Array<{ title: string; url: string }>>([]);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  // Bead pull animation state
  const [isPulling, setIsPulling] = useState<boolean>(false);

  // Reset confirmation prompt
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Web Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // All combined mantras (presets + custom)
  const allMantras = [...PRESET_MANTRAS, ...customMantras];
  const activeMantra =
    allMantras.find((m) => m.id === selectedMantraId) || PRESET_MANTRAS[0];

  // -------------------------------------------------------------
  // 1. Load & Persist from LocalStorage
  // -------------------------------------------------------------
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const todayStr = new Date().toISOString().split('T')[0];

      if (savedData) {
        const parsed: MalaStats = JSON.parse(savedData);
        setBeadCount(parsed.beadCount || 0);
        setCompletedMalas(parsed.completedMalas || 0);
        setLifetimeChants(parsed.lifetimeChants || 0);
        setDailyTarget(parsed.dailyTarget || 1);

        if (parsed.todayDate === todayStr) {
          setTodayCompletedMalas(parsed.todayCompletedMalas || 0);
          setHistory(parsed.history || {});
        } else {
          // New day rollover
          setTodayCompletedMalas(0);
          setHistory({});
        }
      }

      const savedCustom = localStorage.getItem(CUSTOM_MANTRAS_KEY);
      if (savedCustom) {
        setCustomMantras(JSON.parse(savedCustom));
      }
    } catch (e) {
      console.warn('Failed to load Mala from localStorage:', e);
    }
  }, []);

  const saveToStorage = useCallback(
    (updates: Partial<MalaStats>) => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const data: MalaStats = {
          beadCount: updates.beadCount ?? beadCount,
          completedMalas: updates.completedMalas ?? completedMalas,
          lifetimeChants: updates.lifetimeChants ?? lifetimeChants,
          dailyTarget: updates.dailyTarget ?? dailyTarget,
          todayDate: todayStr,
          todayCompletedMalas: updates.todayCompletedMalas ?? todayCompletedMalas,
          history: updates.history ?? history,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to save Mala to localStorage:', e);
      }
    },
    [beadCount, completedMalas, lifetimeChants, dailyTarget, todayCompletedMalas, history]
  );

  // -------------------------------------------------------------
  // 2. Session Timer Tracking
  // -------------------------------------------------------------
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // -------------------------------------------------------------
  // 3. Web Audio Synthesis (Woody Bead Click & Temple Bell)
  // -------------------------------------------------------------
  const playBeadSound = useCallback(
    (isSumaru: boolean = false) => {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;

        if (isSumaru) {
          // Resonant Temple Bell / Tibetan Singing Bowl Chime (108th Meru Bead)
          const baseFreq = 528; // Solfeggio 528Hz divine transformation tone
          const harmonics = [1, 2.76, 5.4, 8.93];

          harmonics.forEach((harmonic, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = index === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(baseFreq * harmonic, now);

            // Long bell decay over 3.2 seconds
            const decay = 3.2 / (index + 1);
            gain.gain.setValueAtTime(0.2 / (index + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + decay);
          });
        } else {
          // Soft woody organic bead-pull click
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(260 + Math.random() * 30, now);
          osc.frequency.exponentialRampToValueAtTime(70, now + 0.04);

          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.045);
        }
      } catch {
        // Safe fallback
      }
    },
    [soundEnabled]
  );

  // -------------------------------------------------------------
  // 4. Haptic Feedback
  // -------------------------------------------------------------
  const triggerHaptic = useCallback(
    (isSumaru: boolean = false) => {
      if (!hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
      try {
        if (isSumaru) {
          // Long celebratory pulse for 108 completion
          navigator.vibrate([100, 60, 250]);
        } else {
          // Short crisp bead pulse (25ms)
          navigator.vibrate(25);
        }
      } catch {
        // Fallback safe
      }
    },
    [hapticsEnabled]
  );

  // -------------------------------------------------------------
  // 5. Increment Bead Action
  // -------------------------------------------------------------
  const incrementBead = useCallback(() => {
    // Start session timer on first chant
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    // Trigger visual pull animation
    setIsPulling(true);
    setTimeout(() => setIsPulling(false), 140);

    const nextCount = beadCount + 1;
    const isSumaruBead = nextCount >= 108;

    // Audio & Haptics
    playBeadSound(isSumaruBead);
    triggerHaptic(isSumaruBead);

    if (isSumaruBead) {
      // Completed 108 beads (1 full round)
      const newCompletedMalas = completedMalas + 1;
      const newTodayMalas = todayCompletedMalas + 1;
      const newLifetime = lifetimeChants + 1;
      const newHistory = {
        ...history,
        [selectedMantraId]: (history[selectedMantraId] || 0) + 1,
      };

      setBeadCount(0);
      setCompletedMalas(newCompletedMalas);
      setTodayCompletedMalas(newTodayMalas);
      setLifetimeChants(newLifetime);
      setHistory(newHistory);

      saveToStorage({
        beadCount: 0,
        completedMalas: newCompletedMalas,
        todayCompletedMalas: newTodayMalas,
        lifetimeChants: newLifetime,
        history: newHistory,
      });

      // Notify and trigger celebratory blessing
      triggerCelebration(newCompletedMalas);
    } else {
      setBeadCount(nextCount);
      const newLifetime = lifetimeChants + 1;
      setLifetimeChants(newLifetime);

      saveToStorage({
        beadCount: nextCount,
        lifetimeChants: newLifetime,
      });
    }
  }, [
    beadCount,
    completedMalas,
    todayCompletedMalas,
    lifetimeChants,
    history,
    selectedMantraId,
    isTimerRunning,
    playBeadSound,
    triggerHaptic,
    saveToStorage,
  ]);

  // Keyboard shortcut listener (Spacebar, ArrowUp, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowRight') {
        e.preventDefault();
        incrementBead();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [incrementBead]);

  // -------------------------------------------------------------
  // 6. AI Celebratory Blessing upon 108 Completion
  // -------------------------------------------------------------
  const triggerCelebration = async (rounds: number) => {
    setShowCelebrationModal(true);
    try {
      const res = await api.getDevotionalInsight({
        type: 'japa_mala_celebration',
        mantraName: activeMantra.name,
        roundsCompleted: rounds,
        language: 'telugu',
      });
      if (res && res.result) {
        setCelebrationBlessing(res.result);
      } else {
        setCelebrationBlessing(
          `🌺 శ్రీ ${activeMantra.deity} దివ్య అనుగ్రహం మరియు శుభ శాంతి మీపై సదా ఉండుగాక! Completed Round ${rounds} with sacred devotion. 🕉️`
        );
      }
    } catch {
      setCelebrationBlessing(
        `🌺 శ్రీ ${activeMantra.deity} దివ్య అనుగ్రహం మరియు శాంతి మీతో ఉండుగాక! Completed ${rounds} Malas of ${activeMantra.name}. 🕉️`
      );
    }
  };

  // -------------------------------------------------------------
  // 7. Fetch AI Mantra Insight Card
  // -------------------------------------------------------------
  const handleFetchAiInsight = async () => {
    setIsLoadingInsight(true);
    setShowInsightModal(true);
    try {
      const res = await api.getDevotionalInsight({
        type: 'japa_mala_insight',
        mantraName: activeMantra.name,
        mantraText: `${activeMantra.sanskrit} / ${activeMantra.telugu}`,
        deity: activeMantra.deity,
        language: 'telugu',
      });
      if (res && res.result) {
        setAiInsight(res.result);
      } else {
        setAiInsight(
          `### ${activeMantra.name}\n\n**Sanskrit:** ${activeMantra.sanskrit}\n\n**Telugu:** ${activeMantra.telugu}\n\n**Deity:** ${activeMantra.deity}\n\n**Meaning:** ${activeMantra.meaning}\n\n**Brahma Muhurta (4:00 AM - 6:00 AM)** is considered the most auspicious time for chanting this sacred japa.`
        );
      }
    } catch {
      setAiInsight(
        `### ${activeMantra.name}\n\n**Sanskrit:** ${activeMantra.sanskrit}\n\n**Telugu:** ${activeMantra.telugu}\n\n**Meaning:** ${activeMantra.meaning}\n\nChant with focused rhythmic breathing at dawn or dusk for peace and clarity.`
      );
    } finally {
      setIsLoadingInsight(false);
    }
  };

  // -------------------------------------------------------------
  // 7b. Mantra Discovery with Google Search Grounding
  // -------------------------------------------------------------
  const handleDiscoverMantras = async (themeToUse?: string) => {
    const targetTheme = (themeToUse || customThemeInput || selectedTheme).trim();
    if (!targetTheme) return;

    setIsDiscovering(true);
    setDiscoveryError(null);
    setDiscoveredMantras([]);
    setSearchSources([]);

    try {
      const res = await api.getDevotionalInsight({
        type: 'discover_mantras',
        theme: targetTheme,
        count: 3,
        language: 'telugu',
      });

      if (res && res.result) {
        // Parse JSON from response markdown fence
        let parsedData: any = null;
        try {
          const jsonMatch = res.result.match(/```json\s*([\s\S]*?)\s*```/) || res.result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const rawJson = jsonMatch[1] || jsonMatch[0];
            parsedData = JSON.parse(rawJson);
          } else {
            parsedData = JSON.parse(res.result);
          }
        } catch (jsonErr) {
          console.warn('Failed to parse JSON directly from search grounding response:', jsonErr);
        }

        if (parsedData && Array.isArray(parsedData.mantras) && parsedData.mantras.length > 0) {
          setDiscoveredMantras(parsedData.mantras);
        } else {
          // Fallback curated authentic mantras based on theme if JSON extraction needed backup
          const fallbackByTheme: Record<string, any[]> = {
            Peace: [
              {
                id: 'peace_shanti',
                name: 'Sarvesham Svastir Bhavatu (Universal Peace)',
                sanskrit: 'ॐ सर्वेषां स्वस्तिर्भवतु । सर्वेषां शान्तिर्भवतु । सर्वेषां पूर्णं भवतु । सर्वेषां मङ्गलं भवतु ॥',
                telugu: 'ఓం సర్వేషాం స్వస్తిర్భవతు | సర్వేషాం శాంతిర్భవతు | సర్వేషాం పూర్ణం భవతు | సర్వేషాం మంగళం భవతు ||',
                deity: 'Universal Supreme Consciousness (Brahman)',
                meaning: 'May there be well-being in all, may there be peace in all, may there be fullness in all, may there be auspiciousness in all.',
                origin: 'Brihadaranyaka Upanishad',
                benefits: 'Calms hyper-agitated nervous system, dispels negative energy, brings deep spiritual peace.',
                bestTime: 'Early Morning / Twilight',
              },
              {
                id: 'peace_asato',
                name: 'Pavamana Mantra (Lead me from Ignorance to Light)',
                sanskrit: 'ॐ असतो मा सद्गमय । तमसो मा ज्योतिर्गमय । मृत्योर्मा अमृतं गमय ॥ ॐ शान्तिः शान्तिः शान्तिः ॥',
                telugu: 'ఓం అసతో మా సద్గమయ | తమసో మా జ్యోతిర్గమయ | మృత్యోర్మా అమృతం గమయ || ఓం శాంతిః శాంతిః శాంతిః ||',
                deity: 'The Supreme Divine Light',
                meaning: 'Lead us from the unreal to the real, from darkness to light, and from death to immortality. Peace, Peace, Peace.',
                origin: 'Brihadaranyaka Upanishad (1.3.28)',
                benefits: 'Destroys existential anxiety and fear of failure, restoring steady inner clarity.',
                bestTime: 'Brahma Muhurta (4:00 AM - 6:00 AM)',
              },
            ],
            Abundance: [
              {
                id: 'abundance_kanakadhara',
                name: 'Kanakadhara Stotra Verse (Golden Flow)',
                sanskrit: 'वन्दे वन्दारु-मन्दार-दिव्य-पादप-मञ्जरीम् । मन्दाक्ष-निःसहाक्षीण-मन्दहासां मुकुन्द-वल्लभाम् ॥',
                telugu: 'వందే వందారు-మందార-దివ్య-పాదప-మంజరీమ్ | మందాక్ష-నిఃసహాక్షీణ-మందహాసాం ముకుంద-వల్లభామ్ ||',
                deity: 'Goddess Mahalakshmi',
                meaning: 'Salutations to Goddess Lakshmi, the consort of Mukunda, whose subtle smile bestows unending gold and prosperity.',
                origin: 'Adi Shankaracharya Kanakadhara Stotram',
                benefits: 'Removes debt, purifies financial blockages, and attracts noble abundance.',
                bestTime: 'Friday dawn or Sunset (Pradosha)',
              },
              {
                id: 'abundance_kubera',
                name: 'Kubera Dhana Akarshana Mantra',
                sanskrit: 'ॐ यक्षाय कुबेराय वैश्रवणाय धनधान्याधिपतये धनधान्यसमृद्धिं मे देहि दापय स्वाहा ॥',
                telugu: 'ఓం యక్షాయ కుబేరాయ వైశ్రవణాయ ధనధాన్యాధిపతయే ధనధాన్యసమృద్ధిం మే దేహి దాపయ స్వాహా ||',
                deity: 'Lord Kubera & Goddess Lakshmi',
                meaning: 'Salutations to King Kubera, lord of wealth and sustenance, grant me spiritual and material auspiciousness.',
                origin: 'Vedic Atharva Samhita',
                benefits: 'Bestows financial wisdom, business stability, and removes poverty consciousness.',
                bestTime: 'Thursday or Friday evening',
              },
            ],
            Healing: [
              {
                id: 'healing_dhanvantari',
                name: 'Dhanvantari Maha Arogya Mantra',
                sanskrit: 'ॐ नमो भगवते महासुदर्शनाय वासुदेवाय धन्वन्तरये अमृतकलशहस्ताय सर्वभयविनाशाय सर्वरोगनिवारणाय त्रिलोकपतये त्रिलोकनाथाय श्रीमहाविष्णुस्वरूपाय नमः ॥',
                telugu: 'ఓం నమో భగవతే మహాసుదర్శనాయ వాసుదేవాయ ధన్వంతరయే అమృతకలశహస్తాయ సర్వభయవినాశాయ సర్వరోగనివారణాయ త్రిలోకపతయే త్రిలోకనాథాయ శ్రీమహావిష్ణుస్వరూపాయ నమః ||',
                deity: 'Lord Dhanvantari (Physician of the Gods)',
                meaning: 'Salutations to Lord Dhanvantari who holds the nectar pot of immortality, the supreme healer who eradicates all diseases and fear.',
                origin: 'Ayurveda Samhitas / Vishnu Purana',
                benefits: 'Cellular rejuvenation, relief from chronic fatigue, and radiant vitality.',
                bestTime: 'Dawn before food intake',
              },
              {
                id: 'healing_tryambakam',
                name: 'Maha Mrityunjaya (Restoration & Immortality)',
                sanskrit: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात् ॥',
                telugu: 'ఓం త్ర్యంబకం యజామహే సుగంధిం పుష్టివర్ధనమ్ | ఉర్వారుకమివ బంధనాన్ మృత్యోర్ముక్షీయ మామృతాత్ ||',
                deity: 'Lord Tryambaka (Shiva)',
                meaning: 'We meditate on the fragrant three-eyed Lord who nourishes all beings. May He liberate us from death into immortality like a ripe cucumber severed from the vine.',
                origin: 'Rigveda (7.59.12)',
                benefits: 'Shields against accidents, speeds convalescence, and awakens vital pranic force.',
                bestTime: 'Sunrise or during recovery',
              },
            ],
          };

          const matched = fallbackByTheme[targetTheme] || fallbackByTheme.Peace;
          setDiscoveredMantras(matched);
        }

        if (res.sources && res.sources.length > 0) {
          setSearchSources(res.sources);
        }
      }
    } catch (err: any) {
      console.error('Mantra discovery error:', err);
      setDiscoveryError('Live search retrieval momentarily paused. Showing authentic Vedic discoveries.');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Adopt discovered mantra into active Mala and localStorage
  const handleAdoptDiscoveredMantra = (mantra: any) => {
    const newMantra: PresetMantra = {
      id: `discovered_${Date.now()}`,
      name: mantra.name,
      sanskrit: mantra.sanskrit,
      telugu: mantra.telugu || mantra.sanskrit,
      deity: mantra.deity || 'Vedic Tradition',
      meaning: `${mantra.meaning} (Source: ${mantra.origin || 'Vedic Scripture'})`,
    };

    const updated = [...customMantras, newMantra];
    setCustomMantras(updated);
    setSelectedMantraId(newMantra.id);
    localStorage.setItem(CUSTOM_MANTRAS_KEY, JSON.stringify(updated));
    setShowDiscoveryModal(false);

    notificationService.showInAppToast(
      'Mantra Adopted to Mala! 📿',
      `"${newMantra.name}" is now loaded into your 108-bead Japa Mala!`,
      'success'
    );
  };

  // -------------------------------------------------------------
  // 8. Custom Mantra Addition
  // -------------------------------------------------------------
  const handleSaveCustomMantra = () => {
    if (!customMantraNameInput.trim() || !customMantraInput.trim()) return;
    const newMantra: PresetMantra = {
      id: `custom_${Date.now()}`,
      name: customMantraNameInput.trim(),
      sanskrit: customMantraInput.trim(),
      telugu: customMantraInput.trim(),
      deity: 'Custom Devotion',
      meaning: 'Personal sacred mantra for regular japa sadhana.',
    };
    const updated = [...customMantras, newMantra];
    setCustomMantras(updated);
    setSelectedMantraId(newMantra.id);
    localStorage.setItem(CUSTOM_MANTRAS_KEY, JSON.stringify(updated));
    setShowAddCustomModal(false);
    setCustomMantraNameInput('');
    setCustomMantraInput('');
    notificationService.showInAppToast(
      'Mantra Added',
      `"${newMantra.name}" is now ready in your Mala!`,
      'success'
    );
  };

  const handleResetCurrentMala = () => {
    setBeadCount(0);
    saveToStorage({ beadCount: 0 });
    setShowResetConfirm(false);
    notificationService.showInAppToast('Mala Reset', 'Bead counter reset to 0.', 'info');
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // 9. FULLSCREEN EYES-CLOSED MODE
  // -------------------------------------------------------------
  if (isEyesClosedMode) {
    return (
      <div
        onClick={incrementBead}
        className="fixed inset-0 z-50 bg-[#070402] text-amber-100 flex flex-col justify-between p-6 select-none cursor-pointer"
        style={{
          background: 'radial-gradient(circle at center, #1b0c03 0%, #080301 100%)',
        }}
      >
        {/* Top Control Bar */}
        <div
          className="flex items-center justify-between pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-wider text-amber-300 uppercase">
              Eyes-Closed Mode (Tap Anywhere)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsEyesClosedMode(false)}
            className="p-2.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-300 hover:text-white transition"
            title="Exit Fullscreen"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Center Giant Bead Display */}
        <div className="flex flex-col items-center justify-center my-auto pointer-events-none text-center">
          <div className="text-sm font-serif text-amber-300/80 mb-2">{activeMantra.name}</div>
          <div className="text-7xl sm:text-9xl font-black font-mono tracking-tight text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]">
            {beadCount}
          </div>
          <div className="text-xs font-mono text-amber-500/80 uppercase tracking-widest mt-1">
            of 108 Beads
          </div>

          <div className="mt-8 flex items-center gap-6 text-sm font-mono text-amber-200/90 bg-black/60 px-5 py-2.5 rounded-2xl border border-amber-500/30">
            <div>
              <span className="text-slate-400 text-xs block">Mala Rounds</span>
              <span className="font-bold text-amber-300">{completedMalas}</span>
            </div>
            <div className="w-px h-6 bg-amber-500/30" />
            <div>
              <span className="text-slate-400 text-xs block">Duration</span>
              <span className="font-bold text-white">{formatTimer(sessionSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Tap Instruction */}
        <div className="text-center text-xs font-mono text-amber-400/60 pointer-events-none pb-2 animate-pulse">
          Touch or click anywhere on the screen to pull the next bead
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 10. MAIN JAPA MALA UI
  // -------------------------------------------------------------
  const progressRatio = beadCount / 108;
  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="space-y-6">
      {/* HEADER CARD: ACTIVE MANTRA & SELECTION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1a0e05]/95 via-[#0e0703]/90 to-[#060301] border border-amber-500/35 shadow-[0_12px_45px_rgba(0,0,0,0.85)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>జప మాల సాధన</span>
              </span>
              <span className="text-xs text-amber-300/80 font-mono">108 Bead Meditation</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-amber-100 flex items-center gap-2">
              <span>{activeMantra.name}</span>
            </h2>

            <p className="text-sm font-serif text-amber-200/90 italic tracking-wide">
              {activeMantra.telugu || activeMantra.sanskrit}
            </p>
            <p className="text-xs text-slate-400 max-w-xl">{activeMantra.meaning}</p>
          </div>

          {/* Action Buttons: AI Insight & Eyes-Closed & Mantra Discovery */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setShowDiscoveryModal(true);
                if (discoveredMantras.length === 0) {
                  handleDiscoverMantras('Peace');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-orange-500/25 hover:from-amber-500/40 border border-amber-400/60 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              title="Discover rare ancient Sanskrit mantras using Google Search Grounding"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>Discover Rare Mantras</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 font-mono">
                WEB AI
              </span>
            </button>

            <button
              type="button"
              onClick={handleFetchAiInsight}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Insight</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEyesClosedMode(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-md"
              title="Fullscreen touch-anywhere mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Eyes-Closed</span>
            </button>
          </div>
        </div>

        {/* Mantra Selector Pill Carousel */}
        <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {allMantras.map((m) => {
            const isSelected = m.id === selectedMantraId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMantraId(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : 'bg-black/50 text-amber-200/80 border-amber-500/30 hover:bg-amber-950/40'
                }`}
              >
                {m.name}
              </button>
            );
          })}

          {/* Quick Discover Pill */}
          <button
            type="button"
            onClick={() => {
              setShowDiscoveryModal(true);
              if (discoveredMantras.length === 0) {
                handleDiscoverMantras('Peace');
              }
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap bg-amber-950/60 border border-amber-400/50 text-amber-300 hover:bg-amber-900/50 flex items-center gap-1 shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Find Rare Mantras...</span>
          </button>

          {/* Add Custom Mantra Button */}
          <button
            type="button"
            onClick={() => setShowAddCustomModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap border border-dashed border-amber-400/60 text-amber-300 hover:bg-amber-500/10 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      {/* 4 STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Current Bead
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">
            {beadCount}
            <span className="text-xs text-slate-500 font-normal"> / 108</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Malas (Rounds)
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
            {completedMalas}
            <span className="text-xs text-slate-500 font-normal"> done</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Daily Target
          </div>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <select
              value={dailyTarget}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setDailyTarget(val);
                saveToStorage({ dailyTarget: val });
              }}
              className="bg-transparent text-lg font-black font-mono text-amber-300 focus:outline-none cursor-pointer"
            >
              {[1, 3, 5, 11, 21, 54, 108].map((num) => (
                <option key={num} value={num} className="bg-slate-900 text-white">
                  {num} Malas
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Lifetime Chants
          </div>
          <div className="text-2xl font-black font-mono text-cyan-300 mt-0.5">
            {lifetimeChants.toLocaleString()}
          </div>
        </div>
      </div>

      {/* CENTER INTERACTIVE RUDRAKSHA MALA WHEEL */}
      <div className="relative flex flex-col items-center justify-center p-6 sm:p-10 rounded-3xl bg-slate-950/85 border border-amber-500/30 shadow-2xl overflow-hidden">
        {/* Top Controls: Sound, Haptics, Timer, Reset */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-slate-300 mb-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Session: {formatTimer(sessionSeconds)}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Ambient Sound Player Compact Controller */}
            <DevotionalAmbientPlayer compact={true} />

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Haptics Toggle */}
            <button
              type="button"
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className={`p-1.5 rounded-xl border transition ${
                hapticsEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={hapticsEnabled ? 'Disable Vibration' : 'Enable Vibration'}
            >
              <Vibrate className="w-4 h-4" />
            </button>

            {/* Reset Mala Button */}
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
              title="Reset Current Mala"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Circular SVG Progress Ring with Rudraksha Bead Visuals */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-3 select-none">
          {/* Outer Pulsing Glow on tap */}
          <div
            className={`absolute inset-4 rounded-full transition-opacity duration-300 ${
              isPulling ? 'opacity-100 bg-amber-500/20 blur-xl' : 'opacity-0'
            }`}
          />

          {/* SVG Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            {/* Background Ring */}
            <circle
              cx="50%"
              cy="50%"
              r="110"
              stroke="rgba(245, 158, 11, 0.15)"
              strokeWidth="14"
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx="50%"
              cy="50%"
              r="110"
              stroke="#f59e0b"
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-[stroke-dashoffset] duration-150"
            />

            {/* Render 27 preview decorative bead nodes along the circle */}
            {Array.from({ length: 27 }).map((_, i) => {
              const angle = (i / 27) * 2 * Math.PI;
              const cx = 160 + 110 * Math.cos(angle);
              const cy = 160 + 110 * Math.sin(angle);
              const isPast = (i / 27) <= progressRatio;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="4.5"
                  fill={isPast ? '#fbbf24' : '#573010'}
                  stroke={isPast ? '#f59e0b' : '#301808'}
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          {/* Center Touch & Tap Target (Woody Rudraksha Core) */}
          <button
            type="button"
            onClick={incrementBead}
            className={`relative z-10 w-44 h-44 sm:w-48 sm:h-48 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-100 shadow-[0_12px_35px_rgba(0,0,0,0.9)] active:scale-95 ${
              isPulling
                ? 'scale-95 border-amber-300 bg-gradient-to-tr from-amber-700 via-yellow-600 to-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.6)]'
                : 'border-amber-500/70 bg-gradient-to-tr from-[#381a05] via-[#210c02] to-[#120500] hover:border-amber-400'
            }`}
          >
            <span className="text-[11px] font-mono font-bold tracking-widest text-amber-300 uppercase">
              TAP OR SPACE
            </span>
            <span className="text-5xl sm:text-6xl font-black font-mono text-amber-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {beadCount}
            </span>
            <span className="text-[10px] font-mono text-amber-400/80">
              {108 - beadCount} beads left
            </span>

            {/* Mini Meru Bead indicator */}
            <div className="absolute -top-3 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-white/80 shadow-[0_0_12px_#f59e0b] flex items-center justify-center text-[11px]">
              🕉️
            </div>
          </button>
        </div>

        {/* Motivational Guidance & Keyboard Hint */}
        <div className="mt-2 text-center space-y-1">
          <p className="text-xs font-mono text-slate-300">
            {beadCount === 0
              ? 'Begin your Mala chanting with pure devotion.'
              : beadCount === 107
              ? '✨ Next tap reaches the Meru Bead (108 Complete)!'
              : `Round progress: ${Math.round(progressRatio * 100)}%`}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">Spacebar</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">↑ Arrow</kbd> to increment beads.
          </p>
        </div>
      </div>

      {/* AMBIENT SOUND MEDITATION SANCTUARY */}
      <DevotionalAmbientPlayer compact={false} />

      {/* TODAY'S JAPA CHANT HISTORY SUMMARY */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-amber-500/25 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Today's Chant Summary</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {todayCompletedMalas} / {dailyTarget} Malas ({Math.min(100, Math.round((todayCompletedMalas / dailyTarget) * 100))}%)
          </span>
        </div>

        {/* Progress Bar towards daily goal */}
        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${Math.min(100, (todayCompletedMalas / dailyTarget) * 100)}%` }}
          />
        </div>

        {/* Breakdown by mantra */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {Object.entries(history).length === 0 ? (
            <div className="text-xs text-slate-400 font-mono col-span-2 py-2 text-center">
              No full malas completed yet today. Chant 108 beads to log your first round!
            </div>
          ) : (
            Object.entries(history).map(([mId, count]) => {
              const mObj = allMantras.find((m) => m.id === mId);
              return (
                <div
                  key={mId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs"
                >
                  <span className="font-medium text-amber-200 truncate max-w-[200px]">
                    {mObj?.name || 'Mantra'}
                  </span>
                  <span className="font-mono font-bold text-emerald-400 shrink-0">
                    {count} {count === 1 ? 'Mala' : 'Malas'} ({count * 108} chants)
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL 1: AI MANTRA INSIGHT */}
      {showInsightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-slate-950 border border-amber-500/50 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2 text-amber-300">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">AI Mantra Insight</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInsightModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingInsight ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-amber-300 font-mono text-xs">
                <Sparkles className="w-7 h-7 animate-spin text-amber-400" />
                <span>Invoking Divine Wisdom...</span>
              </div>
            ) : (
              <div className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-sans space-y-2">
                {aiInsight}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowInsightModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              Close Insight
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: CELEBRATION BLESSING (108 COMPLETE) */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full p-6 rounded-3xl bg-gradient-to-b from-[#241103] to-[#0d0501] border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)] text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_20px_#f59e0b] text-3xl">
              🕉️
            </div>

            <div>
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-amber-400">
                Mala Completed!
              </span>
              <h3 className="text-xl font-extrabold text-white mt-1">108 Chants Offered</h3>
              <p className="text-xs text-amber-200/90 font-serif mt-0.5">{activeMantra.name}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 text-xs text-amber-100 font-serif leading-relaxed italic">
              {celebrationBlessing || '🌺 మేలుకోలుపు, శాంతి మరియు సమస్త శుభాలు మీతో ఉండుగాక!'}
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCelebrationModal(false);
                  incrementBead();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition"
              >
                Start Next Mala
              </button>
              <button
                type="button"
                onClick={() => setShowCelebrationModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CUSTOM MANTRA */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-950 border border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Custom Mantra</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-mono block mb-1">
                  Mantra Title / Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maha Mrityunjaya Mantra"
                  value={customMantraNameInput}
                  onChange={(e) => setCustomMantraNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-mono block mb-1">
                  Mantra Text (Sanskrit / Telugu / English)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्..."
                  value={customMantraInput}
                  onChange={(e) => setCustomMantraInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-mono hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomMantra}
                disabled={!customMantraNameInput.trim() || !customMantraInput.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                Save Mantra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-sm w-full p-5 rounded-3xl bg-slate-950 border border-amber-500/40 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Reset Current Mala?</h4>
            <p className="text-xs text-slate-400">
              This will reset your current bead count from {beadCount} back to 0. Lifetime and daily completed malas will NOT be affected.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetCurrentMala}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Yes, Reset Bead Count
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MANTRA DISCOVERY (GOOGLE SEARCH GROUNDING) */}
      {showDiscoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-2xl w-full p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#1c0f06] via-[#0d0602] to-[#040201] border-2 border-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.3)] space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-amber-500/25 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Mantra Discovery</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                      Google Search Grounded
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-amber-200/80 font-sans">
                  Discover rare ancient Sanskrit mantras from Upanishads & Vedas with live web research.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDiscoveryModal(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Theme Selector Pills */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>Select Spiritual Theme:</span>
                <span className="text-amber-400 text-[11px] font-normal">Active: {selectedTheme}</span>
              </label>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'Peace', label: '🕊️ Peace (శాంతి)', desc: 'Inner calm & anxiety relief' },
                  { id: 'Abundance', label: '🌾 Abundance (శ్రీ & సమృద్ధి)', desc: 'Prosperity & wealth' },
                  { id: 'Healing', label: '🌿 Healing (ఆరోగ్యం & ధన్వంతరి)', desc: 'Vitality & recovery' },
                  { id: 'Courage', label: '🦁 Courage & Protection (రక్షణ)', desc: 'Fearlessness & energy' },
                  { id: 'Wisdom', label: '📖 Wisdom & Focus (సరస్వతి మేధస్సు)', desc: 'Memory & clarity' },
                  { id: 'Liberation', label: '🕉️ Liberation & Moksha (మోక్షం)', desc: 'Self-realization' },
                ].map((t) => {
                  const isSelected = selectedTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTheme(t.id);
                        handleDiscoverMantras(t.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                          : 'bg-black/50 text-amber-200/80 border-amber-500/30 hover:bg-amber-950/40 hover:text-white'
                      }`}
                    >
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Search Input */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Or type custom theme: e.g. Sleep, Student Exam Success, Planetary Shanti..."
                    value={customThemeInput}
                    onChange={(e) => setCustomThemeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleDiscoverMantras(customThemeInput);
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDiscoverMantras(customThemeInput)}
                  disabled={isDiscovering}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-50"
                >
                  {isDiscovering ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Error or Notice */}
            {discoveryError && (
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{discoveryError}</span>
              </div>
            )}

            {/* Search Grounding Live Status & Discovered Cards */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Google Search Grounding:</span>
                  <span className="text-amber-300 font-bold">
                    {isDiscovering ? 'Searching Vedic Sources...' : `${discoveredMantras.length} Rare Mantras Discovered`}
                  </span>
                </div>
              </div>

              {/* Loading State */}
              {isDiscovering && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-amber-300 font-mono text-xs bg-slate-950/60 rounded-2xl border border-amber-500/20">
                  <Compass className="w-8 h-8 animate-spin text-amber-400" />
                  <span className="animate-pulse">Consulting Vedic Texts & Web Repositories...</span>
                  <span className="text-[10px] text-slate-400">
                    Theme: "{customThemeInput || selectedTheme}"
                  </span>
                </div>
              )}

              {/* Discovered Mantra Cards */}
              {!isDiscovering && discoveredMantras.length > 0 && (
                <div className="space-y-3">
                  {discoveredMantras.map((mantra, idx) => (
                    <div
                      key={mantra.id || idx}
                      className="p-4 rounded-2xl bg-black/60 border border-amber-500/35 hover:border-amber-400/70 transition space-y-2.5 shadow-md relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/40">
                              {idx + 1}
                            </span>
                            <h4 className="text-sm font-extrabold text-white">{mantra.name}</h4>
                            {mantra.origin && (
                              <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-cyan-300 font-mono">
                                📜 {mantra.origin}
                              </span>
                            )}
                          </div>
                          {mantra.deity && (
                            <div className="text-[11px] text-amber-300/80 font-mono mt-0.5">
                              Deity / Rishi: {mantra.deity}
                            </div>
                          )}
                        </div>

                        {/* Adopt Mantra Button */}
                        <button
                          type="button"
                          onClick={() => handleAdoptDiscoveredMantra(mantra)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95 transition"
                          title="Adopt this mantra directly into your Japa Mala"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Use in Mala</span>
                        </button>
                      </div>

                      {/* Sanskrit & Telugu Verse */}
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
                        <div className="text-xs font-serif text-amber-200 tracking-wide font-semibold">
                          {mantra.sanskrit}
                        </div>
                        {mantra.telugu && (
                          <div className="text-[11px] font-serif text-amber-300/80 italic">
                            {mantra.telugu}
                          </div>
                        )}
                      </div>

                      {/* Meaning & Benefits */}
                      <div className="text-xs text-slate-300 font-sans space-y-1">
                        <div>
                          <strong className="text-amber-300">Meaning: </strong>
                          <span>{mantra.meaning}</span>
                        </div>
                        {mantra.benefits && (
                          <div className="text-[11px] text-emerald-300/90 font-sans">
                            <strong>Benefits: </strong>
                            <span>{mantra.benefits}</span>
                          </div>
                        )}
                        {mantra.bestTime && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            ⏰ Best Time: {mantra.bestTime}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Web Citations / Sources */}
              {searchSources.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>Search Grounding Sources:</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {searchSources.slice(0, 4).map((source, sIdx) => (
                      <a
                        key={sIdx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-[10px] text-cyan-300 hover:text-white hover:border-cyan-400 flex items-center gap-1 transition max-w-[200px] truncate"
                        title={source.title}
                      >
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{source.title || source.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex items-center justify-between border-t border-amber-500/20 pt-3">
              <span className="text-[10px] font-mono text-slate-400">
                Found mantras can be permanently saved to your custom japa collection.
              </span>
              <button
                type="button"
                onClick={() => setShowDiscoveryModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-mono hover:text-white border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

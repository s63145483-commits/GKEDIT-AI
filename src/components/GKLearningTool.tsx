import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Bell,
  ArrowRight,
  Award,
  Zap,
  HelpCircle,
  Share2,
  Check,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Languages,
  Heart,
  TrendingUp,
  Smile,
  RefreshCw,
  Compass,
  Briefcase,
  Utensils,
  ShoppingBag,
  Stethoscope,
  MessageCircle,
  Coffee,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  Play,
  Trophy,
} from 'lucide-react';
import { notificationService } from '../services/notificationService.ts';
import { reminderService } from '../services/reminderService.ts';

export type LanguageCode = 'en' | 'te' | 'hi';
export type Level = 'beginner' | 'intermediate';
export type ChallengeType = 'mcq' | 'scramble' | 'fill_blank';
export type LearningMode = 'daily' | 'custom';

export interface LessonContent {
  id: string;
  hourNumber: number; // 1 to 14
  dayNumber: number;  // 1 to 42 (Daily roadmap)
  topic: string;
  interestCategory: string; // 'travel' | 'food' | 'interview' | 'shopping' | 'health' | 'chat' | 'slang' | 'grammar' | 'tech'
  knownLang: LanguageCode;
  targetLang: LanguageCode;
  level: Level;
  // 1. 🎯 Today's Focus
  focusWord: string;
  focusTransliteration: string;
  focusMeaning: string;
  focusCategory: string;
  focusTip: string;
  // 2. 💡 Context / Example
  exampleSentenceTarget: string;
  exampleSentenceTransliteration: string;
  exampleSentenceMeaning: string;
  exampleContextNote: string;
  // 3. ⚡ Quick Challenge
  challengeType: ChallengeType;
  challengeQuestion: string;
  options?: string[];
  correctOptionIndex?: number;
  scrambleWords?: string[];
  scrambleCorrectSentence?: string;
  blankSentence?: string;
  blankOptions?: string[];
  blankCorrectWord?: string;
  challengeExplanation: string;
  // 4. 🌟 Encouragement
  encouragementQuote: string;
}

export interface HourCurriculum {
  hourNumber: number;
  title: string;
  teluguTitle: string;
  hindiTitle: string;
  durationLabel: string;
  interestTag: string;
  icon: string;
  description: string;
  keyTopics: string[];
}

// --------------------------------------------------------------------------
// 14-HOUR MASTER COURSE SYLLABUS DEFINITION (Total 14 Hours)
// --------------------------------------------------------------------------
export const COURSE_HOURS: HourCurriculum[] = [
  {
    hourNumber: 1,
    title: 'Hour 1: Foundations & Phonetics',
    teluguTitle: 'గంట 1: వర్ణమాల, అచ్చులు & ధ్వనులు',
    hindiTitle: 'घंटा 1: वर्णमाला, स्वर और उच्चारण',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'grammar',
    icon: '📖',
    description: 'Alphabet foundations, vowels, consonants, phonetics, and mouth placement for natural accents.',
    keyTopics: ['Vowel Sounds & Swaralu', 'Consonant Clusters', 'Stress & Intonation'],
  },
  {
    hourNumber: 2,
    title: 'Hour 2: Greetings, Politeness & Respect',
    teluguTitle: 'గంట 2: నమస్కారాలు & మర్యాదలు',
    hindiTitle: 'घंटा 2: शिष्टाचार और अभिवादन',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'chat',
    icon: '🙏',
    description: 'Warm formal and casual greetings, respectful pronouns (మీరు / आप / You), saying please & thank you.',
    keyTopics: ['Namaskaram / Namaste Formats', 'Respectful Pronouns', 'Apologies & Courtesy'],
  },
  {
    hourNumber: 3,
    title: 'Hour 3: Essential Daily Verbs & Actions',
    teluguTitle: 'గంట 3: ముఖ్యమైన రోజువారీ క్రియలు',
    hindiTitle: 'घंटा 3: दैनिक क्रियाएँ और कार्य',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'chat',
    icon: '⚡',
    description: 'Top 50 action verbs for daily life: Eat, drink, sleep, go, come, speak, work, listen, see.',
    keyTopics: ['Daily Action Verbs', 'Sentence Endings', 'Subject-Verb Agreement'],
  },
  {
    hourNumber: 4,
    title: 'Hour 4: Numbers, Time, Money & Calendar',
    teluguTitle: 'గంట 4: సంఖ్యలు, సమయం, రోజులు & క్యాలెండర్',
    hindiTitle: 'घंटा 4: गिनती, समय, दिन और कैलेंडर',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'shopping',
    icon: '⏰',
    description: 'Counting from 1 to 100, asking "What time is it?", days of the week, months, and currency.',
    keyTopics: ['Numbers & Counting', 'Telling Time', 'Days, Weeks & Months'],
  },
  {
    hourNumber: 5,
    title: 'Hour 5: Family, Relationships & Social Bonding',
    teluguTitle: 'గంట 5: కుటుంబం, బంధువులు & అనుబంధాలు',
    hindiTitle: 'घंटा 5: परिवार, रिश्ते और रिश्तेदार',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'chat',
    icon: '❤️',
    description: 'Kinship vocabulary (Mother, Father, Brother, Sister, In-laws, Friends) and introducing loved ones.',
    keyTopics: ['Kinship Terms (అమ్మ, నాన్న)', 'Introducing Family', 'Possessive Pronouns'],
  },
  {
    hourNumber: 6,
    title: 'Hour 6: Food, Dining, Kitchen & Hotel Ordering',
    teluguTitle: 'గంట 6: భోజనం, రుచులు & రెస్టారెంట్ ఆర్డర్',
    hindiTitle: 'घंटा 6: खान-पान, स्वाद और होटल ऑर्डर',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'food',
    icon: '🍛',
    description: 'Ordering biryani, tiffins, chai, asking for the bill, water, describing flavors (spicy, sweet, tangy).',
    keyTopics: ['Hotel & Dhabha Ordering', 'Flavor Vocabulary (కారం, తీపి)', 'Dietary Preferences'],
  },
  {
    hourNumber: 7,
    title: 'Hour 7: Travel, Commute, Buses & Directions',
    teluguTitle: 'గంట 7: ప్రయాణాలు, RTC బస్, రైలు & దారులు',
    hindiTitle: 'घंटा 7: यात्रा, बस, ट्रेन और दिशाएँ',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'travel',
    icon: '✈️',
    description: 'Taking RTC buses, trains, asking auto drivers, fare inquiries, left, right, straight navigation.',
    keyTopics: ['Bus & Train Tickets', 'Directions (ఎడమ, కుడి, తిన్నగా)', 'Auto/Cab Negotiations'],
  },
  {
    hourNumber: 8,
    title: 'Hour 8: Shopping, Markets, Bargaining & Payments',
    teluguTitle: 'గంట 8: మార్కెట్, షాపింగ్, బేరమాడటం & UPI',
    hindiTitle: 'घंटा 8: खरीदारी, मोलभाव और डिजिटल पेमेंट',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'shopping',
    icon: '🛍️',
    description: 'Asking "How much is this?", bargaining politely, paying with UPI/cash, buying clothes & groceries.',
    keyTopics: ['Asking Price (ధర ఎంత?)', 'Polite Bargaining', 'UPI & Payment Confirmation'],
  },
  {
    hourNumber: 9,
    title: 'Hour 9: Health, Pharmacy, Doctor & Emergency',
    teluguTitle: 'గంట 9: ఆరోగ్యం, మందులు, డాక్టర్ & ఎమర్జెన్సీ',
    hindiTitle: 'घंटा 9: स्वास्थ्य, दवाई, डॉक्टर और आपातकाल',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'health',
    icon: '🏥',
    description: 'Explaining symptoms (headache, fever, stomach ache), pharmacy prescriptions, calling 108/100.',
    keyTopics: ['Describing Symptoms', 'Pharmacy Dialogues', 'Emergency SOS (108/100)'],
  },
  {
    hourNumber: 10,
    title: 'Hour 10: Workplace, Tech, Office & Job Interviews',
    teluguTitle: 'గంట 10: ఉద్యోగం, ఆఫీస్, మీటింగ్స్ & ఇంటర్వ్యూ',
    hindiTitle: 'घंटा 10: दफ़्तर, नौकरी, इंटरव्यू और तकनीकी बातचीत',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'interview',
    icon: '💼',
    description: 'Job interview self-introduction, explaining skills, writing professional messages, team meetings.',
    keyTopics: ['Interview Self-Intro', 'Workplace Emails', 'Tech & Engineering Jargon'],
  },
  {
    hourNumber: 11,
    title: 'Hour 11: Expressing Emotions, Opinions & Likes',
    teluguTitle: 'గంట 11: భావోద్వేగాలు, అభిప్రాయాలు & ఇష్టాలు',
    hindiTitle: 'घंटा 11: भावनाएँ, पसंद-नापसंद और विचार',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'chat',
    icon: '🌟',
    description: 'Expressing joy, sadness, surprise, giving recommendations, saying "In my opinion / I think so".',
    keyTopics: ['Expressing Likes/Dislikes', 'Giving Opinions', 'Showing Empathy & Joy'],
  },
  {
    hourNumber: 12,
    title: 'Hour 12: Tense Mastery: Past, Present & Future',
    teluguTitle: 'గంట 12: కాలాలు - నిన్న, నేడు, రేపు వాక్యాలు',
    hindiTitle: 'घंटा 12: काल - भूतकाल, वर्तमान और भविष्यकाल',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'grammar',
    icon: '⏳',
    description: 'Mastering "Yesterday (నిన్న/कल)", "Today (ఈరోజు/आज)", "Tomorrow (రేపు/कल)" verb conjugations.',
    keyTopics: ['Present Continuous', 'Past Action Sentences', 'Future Commitments'],
  },
  {
    hourNumber: 13,
    title: 'Hour 13: Local Slang, Idioms & Culture',
    teluguTitle: 'గంట 13: సామెతలు, జాతీయాలు & స్థానిక ముచ్చట్లు',
    hindiTitle: 'घंटा 13: मुहावरे, लोकोक्तियाँ और देसी कहावतें',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'slang',
    icon: '🎭',
    description: 'Authentic Telugu proverbs (సామెతలు), Hindi Muhavare, humorous idioms, and colloquial street slang.',
    keyTopics: ['Popular Samethalu / Muhavare', 'Humorous Slang & Wit', 'Cultural Context'],
  },
  {
    hourNumber: 14,
    title: 'Hour 14: Fluency Mastery & Full Dialogue Simulation',
    teluguTitle: 'గంట 14: సంపూర్ణ సంభాషణలు & మాస్టర్ సర్టిఫికేట్',
    hindiTitle: 'घंटा 14: धाराप्रवाह संवाद और मास्टर सर्टिफिकेशन',
    durationLabel: '60 Mins (3 Lessons • 2m daily)',
    interestTag: 'interview',
    icon: '🏆',
    description: 'Uninterrupted conversational flow, live scenario simulations, and earning the 14-Hour Fluency Certificate.',
    keyTopics: ['Complex Real-World Scenarios', 'Spontaneous Responses', '14-Hour Course Certificate'],
  },
];

// User Interest Category Filter Pills
export const INTEREST_CATEGORIES = [
  { id: 'all', label: 'All 14 Hours', icon: Sparkles, desc: 'Complete 14-Hour Master Course' },
  { id: 'travel', label: 'Travel & Transit', icon: Compass, desc: 'Buses, Trains, Autos & Directions' },
  { id: 'food', label: 'Food & Dining', icon: Utensils, desc: 'Hotels, Biryani, Chai & Flavors' },
  { id: 'interview', label: 'Job & Career', icon: Briefcase, desc: 'Interviews, Office & Tech Meetings' },
  { id: 'shopping', label: 'Shopping & Markets', icon: ShoppingBag, desc: 'Bargaining, Prices & UPI' },
  { id: 'health', label: 'Doctor & Emergency', icon: Stethoscope, desc: 'Symptoms, Medicine & 108 Alert' },
  { id: 'chat', label: 'Daily Social Chats', icon: MessageCircle, desc: 'Friends, Family & Greetings' },
  { id: 'slang', label: 'Slang & Culture', icon: Smile, desc: 'Proverbs, Idioms & Local Wit' },
  { id: 'grammar', label: 'Grammar & Tenses', icon: BookOpen, desc: 'Verbs, Past/Future & Sounds' },
];

// --------------------------------------------------------------------------
// EXPANDED 14-HOUR CURRICULUM DATABASE
// --------------------------------------------------------------------------
const COMPREHENSIVE_LESSONS: LessonContent[] = [
  // HOUR 1 - PHONETICS & LETTERS
  {
    id: 'h1_en_te_1',
    hourNumber: 1,
    dayNumber: 1,
    topic: 'Vowels & Sounds (అ, ఆ, ఇ, ఈ)',
    interestCategory: 'grammar',
    knownLang: 'en',
    targetLang: 'te',
    level: 'beginner',
    focusWord: 'అమ్మ (Amma)',
    focusTransliteration: 'Amma',
    focusMeaning: 'Mother / Mom (The purest first sound in Telugu)',
    focusCategory: 'Hour 1 · Phonetics Foundation',
    focusTip: 'The first letter "అ" starts from the back of the throat with an open, relaxed breath.',
    exampleSentenceTarget: 'అమ్మ ప్రేమ చాలా గొప్పది.',
    exampleSentenceTransliteration: 'Amma prema chaalaa goppadi.',
    exampleSentenceMeaning: "A mother's love is truly magnificent.",
    exampleContextNote: '"Goppadi" means great or magnificent in Telugu.',
    challengeType: 'mcq',
    challengeQuestion: 'Which vowel sound starts the Telugu word for Mother ("అమ్మ")?',
    options: ['అ (A)', 'ఇ (I)', 'ఉ (U)', 'ఎ (E)'],
    correctOptionIndex: 0,
    challengeExplanation: '"అమ్మ" begins with the letter "అ", the very first vowel in the Telugu alphabet.',
    encouragementQuote: '🌟 Hour 1 commenced! The foundation of a language begins with its phonetic soul!',
  },

  // HOUR 2 - GREETINGS & RESPECT
  {
    id: 'h2_en_te_1',
    hourNumber: 2,
    dayNumber: 4,
    topic: 'Respectful Greetings (నమస్కారం)',
    interestCategory: 'chat',
    knownLang: 'en',
    targetLang: 'te',
    level: 'beginner',
    focusWord: 'నమస్కారం',
    focusTransliteration: 'Namaskaram',
    focusMeaning: 'Hello / Greetings (Polite & Respectful)',
    focusCategory: 'Hour 2 · Essential Etiquette',
    focusTip: 'Fold hands gently at chest height to express warmth and respect to elders or strangers.',
    exampleSentenceTarget: 'నమస్కారం! మీరు ఎలా ఉన్నారు?',
    exampleSentenceTransliteration: 'Namaskaram! Meeru elaa unnaaru?',
    exampleSentenceMeaning: 'Hello! How are you doing?',
    exampleContextNote: '"Meeru" is the formal respectful form of "you".',
    challengeType: 'mcq',
    challengeQuestion: 'What is the polite Telugu word for "Hello / Greetings"?',
    options: ['ధన్యవాదాలు (Dhanyavadalu)', 'నమస్కారం (Namaskaram)', 'స్వాగతం (Swagatham)', 'సెలవు (Selavu)'],
    correctOptionIndex: 1,
    challengeExplanation: '"నమస్కారం (Namaskaram)" means greetings or hello. "ధన్యవాదాలు" means thank you.',
    encouragementQuote: '🌟 Hour 2 mastery in progress! Politeness is the golden key to Telugu culture.',
  },

  // HOUR 3 - DAILY VERBS & ACTIONS
  {
    id: 'h3_en_te_1',
    hourNumber: 3,
    dayNumber: 7,
    topic: 'Essential Action Verbs (రావడం & వెళ్లడం)',
    interestCategory: 'chat',
    knownLang: 'en',
    targetLang: 'te',
    level: 'beginner',
    focusWord: 'రండి / వెళ్లండి',
    focusTransliteration: 'Randi / Vellandi',
    focusMeaning: 'Please Come / Please Go (Respectful)',
    focusCategory: 'Hour 3 · Action Verbs',
    focusTip: 'Adding "-ndi" to a verb stem turns it into an instant polite request (Ra -> Randi).',
    exampleSentenceTarget: 'దయచేసి లోపలికి రండి.',
    exampleSentenceTransliteration: 'Dayachesi lopaliki randi.',
    exampleSentenceMeaning: 'Please come inside.',
    exampleContextNote: '"Lopaliki" means inside, and "Dayachesi" adds "please".',
    challengeType: 'scramble',
    challengeQuestion: 'Arrange in order: "Please come inside"',
    scrambleWords: ['రండి', 'దయచేసి', 'లోపలికి'],
    scrambleCorrectSentence: 'దయచేసి లోపలికి రండి',
    challengeExplanation: '"దయచేసి లోపలికి రండి (Dayachesi lopaliki randi)" is the formal way to invite someone inside.',
    encouragementQuote: '🌟 Hour 3 unlocked! You now know how to invite and address people politely!',
  },

  // HOUR 4 - NUMBERS, TIME & CALENDAR
  {
    id: 'h4_en_te_1',
    hourNumber: 4,
    dayNumber: 10,
    topic: 'Telling Time (సమయం ఎంత?)',
    interestCategory: 'shopping',
    knownLang: 'en',
    targetLang: 'te',
    level: 'beginner',
    focusWord: 'సమయం ఎంత అయింది?',
    focusTransliteration: 'Samayam entha ayindi?',
    focusMeaning: 'What time is it now?',
    focusCategory: 'Hour 4 · Time & Numbers',
    focusTip: '"Entha" means "how much" and "Samayam" means "time".',
    exampleSentenceTarget: 'ఇప్పుడు సమయం ఎంత అయింది? దయచేసి చెప్పండి.',
    exampleSentenceTransliteration: 'Ippudu samayam entha ayindi? Dayachesi cheppandi.',
    exampleSentenceMeaning: 'What time is it right now? Please tell me.',
    exampleContextNote: '"Ippudu" means right now / at present.',
    challengeType: 'fill_blank',
    challengeQuestion: 'Fill in the blank: "ఇప్పుడు _______ ఎంత అయింది?" (What time is it?)',
    blankSentence: 'ఇప్పుడు _______ ఎంత అయింది?',
    blankOptions: ['సమయం', 'దూరం', 'డబ్బు', 'ధర'],
    blankCorrectWord: 'సమయం',
    challengeExplanation: '"సమయం (Samayam)" means time. "దూరం" is distance and "డబ్బు" is money.',
    encouragementQuote: '🌟 Hour 4 mastered! Time waits for no one, but you are progressing with speed!',
  },

  // HOUR 6 - FOOD & DINING
  {
    id: 'h6_en_te_1',
    hourNumber: 6,
    dayNumber: 16,
    topic: 'Food & Hotel Ordering (భోజనం & ఆర్డరింగ్)',
    interestCategory: 'food',
    knownLang: 'en',
    targetLang: 'te',
    level: 'beginner',
    focusWord: 'ఆకలిగా ఉంది',
    focusTransliteration: 'Aakaligaa undi',
    focusMeaning: 'I am hungry / Hungry state',
    focusCategory: 'Hour 6 · Food & Dining',
    focusTip: 'Prefix with "Naaku" to say "I am hungry" -> "Naaku chaalaa aakaligaa undi".',
    exampleSentenceTarget: 'నాకు చాలా ఆకలిగా ఉంది, వేడి బిర్యానీ కావాలి.',
    exampleSentenceTransliteration: 'Naaku chaalaa aakaligaa undi, vedi biryani kaavali.',
    exampleSentenceMeaning: 'I am very hungry, I want hot biryani.',
    exampleContextNote: '"Kaavali" is one of the most useful words in Telugu, meaning "I want / needed".',
    challengeType: 'mcq',
    challengeQuestion: 'What does "నాకు వేడి టీ కావాలి" mean in English?',
    options: ['I want cold water', 'I want hot tea', 'I want spicy rice', 'I want breakfast'],
    correctOptionIndex: 1,
    challengeExplanation: '"వేడి టీ (Vedi tea)" = hot tea, and "కావాలి (Kaavali)" = I want.',
    encouragementQuote: '🌟 Hour 6 culinary fluency! You will never stay hungry in Hyderabad or Khammam!',
  },

  // HOUR 7 - TRAVEL & TRANSIT
  {
    id: 'h7_en_te_1',
    hourNumber: 7,
    dayNumber: 19,
    topic: 'Travel & Navigation (రైల్వే స్టేషన్ ఎక్కడ ఉంది?)',
    interestCategory: 'travel',
    knownLang: 'en',
    targetLang: 'te',
    level: 'intermediate',
    focusWord: 'ఎక్కడ ఉంది?',
    focusTransliteration: 'Ekkada undi?',
    focusMeaning: 'Where is it? / Where is...',
    focusCategory: 'Hour 7 · Travel & Commute',
    focusTip: 'Place any destination name before "ekkada undi" to ask for directions.',
    exampleSentenceTarget: 'రైల్వే స్టేషన్ ఎక్కడ ఉంది? బస్సు ఎప్పుడు వస్తుంది?',
    exampleSentenceTransliteration: 'Railway station ekkada undi? Bus eppudu vasthundi?',
    exampleSentenceMeaning: 'Where is the railway station? When will the bus arrive?',
    exampleContextNote: '"Eppudu" means when, and "vasthundi" means will arrive.',
    challengeType: 'fill_blank',
    challengeQuestion: 'Fill in the blank: "బస్టాండ్ _______ ఉంది?" (Where is the bus stand?)',
    blankSentence: 'బస్టాండ్ _______ ఉంది?',
    blankOptions: ['ఎక్కడ', 'ఎప్పుడు', 'ఎందుకు', 'ఎలా'],
    blankCorrectWord: 'ఎక్కడ',
    challengeExplanation: '"ఎక్కడ (Ekkada)" means where in Telugu.',
    encouragementQuote: '🌟 Hour 7 transit mastery! You can travel across Telangana & Andhra with confidence!',
  },

  // HOUR 8 - SHOPPING & BARGAINING
  {
    id: 'h8_en_te_1',
    hourNumber: 8,
    dayNumber: 22,
    topic: 'Shopping & Pricing (ధర ఎంత? / UPI)',
    interestCategory: 'shopping',
    knownLang: 'en',
    targetLang: 'te',
    level: 'beginner',
    focusWord: 'ధర ఎంత? / రేటు ఎంత?',
    focusTransliteration: 'Dhara entha? / Rate entha?',
    focusMeaning: 'How much does it cost? / What is the price?',
    focusCategory: 'Hour 8 · Commerce & Shopping',
    focusTip: 'Add "కొంచెం తగ్గించండి (Konchem thagginchandi)" to ask for a friendly discount.',
    exampleSentenceTarget: 'ఈ వస్తువు ధర ఎంత? ఆన్‌లైన్ లేదా UPI పేమెంట్ ఉందా?',
    exampleSentenceTransliteration: 'Ee vasthuvu dhara entha? Online ledaa UPI payment undaa?',
    exampleSentenceMeaning: 'What is the price of this item? Is online or UPI payment available?',
    exampleContextNote: '"Undaa?" at the end turns any statement into a question ("Is it there?").',
    challengeType: 'mcq',
    challengeQuestion: 'How do you ask "What is the price?" in Telugu?',
    options: ['సమయం ఎంత? (Samayam entha?)', 'ధర ఎంత? (Dhara entha?)', 'పేరేమిటి? (Peremiti?)', 'ఎక్కడ ఉంది? (Ekkada undi?)'],
    correctOptionIndex: 1,
    challengeExplanation: '"ధర ఎంత? (Dhara entha?)" means how much does it cost.',
    encouragementQuote: '🌟 Hour 8 commerce unlocked! You can shop like a local anywhere!',
  },

  // HOUR 9 - HEALTH & EMERGENCY
  {
    id: 'h9_en_te_1',
    hourNumber: 9,
    dayNumber: 25,
    topic: 'Doctor & Symptoms (నాకు ఒంట్లో బాగోలేదు)',
    interestCategory: 'health',
    knownLang: 'en',
    targetLang: 'te',
    level: 'intermediate',
    focusWord: 'ఒంట్లో బాగోలేదు / జ్వరం',
    focusTransliteration: 'Ontlo baagoledu / Jwaram',
    focusMeaning: 'I am not feeling well / Fever',
    focusCategory: 'Hour 9 · Health & Emergency',
    focusTip: '"Ontlo baagoledu" is the universal polite phrase for feeling unwell or sick.',
    exampleSentenceTarget: 'నాకు తీవ్రమైన జ్వరం వచ్చింది, దగ్గర్లోని డాక్టర్ ఎక్కడ ఉంటారు?',
    exampleSentenceTransliteration: 'Naaku theevramaina jwaram vachindi, daggarloni doctor ekkada untaaru?',
    exampleSentenceMeaning: 'I have a high fever, where can I find a doctor nearby?',
    exampleContextNote: '"Daggarloni" means nearby / in the vicinity.',
    challengeType: 'mcq',
    challengeQuestion: 'What is the Telugu word for "Fever"?',
    options: ['జ్వరం (Jwaram)', 'కడుపు నొప్పి (Kadupu noppi)', 'దగ్గు (Daggu)', 'జలుబు (Jalubu)'],
    correctOptionIndex: 0,
    challengeExplanation: '"జ్వరం (Jwaram)" means fever, "దగ్గు" is cough, and "జలుబు" is cold.',
    encouragementQuote: '🌟 Hour 9 health mastery! Staying safe and articulating health needs is essential!',
  },

  // HOUR 10 - WORKPLACE & JOB INTERVIEWS
  {
    id: 'h10_en_te_1',
    hourNumber: 10,
    dayNumber: 28,
    topic: 'Job Interview & Career (పరిచయం & నైపుణ్యాలు)',
    interestCategory: 'interview',
    knownLang: 'en',
    targetLang: 'te',
    level: 'intermediate',
    focusWord: 'నా అనుభవం / నా నైపుణ్యాలు',
    focusTransliteration: 'Naa anubhavamu / Naa naipunyaalu',
    focusMeaning: 'My work experience / My skills',
    focusCategory: 'Hour 10 · Professional & Career',
    focusTip: 'Used when introducing your background during a professional interview.',
    exampleSentenceTarget: 'నా పేరు నరసింహ, నాకు సాఫ్ట్‌వేర్ డెవలప్‌మెంట్‌లో మూడేళ్ల అనుభవం ఉంది.',
    exampleSentenceTransliteration: 'Naa peru Narasimha, naaku software development lo moodella anubhavam undi.',
    exampleSentenceMeaning: 'My name is Narasimha, I have 3 years of experience in software development.',
    exampleContextNote: '"Moodella" combines Moodu (3) + Ella (years).',
    challengeType: 'scramble',
    challengeQuestion: 'Arrange in order: "My name is John"',
    scrambleWords: ['జాన్', 'నా', 'పేరు'],
    scrambleCorrectSentence: 'నా పేరు జాన్',
    challengeExplanation: 'Sentence structure: "నా పేరు జాన్ (Naa peru John)".',
    encouragementQuote: '🌟 Hour 10 professional fluency! Ace any meeting or interview with poise!',
  },

  // HOUR 13 - LOCAL SLANG & IDIOMS
  {
    id: 'h13_en_te_1',
    hourNumber: 13,
    dayNumber: 37,
    topic: 'Telugu Proverbs (సామెతలు & జాతీయాలు)',
    interestCategory: 'slang',
    knownLang: 'en',
    targetLang: 'te',
    level: 'intermediate',
    focusWord: 'చేతులు కాలాక ఆకులు పట్టుకున్నట్లు',
    focusTransliteration: 'Chethulu kaalaaka aakulu pattukunnattu',
    focusMeaning: 'Locking the barn door after the horse has bolted (Taking precautions too late)',
    focusCategory: 'Hour 13 · Proverbs & Culture',
    focusTip: 'A legendary Telugu proverb used when someone acts only after damage has occurred.',
    exampleSentenceTarget: 'సమయం ఉన్నప్పుడే నేర్చుకోవాలి, లేకుంటే చేతులు కాలాక ఆకులు పట్టుకున్నట్లే అవుతుంది.',
    exampleSentenceTransliteration: 'Samayam unnappude nerchukovaali, lekunthe chethulu kaalaaka aakulu pattukunnattle avuthundi.',
    exampleSentenceMeaning: 'We must learn while there is time, otherwise it is like holding leaves after hands are burnt.',
    exampleContextNote: '"Nerchukovaali" means must learn / should study.',
    challengeType: 'mcq',
    challengeQuestion: 'What does the famous Telugu proverb "చేతులు కాలాక ఆకులు పట్టుకున్నట్లు" teach?',
    options: ['Cooking food carefully', 'Acting before it is too late', 'Planting trees in summer', 'Washing hands with water'],
    correctOptionIndex: 1,
    challengeExplanation: 'It warns against waiting until after disaster strikes to take action.',
    encouragementQuote: '🌟 Hour 13 wit & cultural wisdom! You speak like an authentic native orator!',
  },

  // HOUR 14 - FLUENCY MASTERY & CERTIFICATION
  {
    id: 'h14_en_te_1',
    hourNumber: 14,
    dayNumber: 42,
    topic: '14-Hour Fluency Milestone & Dialogue Simulation',
    interestCategory: 'interview',
    knownLang: 'en',
    targetLang: 'te',
    level: 'intermediate',
    focusWord: 'ధారాళంగా మాట్లాడటం',
    focusTransliteration: 'Dhaaralangaa maatlaadatam',
    focusMeaning: 'Speaking fluently / Articulate spontaneous flow',
    focusCategory: 'Hour 14 · Full Fluency Master',
    focusTip: 'You have completed all 14 Hours of structured immersion by @GKEDIT2141!',
    exampleSentenceTarget: 'నేను ఇప్పుడు తెలుగులో స్పష్టంగా మరియు ధైర్యంగా మాట్లాడగలను.',
    exampleSentenceTransliteration: 'Nenu ippudu Telugulo spashtangaa mariyu dhairyangaa maatlaadagalanu.',
    exampleSentenceMeaning: 'I can now speak in Telugu clearly and with supreme confidence.',
    exampleContextNote: '"Dhairyangaa" means courageously / with confidence.',
    challengeType: 'mcq',
    challengeQuestion: 'Which phrase means "I can speak clearly and confidently"?',
    options: ['నేను నిద్రపోతున్నాను', 'నేను స్పష్టంగా మాట్లాడగలను', 'నాకు తెలియదు', 'ఇక్కడ కూర్చోండి'],
    correctOptionIndex: 1,
    challengeExplanation: '"నేను స్పష్టంగా మాట్లాడగలను" translates to "I can speak clearly".',
    encouragementQuote: '🏆 CONGRATULATIONS! You completed the 14-Hour GK Learning Master Course by @GKEDIT2141!',
  },

  // TELUGU -> ENGLISH (Hour 2 Sample)
  {
    id: 'h2_te_en_1',
    hourNumber: 2,
    dayNumber: 5,
    topic: 'ఇంగ్లీష్ పలకరింపులు (Greetings & Courtesy)',
    interestCategory: 'chat',
    knownLang: 'te',
    targetLang: 'en',
    level: 'beginner',
    focusWord: 'Good Morning / Good Day',
    focusTransliteration: 'గుడ్ మార్నింగ్ / హావ్ ఎ గుడ్ డే',
    focusMeaning: 'శుభోదయం / ఈ రోజు మీకు మంచి జరగాలి',
    focusCategory: 'Hour 2 · రోజువారీ పలకరింపు',
    focusTip: 'ఉదయం 12 గంటల వరకు ఎవరినైనా ఉత్సాహంగా పలకరించడానికి వాడతారు.',
    exampleSentenceTarget: 'Good morning! It is wonderful to meet you.',
    exampleSentenceTransliteration: 'గుడ్ మార్నింగ్! ఇట్ ఈజ్ వండర్‌ఫుల్ టు మీట్ యు.',
    exampleSentenceMeaning: 'శుభోదయం! మిమ్మల్ని కలవడం చాలా సంతోషంగా ఉంది.',
    exampleContextNote: 'కొత్త పరిచయస్తులతో మాట్లాడేటప్పుడు ఇది వాడండి.',
    challengeType: 'mcq',
    challengeQuestion: '"శుభోదయం" కు సరైన ఇంగ్లీష్ పదం ఏమిటి?',
    options: ['Good Night', 'Good Morning', 'Good Bye', 'Excuse Me'],
    correctOptionIndex: 1,
    challengeExplanation: '"Good Morning" అంటే శుభోదయం.',
    encouragementQuote: '🌟 అద్భుతం! రోజుకు 2 నిమిషాలు ప్రాక్టీస్ చేస్తే 14 గంటల్లో సంపూర్ణ ఫ్లూయెన్సీ సాధ్యం!',
  },

  // ENGLISH -> HINDI (Hour 2 Sample)
  {
    id: 'h2_en_hi_1',
    hourNumber: 2,
    dayNumber: 6,
    topic: 'Respectful Greetings (नमस्ते / आप कैसे हैं?)',
    interestCategory: 'chat',
    knownLang: 'en',
    targetLang: 'hi',
    level: 'beginner',
    focusWord: 'नमस्ते / प्रणाम',
    focusTransliteration: 'Namaste / Pranaam',
    focusMeaning: 'Hello / Greetings (Polite & Universal)',
    focusCategory: 'Hour 2 · Cultural Greetings',
    focusTip: 'Fold hands with a gentle bow to greet anyone with highest respect.',
    exampleSentenceTarget: 'नमस्ते! आप कैसे हैं? सब ठीक-ठाक है?',
    exampleSentenceTransliteration: 'Namaste! Aap kaise hain? Sab theek-thaak hai?',
    exampleSentenceMeaning: 'Hello! How are you? Is everything alright?',
    exampleContextNote: '"Theek-thaak" means alright or good.',
    challengeType: 'mcq',
    challengeQuestion: 'What is the polite Hindi phrase for "How are you?"',
    options: ['आप कौन हैं? (Aap kaun hain?)', 'आप कैसे हैं? (Aap kaise hain?)', 'कहाँ जा रहे हैं? (Kahan ja rahe hain?)', 'क्या बात है? (Kya baat hai?)'],
    correctOptionIndex: 1,
    challengeExplanation: '"आप कैसे हैं? (Aap kaise hain?)" means "How are you?".',
    encouragementQuote: '🌟 Hour 2 progress! 14 hours of Hindi immersion makes you conversational fast!',
  },
];

interface GKLearningToolProps {
  onBack?: () => void;
  onNavigateToChat?: (prompt: string) => void;
}

export function GKLearningTool({ onBack, onNavigateToChat }: GKLearningToolProps) {
  // 1. Learning Mode: 'daily' (Paced 1 lesson/day - 42 Day Plan) vs 'custom' (By User Interest)
  const [learningMode, setLearningMode] = useState<LearningMode>(() => {
    return (localStorage.getItem('gk_learning_mode') as LearningMode) || 'daily';
  });

  // 2. Language & Level Preferences
  const [knownLang, setKnownLang] = useState<LanguageCode>(() => {
    return (localStorage.getItem('gk_learning_known_lang') as LanguageCode) || 'en';
  });
  const [targetLang, setTargetLang] = useState<LanguageCode>(() => {
    return (localStorage.getItem('gk_learning_target_lang') as LanguageCode) || 'te';
  });
  const [level, setLevel] = useState<Level>(() => {
    return (localStorage.getItem('gk_learning_level') as Level) || 'beginner';
  });

  // 3. 14-Hour Course Telemetry
  // 14 Hours total = 840 total learning minutes
  const [cumulativeMinutes, setCumulativeMinutes] = useState<number>(() => {
    return parseFloat(localStorage.getItem('gk_learning_minutes') || '36'); // Default 36 mins (~0.6 hrs completed)
  });
  const totalCourseHours = 14.0;
  const completedHours = (cumulativeMinutes / 60).toFixed(1);
  const progressPercent = Math.min(100, Math.round((cumulativeMinutes / (14 * 60)) * 100));

  // 4. Daily Roadmap (Day 1 to 42)
  const [currentDay, setCurrentDay] = useState<number>(() => {
    return parseInt(localStorage.getItem('gk_learning_current_day') || '1', 10);
  });
  const [selectedInterestCategory, setSelectedInterestCategory] = useState<string>('all');
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // 5. Gamification & Streak State
  const [streak, setStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem('gk_learning_streak') || '4', 10);
  });
  const [xp, setXp] = useState<number>(() => {
    return parseInt(localStorage.getItem('gk_learning_xp') || '165', 10);
  });
  const [hearts, setHearts] = useState<number>(3);
  const [isCompletedToday, setIsCompletedToday] = useState<boolean>(() => {
    const lastDate = localStorage.getItem('gk_learning_last_completed_date');
    return lastDate === new Date().toISOString().split('T')[0];
  });

  // 6. Active Lesson Index & Filter
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);

  // 7. Interactive Challenge State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedWordOrder, setSelectedWordOrder] = useState<string[]>([]);
  const [selectedBlankWord, setSelectedBlankWord] = useState<string | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  // 8. Audio Voice Synthesis State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // 9. 5:00 PM Daily Reminder State
  const [reminderScheduled, setReminderScheduled] = useState<boolean>(() => {
    return localStorage.getItem('gk_learning_5pm_reminder') === 'true';
  });
  const [timeUntil5pm, setTimeUntil5pm] = useState<string>('');

  // 10. Custom Topic AI Generator
  const [customInterestQuery, setCustomInterestQuery] = useState<string>('');

  // Filter lessons based on active mode, languages and category
  const filteredLessons = COMPREHENSIVE_LESSONS.filter((l) => {
    const langMatch = l.knownLang === knownLang && l.targetLang === targetLang;
    if (learningMode === 'daily') {
      return langMatch;
    } else {
      const categoryMatch =
        selectedInterestCategory === 'all' || l.interestCategory === selectedInterestCategory;
      const hourMatch = selectedHour === null || l.hourNumber === selectedHour;
      return langMatch && categoryMatch && hourMatch;
    }
  });

  // Fallback to general list if filter empty
  const activeLessonsPool = filteredLessons.length > 0 ? filteredLessons : COMPREHENSIVE_LESSONS;
  const currentLesson =
    activeLessonsPool[activeLessonIndex % activeLessonsPool.length] || COMPREHENSIVE_LESSONS[0];

  // Save states
  useEffect(() => {
    localStorage.setItem('gk_learning_mode', learningMode);
    localStorage.setItem('gk_learning_known_lang', knownLang);
    localStorage.setItem('gk_learning_target_lang', targetLang);
    localStorage.setItem('gk_learning_level', level);
    localStorage.setItem('gk_learning_streak', streak.toString());
    localStorage.setItem('gk_learning_xp', xp.toString());
    localStorage.setItem('gk_learning_minutes', cumulativeMinutes.toString());
    localStorage.setItem('gk_learning_current_day', currentDay.toString());
  }, [learningMode, knownLang, targetLang, level, streak, xp, cumulativeMinutes, currentDay]);

  // Reset challenge on lesson change
  useEffect(() => {
    setSelectedOption(null);
    setSelectedWordOrder([]);
    setSelectedBlankWord(null);
    setChallengeStatus('idle');
    setHasAnswered(false);
  }, [activeLessonIndex, learningMode, selectedInterestCategory, selectedHour, knownLang, targetLang]);

  // Live 5:00 PM countdown ticker
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(17, 0, 0, 0); // 5:00 PM

      if (now.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diffMs = target.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntil5pm(`${diffHours}h ${diffMins}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  // Web Speech API Voice synthesis helper
  const handleSpeakText = (text: string, langCode: LanguageCode, slow: boolean = false) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (langCode === 'te') {
      utterance.lang = 'te-IN';
    } else if (langCode === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = slow ? 0.75 : 1.0;
    utterance.pitch = 1.0;

    setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  // Toggle 5:00 PM Daily Reminder
  const handleToggle5pmReminder = () => {
    if (reminderScheduled) {
      localStorage.removeItem('gk_learning_5pm_reminder');
      setReminderScheduled(false);
      notificationService.showInAppToast(
        'Reminder Turned Off',
        'Daily 5:00 PM GK Learning reminder has been deactivated.',
        'info'
      );
    } else {
      localStorage.setItem('gk_learning_5pm_reminder', 'true');
      setReminderScheduled(true);

      const targetTime = new Date();
      targetTime.setHours(17, 0, 0, 0);
      if (Date.now() > targetTime.getTime()) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      reminderService.addReminder(
        '⏰ Daily GK Learning session is ready every day at 5:00 PM! Just 2 minutes to level up your skills.',
        targetTime.getTime(),
        'daily'
      );

      notificationService.playSoftChime();
      notificationService.showInAppToast(
        '⏰ Daily 5:00 PM Reminder Set!',
        'You will receive an alert every day at 5:00 PM for your 2-minute session.',
        'success'
      );
    }
  };

  // Check Challenge Answer
  const handleCheckAnswer = () => {
    if (hasAnswered) return;

    let isCorrect = false;

    if (currentLesson.challengeType === 'mcq') {
      isCorrect = selectedOption === currentLesson.correctOptionIndex;
    } else if (currentLesson.challengeType === 'scramble') {
      const sentence = selectedWordOrder.join(' ');
      isCorrect = sentence.trim() === (currentLesson.scrambleCorrectSentence || '').trim();
    } else if (currentLesson.challengeType === 'fill_blank') {
      isCorrect = selectedBlankWord === currentLesson.blankCorrectWord;
    }

    setHasAnswered(true);

    if (isCorrect) {
      setChallengeStatus('correct');
      notificationService.playSoftChime();

      // Add 2 minutes of active study time to cumulative 14 hours
      setCumulativeMinutes((prev) => Math.min(14 * 60, prev + 2));
      setXp((prev) => prev + 15);

      if (!isCompletedToday) {
        setStreak((prev) => prev + 1);
        setIsCompletedToday(true);
        localStorage.setItem(
          'gk_learning_last_completed_date',
          new Date().toISOString().split('T')[0]
        );
      }

      // If in daily mode, advance current day
      if (learningMode === 'daily') {
        setCurrentDay((prev) => Math.min(42, prev + 1));
      }
    } else {
      setChallengeStatus('incorrect');
      setHearts((prev) => Math.max(1, prev - 1));
    }
  };

  // Next Lesson
  const handleNextLesson = () => {
    setActiveLessonIndex((prev) => prev + 1);
  };

  // Share Progress
  const handleShareProgress = () => {
    const text = `🔥 GK Learning 14-Hour Master Course Progress (by @GKEDIT2141):\n• Hours Completed: ${completedHours} / 14.0 Hours (${progressPercent}%)\n• Streak: ${streak} Days\n• Total XP: ${xp}\n• Mode: ${learningMode === 'daily' ? 'Daily 1 Lesson (Day ' + currentDay + '/42)' : 'Custom Interest Exploration'}\nReady every day at 5:00 PM!`;
    navigator.clipboard.writeText(text);
    notificationService.showInAppToast(
      'Progress Copied!',
      'Share your 14-Hour progress with friends!',
      'success'
    );
  };

  const getLanguageName = (code: LanguageCode): string => {
    switch (code) {
      case 'te':
        return 'Telugu (తెలుగు)';
      case 'hi':
        return 'Hindi (हिंदी)';
      case 'en':
      default:
        return 'English';
    }
  };

  const handleSelectKnownLang = (code: LanguageCode) => {
    setKnownLang(code);
    if (targetLang === code) {
      const alternatives: LanguageCode[] = ['en', 'te', 'hi'];
      const nextTarget = alternatives.find((c) => c !== code) || 'te';
      setTargetLang(nextTarget);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* =========================================================================
          TOP HERO: 14-HOUR MASTER COURSE & GAMIFIED STATUS
      ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#02130e] via-[#051f15] to-[#011424] border border-emerald-500/40 p-5 sm:p-7 shadow-[0_15px_45px_rgba(2,20,15,0.7)]">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-lime-400 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.45)]">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Languages className="w-7 h-7 text-emerald-400 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-black text-slate-950 items-center justify-center">
                  14h
                </span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-black tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  14-HOUR MASTER CURRICULUM
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  by @GKEDIT2141
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>GK Learning Engine</span>
                <span className="text-emerald-400 text-sm font-semibold hidden sm:inline">
                  · 14 Hours Complete Course
                </span>
              </h1>
              <p className="text-xs text-slate-300 line-clamp-1">
                Daily 1 lesson or custom based on your interest across English, Telugu & Hindi.
              </p>
            </div>
          </div>

          {/* Gamification Stats: 14h Progress, Streak, XP, Hearts */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap self-end sm:self-center">
            {/* Total 14h Course Progress */}
            <div
              onClick={() => setShowCertificateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer hover:border-emerald-300 transition"
              title="Click to view 14-Hour Course Certificate"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <span className="text-xs font-black font-mono">{completedHours} / 14h</span>
                <span className="text-[9px] font-bold text-emerald-400 ml-1">({progressPercent}%)</span>
              </div>
            </div>

            {/* Streak Counter */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all ${
                isCompletedToday
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
              title="Daily Streak"
            >
              <Flame className={`w-4 h-4 ${isCompletedToday ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
              <div className="text-left">
                <span className="text-xs font-black font-mono">{streak}</span>
                <span className="text-[9px] font-bold uppercase ml-1">Days</span>
              </div>
            </div>

            {/* XP Points */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300">
              <Zap className="w-4 h-4 text-cyan-400" />
              <div className="text-left">
                <span className="text-xs font-black font-mono">{xp}</span>
                <span className="text-[9px] font-bold uppercase ml-1">XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* 14-Hour Progress Bar Meter */}
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              14-Hour Fluency Journey: <strong className="text-emerald-300">{completedHours} of 14.0 Hours</strong> completed
            </span>
            <span className="text-amber-300 font-bold">{progressPercent}% Mastered</span>
          </div>
          <div className="w-full bg-slate-900/90 rounded-full h-2.5 overflow-hidden border border-white/10 p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_#10b981]"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* =========================================================================
            DAILY 5:00 PM SCHEDULE & NOTIFICATION REMINDER BANNER
        ========================================================================= */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900/80 to-teal-950/70 border border-emerald-400/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  ⏰ Daily GK Learning session is ready every day at 5:00 PM!
                </span>
                <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {timeUntil5pm ? `In ${timeUntil5pm}` : 'Daily 5 PM'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Just 2 minutes to level up your skills. Total 14 hours structured curriculum.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle5pmReminder}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              reminderScheduled
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${reminderScheduled ? 'fill-slate-950' : ''}`} />
            <span>{reminderScheduled ? 'Reminder ON (5 PM)' : 'Set 5 PM Alert'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PRIMARY MODE SELECTOR: DAILY 1 LESSON vs CUSTOM USER INTEREST
      ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#041029]/80 border border-cyan-500/30 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Select Your Learning Pace & Mode
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Daily 1 Lesson (42 Days) OR Custom by Interest
          </span>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLearningMode('daily')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
              learningMode === 'daily'
                ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${learningMode === 'daily' ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-300'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <span>Daily 1 Lesson Mode</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  PACED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                1 lesson every day at 5:00 PM · 42-day roadmap to 14 hours
              </p>
            </div>
          </button>

          <button
            onClick={() => setLearningMode('custom')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
              learningMode === 'custom'
                ? 'bg-purple-500/25 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${learningMode === 'custom' ? 'bg-purple-500 text-slate-950' : 'bg-white/10 text-slate-300'}`}>
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <span>Custom / By User Interest</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono">
                  FREE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Learn any topic anytime (Travel, Food, Interview, Slang...)
              </p>
            </div>
          </button>
        </div>

        {/* Language Selection Config */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* 1. Known Language */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              1. Known Language (Native / Interface):
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['en', 'te', 'hi'] as LanguageCode[]).map((lang) => (
                <button
                  key={`known_${lang}`}
                  onClick={() => handleSelectKnownLang(lang)}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                    knownLang === lang
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'English' : lang === 'te' ? 'తెలుగు' : 'हिंदी'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Target Learning Language */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              2. Learning Language (Target):
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['en', 'te', 'hi'] as LanguageCode[]).map((lang) => {
                const isDisabled = knownLang === lang;
                return (
                  <button
                    key={`target_${lang}`}
                    disabled={isDisabled}
                    onClick={() => setTargetLang(lang)}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      targetLang === lang
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : isDisabled
                        ? 'bg-white/5 border-white/5 text-slate-600 opacity-40 cursor-not-allowed'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'te' ? 'తెలుగు' : 'हिंदी'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Level */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              3. Current Level:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['beginner', 'intermediate'] as Level[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center capitalize cursor-pointer ${
                    level === lvl
                      ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CUSTOM MODE: INTEREST CATEGORY FILTER PILLS */}
        {learningMode === 'custom' && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span>Choose Your Interest Topic:</span>
              <span className="text-purple-400 text-[11px] font-mono">
                {selectedInterestCategory.toUpperCase()} FILTER
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-1">
              {INTEREST_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedInterestCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedInterestCategory(cat.id);
                      setSelectedHour(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DAILY MODE: 42-DAY ROADMAP PREVIEW PILL ROW */}
        {learningMode === 'daily' && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-300">
                Daily Paced Track: Day {currentDay} of 42
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                1 Lesson Every Day at 5:00 PM
              </span>
            </div>
            {/* Scrollable Day Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-1">
              {Array.from({ length: 42 }).map((_, i) => {
                const dayNum = i + 1;
                const isUnlocked = dayNum <= currentDay;
                const isCurrent = dayNum === currentDay;
                return (
                  <button
                    key={dayNum}
                    onClick={() => {
                      if (isUnlocked) {
                        setActiveLessonIndex(dayNum - 1);
                      }
                    }}
                    disabled={!isUnlocked}
                    className={`w-9 h-9 rounded-xl text-xs font-bold font-mono border transition flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_12px_#10b981] font-black'
                        : isUnlocked
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 cursor-pointer hover:bg-emerald-900/60'
                        : 'bg-white/5 border-white/5 text-slate-600 opacity-40 cursor-not-allowed'
                    }`}
                    title={isUnlocked ? `Day ${dayNum} - Available` : `Day ${dayNum} - Locked`}
                  >
                    {isUnlocked ? dayNum : <Lock className="w-3 h-3 text-slate-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          THE EXACT 4-PART MICRO-LEARNING CARD (DUOLINGO STYLE)
      ========================================================================= */}
      <div className="rounded-3xl bg-[#030d22]/90 border border-emerald-500/35 overflow-hidden shadow-2xl space-y-6 p-5 sm:p-7">
        
        {/* Top Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-emerald-400 flex items-center gap-1.5 font-mono">
              <Zap className="w-3.5 h-3.5" />
              HOUR {currentLesson.hourNumber} · {currentLesson.topic}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {learningMode === 'daily' ? `Day ${currentLesson.dayNumber} / 42` : `Interest: ${currentLesson.interestCategory.toUpperCase()}`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 h-2.5">
            <div className="bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]" title="Part 1: Focus" />
            <div className="bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]" title="Part 2: Context" />
            <div
              className={`rounded-full transition-all duration-300 ${
                hasAnswered ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-emerald-500/30'
              }`}
              title="Part 3: Challenge"
            />
            <div
              className={`rounded-full transition-all duration-300 ${
                challengeStatus === 'correct' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-white/10'
              }`}
              title="Part 4: Streak"
            />
          </div>
        </div>

        {/* -------------------------------------------------------------
            PART 1: 🎯 TODAY'S FOCUS (Word / Phrase + Meaning)
        ------------------------------------------------------------- */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#061e16]/90 to-[#031526]/90 border border-emerald-500/30 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">🎯</span>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-emerald-300">
                Part 1: Today's Focus
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              Hour {currentLesson.hourNumber} · {currentLesson.focusCategory}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                {currentLesson.focusWord}
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
                Pronunciation: [{currentLesson.focusTransliteration}]
              </div>
              <div className="text-sm sm:text-base text-slate-200 font-semibold pt-1">
                Meaning: <span className="text-cyan-300 font-bold">{currentLesson.focusMeaning}</span>
              </div>
            </div>

            {/* Audio Voice Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSpeakText(currentLesson.focusWord, currentLesson.targetLang, false)}
                className="p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                title="Listen to native pronunciation"
              >
                <Volume2 className="w-5 h-5" />
                <span className="text-xs font-bold">Listen</span>
              </button>
              <button
                onClick={() => handleSpeakText(currentLesson.focusWord, currentLesson.targetLang, true)}
                className="px-2.5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono font-bold transition cursor-pointer"
                title="Slow audio (0.75x speed)"
              >
                0.75x
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2">
            <span className="text-emerald-400 font-bold">💡 Tip:</span>
            <span>{currentLesson.focusTip}</span>
          </div>
        </div>

        {/* -------------------------------------------------------------
            PART 2: 💡 CONTEXT / EXAMPLE (Real-life usage)
        ------------------------------------------------------------- */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#031526]/90 to-[#041a2f]/90 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">💡</span>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-cyan-300">
                Part 2: Context / Real-Life Example
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              1-2 Conversational Sentences
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/25 space-y-2">
            <div className="text-base sm:text-lg font-bold text-white leading-relaxed">
              "{currentLesson.exampleSentenceTarget}"
            </div>
            <div className="text-xs font-mono text-cyan-300">
              Phonetics: [{currentLesson.exampleSentenceTransliteration}]
            </div>
            <div className="text-xs sm:text-sm text-slate-300 pt-1 border-t border-white/10">
              Translation: <span className="text-slate-100 font-semibold">{currentLesson.exampleSentenceMeaning}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs text-slate-400 italic">
              {currentLesson.exampleContextNote}
            </p>
            <button
              onClick={() => handleSpeakText(currentLesson.exampleSentenceTarget, currentLesson.targetLang)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-auto"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Hear Sentence</span>
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------
            PART 3: ⚡ QUICK CHALLENGE (Interactive task)
        ------------------------------------------------------------- */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#120824]/90 to-[#031526]/90 border border-purple-500/35 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">⚡</span>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-purple-300">
                Part 3: Quick Challenge
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
              +15 XP · +2 Mins Study Time
            </span>
          </div>

          <div className="text-sm sm:text-base font-bold text-white">
            {currentLesson.challengeQuestion}
          </div>

          {/* MCQ Challenge Mode */}
          {currentLesson.challengeType === 'mcq' && currentLesson.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentLesson.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentLesson.correctOptionIndex;
                let btnStyle = 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10';

                if (hasAnswered) {
                  if (isCorrect) {
                    btnStyle =
                      'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-rose-500/30 border-rose-400 text-rose-200';
                  } else {
                    btnStyle = 'bg-white/5 border-white/5 text-slate-500 opacity-50';
                  }
                } else if (isSelected) {
                  btnStyle =
                    'bg-purple-500/30 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.4)]';
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnswered}
                    onClick={() => setSelectedOption(idx)}
                    className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-bold transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {hasAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Word Scramble Challenge Mode */}
          {currentLesson.challengeType === 'scramble' && currentLesson.scrambleWords && (
            <div className="space-y-3">
              <div className="min-h-12 p-3 rounded-xl bg-slate-950/70 border border-purple-500/30 flex items-center gap-2 flex-wrap">
                {selectedWordOrder.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">Tap words below to arrange the sentence...</span>
                ) : (
                  selectedWordOrder.map((word, idx) => (
                    <button
                      key={idx}
                      disabled={hasAnswered}
                      onClick={() => {
                        setSelectedWordOrder((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/30 border border-purple-400 text-purple-200 text-xs font-bold hover:bg-purple-500/40 transition cursor-pointer"
                    >
                      {word} ✕
                    </button>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {currentLesson.scrambleWords.map((word, idx) => {
                  const isUsed = selectedWordOrder.includes(word);
                  return (
                    <button
                      key={idx}
                      disabled={isUsed || hasAnswered}
                      onClick={() => setSelectedWordOrder((prev) => [...prev, word])}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                        isUsed
                          ? 'bg-white/5 border-white/5 text-slate-600 opacity-40 cursor-not-allowed'
                          : 'bg-white/10 hover:bg-purple-500/20 border-white/20 hover:border-purple-400 text-slate-200'
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fill in the Blanks Challenge Mode */}
          {currentLesson.challengeType === 'fill_blank' && currentLesson.blankOptions && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/30 text-base font-bold text-white">
                {currentLesson.blankSentence?.replace(
                  '_______',
                  selectedBlankWord ? `[${selectedBlankWord}]` : '_______'
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentLesson.blankOptions.map((opt, idx) => {
                  const isSelected = selectedBlankWord === opt;
                  const isCorrect = opt === currentLesson.blankCorrectWord;
                  let style = 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10';

                  if (hasAnswered) {
                    if (isCorrect) {
                      style = 'bg-emerald-500/30 border-emerald-400 text-emerald-200';
                    } else if (isSelected) {
                      style = 'bg-rose-500/30 border-rose-400 text-rose-200';
                    }
                  } else if (isSelected) {
                    style = 'bg-purple-500/30 border-purple-400 text-purple-200';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnswered}
                      onClick={() => setSelectedBlankWord(opt)}
                      className={`p-2.5 rounded-xl border text-xs sm:text-sm font-bold text-center transition cursor-pointer ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Check Answer Button & Feedback */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {!hasAnswered ? (
              <button
                onClick={handleCheckAnswer}
                disabled={
                  (currentLesson.challengeType === 'mcq' && selectedOption === null) ||
                  (currentLesson.challengeType === 'scramble' && selectedWordOrder.length === 0) ||
                  (currentLesson.challengeType === 'fill_blank' && selectedBlankWord === null)
                }
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Check Answer
              </button>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {challengeStatus === 'correct' ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>Correct! +15 XP & +2 mins toward 14 Hours!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs sm:text-sm">
                      <XCircle className="w-5 h-5 shrink-0" />
                      <span>Not quite. Check explanation below!</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNextLesson}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
                >
                  <span>Next Lesson</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Challenge Explanation */}
          {hasAnswered && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-300">
              <span className="font-bold text-cyan-300 block mb-1">Explanation:</span>
              {currentLesson.challengeExplanation}
            </div>
          )}
        </div>

        {/* -------------------------------------------------------------
            PART 4: 🌟 STREAK & ENCOURAGEMENT
        ------------------------------------------------------------- */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#0a1a15]/80 to-emerald-950/30 border border-amber-500/35 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">🌟</span>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-amber-300">
                Part 4: Streak & Encouragement
              </h2>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{streak} Day Streak Active · {completedHours}h Total</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                {currentLesson.encouragementQuote}
              </p>
              <p className="text-xs text-slate-400">
                Daily 1 lesson or custom exploration: 14 hours total transforms you into a natural bilingual speaker!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleShareProgress}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Share Streak Card"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Share</span>
              </button>
              <button
                onClick={handleNextLesson}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          THE 14-HOUR MASTER SYLLABUS DIRECTORY BROWSER
      ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#040e24]/90 border border-emerald-500/35 shadow-lg space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              14h
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                14-Hour Master Course Curriculum
              </h3>
              <p className="text-[11px] text-slate-400">
                Browse all 14 structured hours. Tap any hour to jump directly into lessons for that domain.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
            TOTAL 14 HOURS • 840 MINS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COURSE_HOURS.map((hour) => {
            const isSelected = selectedHour === hour.hourNumber;
            return (
              <div
                key={hour.hourNumber}
                onClick={() => {
                  setLearningMode('custom');
                  setSelectedHour(hour.hourNumber);
                  setSelectedInterestCategory(hour.interestTag);
                  setActiveLessonIndex(0);
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer group flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 border-white/10 hover:border-emerald-500/40 hover:bg-white/[0.07]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition">
                    {hour.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                        {hour.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 block font-medium">
                      {hour.teluguTitle}
                    </span>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {hour.description}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-400 shrink-0 self-center">
                  60m
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          CUSTOM AI 2-MINUTE LESSON GENERATOR ON ANY USER INTEREST
      ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#040e24]/90 border border-cyan-500/35 shadow-lg space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Custom Lesson by User Interest
              </h3>
              <p className="text-[11px] text-slate-400">
                Interested in something specific? Type any custom scenario (e.g., RTC bus conductor, Biryani ordering, Interview intro).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customInterestQuery}
            onChange={(e) => setCustomInterestQuery(e.target.value)}
            placeholder="Type your interest (e.g. Talking to doctor, Train ticket booking, Tech meeting)..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customInterestQuery.trim()) {
                const prompt = `You are GK Learning, an interactive language learning engine inside GKEDIT AI created by @GKEDIT2141. Generate an interactive 2-minute micro-lesson for: Known Language: ${getLanguageName(knownLang)}, Learning Language: ${getLanguageName(targetLang)}, Level: ${level}, on user interest: "${customInterestQuery}". Follow the exact 4-part format: 🎯 Today's Focus, 💡 Context / Example, ⚡ Quick Challenge, 🌟 Streak & Encouragement. Remind user of 14-Hour master course and 5:00 PM routine.`;
                if (onNavigateToChat) {
                  onNavigateToChat(prompt);
                } else {
                  window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
                  window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
                }
              }
            }}
          />
          <button
            onClick={() => {
              if (!customInterestQuery.trim()) return;
              const prompt = `You are GK Learning, an interactive language learning engine inside GKEDIT AI created by @GKEDIT2141. Generate an interactive 2-minute micro-lesson for: Known Language: ${getLanguageName(knownLang)}, Learning Language: ${getLanguageName(targetLang)}, Level: ${level}, on user interest: "${customInterestQuery}". Follow the exact 4-part format: 🎯 Today's Focus, 💡 Context / Example, ⚡ Quick Challenge, 🌟 Streak & Encouragement. Remind user of 14-Hour master course and 5:00 PM routine.`;
              if (onNavigateToChat) {
                onNavigateToChat(prompt);
              } else {
                window.dispatchEvent(new CustomEvent('gkedit:fill_chat_prompt', { detail: { prompt } }));
                window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'chat' } }));
              }
            }}
            disabled={!customInterestQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            Generate Lesson
          </button>
        </div>
      </div>

      {/* =========================================================================
          14-HOUR CERTIFICATE MODAL
      ========================================================================= */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-md w-full rounded-3xl bg-[#040e24] border border-amber-400/50 p-6 space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 mx-auto flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                OFFICIAL CERTIFICATION
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                14-Hour Fluency Milestone
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Issued by <strong className="text-emerald-400">GK Learning Engine</strong> · GKEDIT AI
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Course Syllabus:</span>
                <span className="font-bold text-white">14.0 Hours (840 Mins)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Completed Time:</span>
                <span className="font-bold text-emerald-400">{completedHours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Streak:</span>
                <span className="font-bold text-amber-400">{streak} Days 🔥</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Architect:</span>
                <span className="font-bold text-cyan-300">@GKEDIT2141</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleShareProgress}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.4)]"
              >
                Share Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creator Attribution Footer Card */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">
            GK
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              GK Learning Engine · 14-Hour Master Course
            </div>
            <div className="text-[11px] text-slate-400">
              Crafted by <span className="text-emerald-400 font-semibold">@GKEDIT2141</span> · Telugu YouTuber & Creator
            </div>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          Daily 1 Lesson (5:00 PM Routine) or Custom Exploration
        </div>
      </div>
    </div>
  );
}

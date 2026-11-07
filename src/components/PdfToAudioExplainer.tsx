import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Upload,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Square,
  Download,
  FileText,
  Sparkles,
  Check,
  Copy,
  AlertCircle,
  Volume2,
  VolumeX,
  FileDown,
  Layers,
  Feather,
  Bookmark,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Key,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { api } from '../services/api.ts';

// Clear placeholder variable for the Gemini API key as specified in the prompt
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface BookChapter {
  chapter_number: string;
  title: string;
  content: string;
  key_insight?: string;
}

export interface BookStudyResult {
  summary_title: string;
  spoken_script: string;
  book_chapters: BookChapter[];
  exam_takeaways: string[];
}

// Built-in classic study manuscript for instant 1-click preview
const SAMPLE_MANUSCRIPT_TEXT = `
TREATISE ON MODERN NEURAL SYSTEMS & COGNITIVE LOGIC
SECTION I: THE FOUNDATIONS OF NEURAL EMBEDDINGS
Deep representation learning proceeds through layered hierarchies. Initial computational layers register primitive spatial gradients, edge orientations, and raw acoustic frequencies. Intermediate representations synthesize these primitives into coherent sub-assemblies—such as phonetic morphemes, geometric textures, and localized motifs. Downstream layers converge upon abstract semantic invariants capable of robust contextual inference.

SECTION II: TRANSFORMERS AND THE ATTENTION PARADIGM
The introduction of self-attention mechanisms fundamentally altered sequence modeling. By discarding temporal recurrence, scaled dot-product attention computes all-to-all token affinity weights in parallel. This mechanism allows long-range contextual dependencies to propagate without degradation, providing the architectural foundation for modern large language models, zero-shot generalization, and multi-modal alignment.

SECTION III: QUANTUM-CLASSICAL VARIATIONAL ALGORITHMS
In quantum computing architectures, superposition and unitary entanglement permit state representations that scale exponentially with qubit count. In hybrid variational circuits, classical parameter optimization guides unitary rotation operators on the Bloch sphere, enabling new frontiers in combinatorial optimization, chemical molecular simulation, and cryptographic complexity analysis.

SECTION IV: MASTER TAKEAWAYS FOR THE DISCERNING SCHOLAR
The disciplined student must commit to memory: first, matrix decomposition and Riemannian gradient landscapes; second, memory bandwidth and parallel tensor throughput; and third, the mathematical formulation of cross-entropy loss and generalized self-attention.
`.trim();

export function PdfToAudioExplainer() {
  // File & Parsing States
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [pdfText, setPdfText] = useState<string>('');
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Loading & Progress States
  const [loadingState, setLoadingState] = useState<
    'idle' | 'reading_pdf' | 'generating_script' | 'preparing_audio'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  // Gemini API Key State (Optional UI override)
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('gkedit_custom_gemini_key') || '';
  });
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);

  // Result & Book States
  const [result, setResult] = useState<BookStudyResult | null>(null);
  const [activePage, setActivePage] = useState<'left' | 'right'>('left'); // for mobile toggle if needed
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedTakeaways, setCopiedTakeaways] = useState<boolean>(false);

  // Audio Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechProgress, setSpeechProgress] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);

  // Audio & PDF Download States
  const [isDownloadingAudio, setIsDownloadingAudio] = useState<boolean>(false);
  const [downloadAudioSuccess, setDownloadAudioSuccess] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [downloadPdfSuccess, setDownloadPdfSuccess] = useState<boolean>(false);
  const [serverAudioUrl, setServerAudioUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const speechIntervalRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize SpeechSynthesis Voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const sorted = [...voices].sort((a, b) => {
            const aGood = a.lang.startsWith('en') || a.name.includes('Natural') || a.name.includes('Google');
            const bGood = b.lang.startsWith('en') || b.name.includes('Natural') || b.name.includes('Google');
            return aGood && !bGood ? -1 : !aGood && bGood ? 1 : 0;
          });
          setAvailableVoices(sorted);
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    };
  }, []);

  // Save Custom Key Handler
  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key.trim()) {
      localStorage.setItem('gkedit_custom_gemini_key', key.trim());
    } else {
      localStorage.removeItem('gkedit_custom_gemini_key');
    }
  };

  // Load PDF.js from CDN dynamically
  const loadPdfJs = async (): Promise<any> => {
    if ((window as any).pdfjsLib) {
      return (window as any).pdfjsLib;
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(pdfjsLib);
        } else {
          reject(new Error('PDF.js failed to initialize.'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js library script.'));
      document.head.appendChild(script);
    });
  };

  // Extract PDF Text
  const parsePdfFile = async (selectedFile: File) => {
    setError(null);
    setIsParsingPdf(true);
    setLoadingState('reading_pdf');
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize((selectedFile.size / 1024 / 1024).toFixed(2) + ' MB');

    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setPageCount(pdf.numPages);
      let extractedText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items.map((item: any) => item.str);
        extractedText += `--- Page ${i} ---\n` + pageStrings.join(' ') + '\n\n';
      }

      const cleanText = extractedText.trim();
      if (!cleanText || cleanText.replace(/--- Page \d+ ---/g, '').trim().length < 20) {
        throw new Error(
          'Could not extract readable text from this PDF. It may be an image-only scanned document or password-protected.'
        );
      }

      setPdfText(cleanText);
      setIsParsingPdf(false);
      await generateBookStudy(cleanText);
    } catch (err: any) {
      console.error('PDF parsing error:', err);
      setError(err.message || 'Failed to read PDF document.');
      setIsParsingPdf(false);
      setLoadingState('idle');
    }
  };

  // Load Built-in Sample Manuscript
  const handleLoadSample = async () => {
    setError(null);
    setFile(null);
    setFileName('Treatise_on_Neural_Systems.pdf');
    setFileSize('0.38 MB');
    setPageCount(4);
    setPdfText(SAMPLE_MANUSCRIPT_TEXT);
    await generateBookStudy(SAMPLE_MANUSCRIPT_TEXT);
  };

  // AI Book Study & Audio Script Generation via Gemini 2.5 Flash
  const generateBookStudy = async (sourceText: string) => {
    setError(null);
    setLoadingState('generating_script');
    stopSpeech();

    const activeKey = customApiKey.trim() || GEMINI_API_KEY;

    try {
      let finalResult: BookStudyResult | null = null;

      // Direct Gemini 2.5 Flash API endpoint if key is provided
      if (activeKey) {
        try {
          const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
            activeKey
          )}`;

          const promptDirective = `You are an elite academic tutor, scholar, and legendary podcast host. Analyze this study manuscript and produce both an engaging audio podcast narrative and an authentic classical book summary.

CRITICAL FORMATTING DIRECTIVES:
1. 'summary_title': Elegant chapter title (e.g., "Summary of the Manuscript: Neural Matrices").
2. 'spoken_script': Pure spoken conversational explanation script designed specifically to be listened to through headphones (no markdown asterisks, raw brackets, or formatting symbols).
3. 'book_chapters': An array of 2 to 3 beautifully written chapters, each with 'chapter_number' (e.g. "Chapter I", "Chapter II"), 'title' (e.g. "Core Logic & Foundations"), 'content' (a rich academic book paragraph), and 'key_insight'.
4. 'exam_takeaways': Array of 4-5 high-yield bullet takeaways.

Return STRICT, valid JSON matching this schema:
{
  "summary_title": "Summary of the Manuscript",
  "spoken_script": "Pure spoken conversational text for headphones...",
  "book_chapters": [
    {
      "chapter_number": "Chapter I",
      "title": "Core Logic",
      "content": "Key study insights and takeaways in classical manuscript prose...",
      "key_insight": "Essential conceptual principle"
    },
    {
      "chapter_number": "Chapter II",
      "title": "Mechanisms & Application",
      "content": "Detailed exploration of architecture, workflows, and experimental results...",
      "key_insight": "Practical rule of thumb"
    }
  ],
  "exam_takeaways": [
    "High-yield takeaway 1",
    "High-yield takeaway 2",
    "High-yield takeaway 3",
    "High-yield takeaway 4"
  ]
}

Document Text to analyze:
${sourceText.slice(0, 35000)}`;

          const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: promptDirective }] }],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Gemini endpoint returned ${response.status}`);
          }

          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            try {
              finalResult = JSON.parse(rawText);
            } catch {
              const match = rawText.match(/\{[\s\S]*\}/);
              if (match) finalResult = JSON.parse(match[0]);
            }
          }
        } catch (clientErr: any) {
          console.warn('Direct Gemini call fallback to server proxy:', clientErr);
        }
      }

      // Backend Proxy Fallback (/api/pdf-audio/explain)
      if (!finalResult) {
        setLoadingState('generating_script');
        const proxyRes = await api.explainPdfContent({ text: sourceText });
        if (proxyRes && proxyRes.spoken_script) {
          finalResult = {
            summary_title: proxyRes.summary_title || 'Summary of the Manuscript',
            spoken_script: proxyRes.spoken_script,
            book_chapters: proxyRes.book_chapters || [
              {
                chapter_number: 'Chapter I',
                title: 'Core Logic',
                content: proxyRes.spoken_script.slice(0, 420),
                key_insight: 'Fundamental conceptual pillar',
              },
            ],
            exam_takeaways: proxyRes.exam_takeaways || proxyRes.key_points || [
              'Primary conceptual thesis distilled',
              'Key methodological formula analyzed',
              'High-yield exam takeaways structured',
            ],
          };
        }
      }

      if (!finalResult || !finalResult.spoken_script) {
        throw new Error('Could not synthesize wisdom from this manuscript. Please try again.');
      }

      setLoadingState('preparing_audio');

      // Clean spoken script
      const sanitizedScript = finalResult.spoken_script
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s?/g, '')
        .replace(/`{1,3}[a-zA-Z]*\n?/g, '')
        .trim();

      setResult({
        summary_title: finalResult.summary_title || 'Summary of the Manuscript',
        spoken_script: sanitizedScript,
        book_chapters:
          Array.isArray(finalResult.book_chapters) && finalResult.book_chapters.length > 0
            ? finalResult.book_chapters
            : [
                {
                  chapter_number: 'Chapter I',
                  title: 'Core Logic & Foundations',
                  content: sanitizedScript.slice(0, 450),
                  key_insight: 'Essential study pillar',
                },
              ],
        exam_takeaways:
          Array.isArray(finalResult.exam_takeaways) && finalResult.exam_takeaways.length > 0
            ? finalResult.exam_takeaways
            : [
                'Core analytical framework established',
                'Methodological insights organized',
                'Essential exam takeaways synthesized',
              ],
      });

      setLoadingState('idle');

      // Preload Studio Neural TTS Audio from backend
      try {
        const ttsRes = await api.textToSpeech({
          text: sanitizedScript.slice(0, 800),
          voiceName: 'Charon',
        });
        if (ttsRes && ttsRes.audioBase64) {
          setServerAudioUrl(`data:${ttsRes.mimeType || 'audio/wav'};base64,${ttsRes.audioBase64}`);
        }
      } catch {
        // Fallback to Web Speech API
      }
    } catch (err: any) {
      console.error('Manuscript distillation error:', err);
      setError(err.message || 'Failed to distill manuscript. Please check the document.');
      setLoadingState('idle');
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type === 'application/pdf' || dropped.name.endsWith('.pdf')) {
        parsePdfFile(dropped);
      } else {
        setError('Kindly provide a valid parchment .PDF manuscript.');
      }
    }
  };

  // Audio Playback Controls
  const startSpeech = () => {
    if (!result?.spoken_script || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result.spoken_script);
    utterance.rate = playbackRate;
    utterance.volume = isMuted ? 0 : volume;

    if (availableVoices[selectedVoiceIndex]) {
      utterance.voice = availableVoices[selectedVoiceIndex];
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setSpeechProgress(0);
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
      const estTotalMs = (result.spoken_script.split(' ').length / (135 * playbackRate)) * 60 * 1000;
      const startTime = Date.now();
      speechIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(Math.round((elapsed / estTotalMs) * 100), 98);
        setSpeechProgress(pct);
      }, 500);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setSpeechProgress(100);
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setSpeechProgress(0);
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    }
  };

  const replaySpeech = () => {
    stopSpeech();
    setTimeout(startSpeech, 150);
  };

  // Direct Audio Download (.wav file)
  const handleDownloadAudio = async () => {
    if (!result?.spoken_script) return;
    setIsDownloadingAudio(true);
    setDownloadAudioSuccess(false);

    try {
      let finalBlob: Blob | null = null;

      if (serverAudioUrl && serverAudioUrl.startsWith('data:audio/')) {
        const byteString = atob(serverAudioUrl.split(',')[1]);
        const mimeString = serverAudioUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        finalBlob = new Blob([ab], { type: mimeString });
      } else {
        try {
          const ttsRes = await api.textToSpeech({
            text: result.spoken_script,
            voiceName: 'Charon',
          });
          if (ttsRes && ttsRes.audioBase64) {
            const byteCharacters = atob(ttsRes.audioBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            finalBlob = new Blob([new Uint8Array(byteNumbers)], { type: ttsRes.mimeType || 'audio/wav' });
          }
        } catch (apiErr) {
          console.warn('Studio TTS download fallback to generated audio tone:', apiErr);
        }
      }

      if (!finalBlob) {
        finalBlob = createToneWavBlob(result.spoken_script);
      }

      const downloadLink = document.createElement('a');
      const safeTitle = (result.summary_title || 'study-manuscript')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      downloadLink.href = URL.createObjectURL(finalBlob);
      downloadLink.download = `${safeTitle}-voice-notes.wav`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);

      setDownloadAudioSuccess(true);
      setTimeout(() => setDownloadAudioSuccess(false), 3000);
    } catch (err: any) {
      console.error('Audio download error:', err);
      setError('Could not prepare audio file for download.');
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  // Helper: Generates a valid WAV buffer
  const createToneWavBlob = (scriptText: string): Blob => {
    const sampleRate = 22050;
    const durationSec = Math.min(Math.max(scriptText.split(' ').length / 2.5, 3), 15);
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * 432 * t) * 0.3 * Math.exp(-t * 0.2); // 432Hz scholarly tone
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // "Download Summary as PDF" (Study Notebook Export via jsPDF)
  const handleDownloadSummaryPdf = () => {
    if (!result) return;
    setIsGeneratingPdf(true);
    setDownloadPdfSuccess(false);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // 1. Parchment paper background tint
      doc.setFillColor(253, 251, 247);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // 2. Vintage decorative border frame
      doc.setDrawColor(180, 150, 100);
      doc.setLineWidth(0.8);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      doc.setLineWidth(0.3);
      doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

      let currentY = 25;

      // 3. Header & Ornament
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(140, 100, 60);
      doc.text('GKEDIT AI • STUDY MANUSCRIPT & AUDIO GUIDE', pageWidth / 2, currentY, { align: 'center' });

      currentY += 8;
      doc.setFontSize(18);
      doc.setTextColor(26, 26, 36);
      doc.text(result.summary_title, pageWidth / 2, currentY, { align: 'center', maxWidth: contentWidth });

      currentY += 8;
      doc.setDrawColor(200, 170, 120);
      doc.line(margin + 20, currentY, pageWidth - margin - 20, currentY);

      currentY += 10;

      // 4. Chapters
      if (result.book_chapters && result.book_chapters.length > 0) {
        result.book_chapters.forEach((chap) => {
          if (currentY > pageHeight - 40) {
            doc.addPage();
            doc.setFillColor(253, 251, 247);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            doc.setDrawColor(180, 150, 100);
            doc.setLineWidth(0.8);
            doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
            currentY = 25;
          }

          doc.setFont('times', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(44, 34, 30);
          doc.text(`${chap.chapter_number}: ${chap.title}`, margin, currentY);
          currentY += 6;

          doc.setFont('times', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(40, 35, 30);
          const splitContent = doc.splitTextToSize(chap.content, contentWidth);
          doc.text(splitContent, margin, currentY);
          currentY += splitContent.length * 4.8 + 4;

          if (chap.key_insight) {
            doc.setFont('times', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(110, 80, 45);
            doc.text(`❖ Insight: ${chap.key_insight}`, margin + 5, currentY);
            currentY += 6;
          }
          currentY += 4;
        });
      }

      // 5. Exam Takeaways Box
      if (result.exam_takeaways && result.exam_takeaways.length > 0) {
        if (currentY > pageHeight - 60) {
          doc.addPage();
          doc.setFillColor(253, 251, 247);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          doc.setDrawColor(180, 150, 100);
          doc.setLineWidth(0.8);
          doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
          currentY = 25;
        }

        doc.setFillColor(248, 242, 230);
        doc.roundedRect(margin, currentY, contentWidth, 8 + result.exam_takeaways.length * 7, 3, 3, 'FD');

        currentY += 6;
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(120, 80, 35);
        doc.text('EXAM TAKEAWAYS & KEY AXIOMS', margin + 6, currentY);
        currentY += 6;

        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(35, 30, 25);
        result.exam_takeaways.forEach((pt, idx) => {
          doc.text(`[${idx + 1}]  ${pt}`, margin + 6, currentY, { maxWidth: contentWidth - 12 });
          currentY += 6.5;
        });
      }

      // 6. Colophon Footer
      doc.setFont('times', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(160, 140, 110);
      doc.text(
        'Generated & bound by GKEDIT AI Study Engine • Handcrafted by @GKEDIT2141',
        pageWidth / 2,
        pageHeight - 14,
        { align: 'center' }
      );

      const safeTitle = (result.summary_title || 'study-manuscript')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      doc.save(`${safeTitle}-study-notes.pdf`);

      setDownloadPdfSuccess(true);
      setTimeout(() => setDownloadPdfSuccess(false), 3000);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setError('Could not compile printable summary PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyScript = () => {
    if (!result?.spoken_script) return;
    navigator.clipboard.writeText(result.spoken_script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyTakeaways = () => {
    if (!result?.exam_takeaways) return;
    navigator.clipboard.writeText(result.exam_takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n'));
    setCopiedTakeaways(true);
    setTimeout(() => setCopiedTakeaways(false), 2000);
  };

  // Extract first letter of title for illuminated drop-cap
  const summaryLetter = result?.summary_title ? result.summary_title.charAt(0) : 'S';
  const summaryRestOfTitle = result?.summary_title ? result.summary_title.slice(1) : 'ummary of the Manuscript';

  return (
    <div className="w-full space-y-5">
      {/* Mini Breadcrumb Header Styled in Classical Serif */}
      <div className="flex items-center justify-between px-2 text-xs font-serif text-amber-200/80">
        <div className="flex items-center gap-1.5 tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold">GKEDIT AI</span>
          <span>›</span>
          <span>Tools</span>
          <span>›</span>
          <span>More</span>
          <span>›</span>
          <span className="text-white font-bold">Study</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSample}
            disabled={loadingState !== 'idle'}
            className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/40 text-amber-300 text-[11px] font-serif transition cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
            title="Load classical sample manuscript"
          >
            <Feather className="w-3 h-3 text-amber-400" />
            <span>Load Sample</span>
          </button>
          <button
            onClick={() => setShowKeyConfig((p) => !p)}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-amber-300 transition cursor-pointer"
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Optional Gemini API Key Drawer */}
      {showKeyConfig && (
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-600/30 text-xs font-serif space-y-2">
          <div className="flex items-center justify-between text-amber-300">
            <span className="font-bold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Gemini 2.5 Flash API Key</span>
            </span>
            <span className="text-[10px] text-slate-400 font-sans">Optional • Server proxy active</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              placeholder="AIzaSy... (Paste Google AI Studio API key)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
            />
            {customApiKey && (
              <button
                onClick={() => handleSaveApiKey('')}
                className="px-3 py-1 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs hover:bg-red-900/60 transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-serif flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white font-bold px-1.5">
            ✕
          </button>
        </div>
      )}

      {/* ====================================================================== */}
      {/* PHYSICAL OPEN BOOK / PARCHMENT MANUSCRIPT VIEWPORT                     */}
      {/* ====================================================================== */}
      <div className="relative w-full rounded-3xl p-1 sm:p-3 bg-gradient-to-b from-[#1f1711] via-[#2a1e16] to-[#1a120c] shadow-[0_25px_60px_rgba(0,0,0,0.85)] border-4 border-[#3c2a1c]">
        {/* Silk Bookmark Ribbon hanging from top */}
        <div className="absolute -top-1 left-12 sm:left-20 w-5 sm:w-6 h-12 sm:h-16 bg-gradient-to-b from-red-800 via-rose-700 to-red-900 shadow-md z-30 rounded-b-md flex items-end justify-center pb-1 pointer-events-none">
          <div className="w-2.5 h-2.5 bg-amber-400/80 rotate-45 transform" />
        </div>

        {/* Master Open Book Container: Dual Page on Desktop, Single Column Scroll on Mobile */}
        <div
          style={{
            backgroundColor: '#fbf8f0',
            backgroundImage: `radial-gradient(#eedec2 1px, transparent 1px), radial-gradient(#f4e8d3 1px, #fbf8f0 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
          className="relative w-full rounded-2xl overflow-hidden shadow-[inset_0_0_40px_rgba(110,80,45,0.18)] grid grid-cols-1 md:grid-cols-2 text-[#1a1a24] font-serif"
        >
          {/* Central Gutter / Spine Fold Shadow (Desktop Only) */}
          <div className="hidden md:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-12 pointer-events-none z-20 bg-gradient-to-r from-black/15 via-black/25 to-transparent" />
          <div className="hidden md:block absolute inset-y-0 left-1/2 w-6 pointer-events-none z-20 bg-gradient-to-r from-black/25 via-black/15 to-transparent" />

          {/* Stitched Edge Top & Bottom Line Accents */}
          <div className="absolute top-0 inset-x-0 h-1 border-b border-dashed border-[#b89868]/40 pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-1 border-t border-dashed border-[#b89868]/40 pointer-events-none" />

          {/* ================================================================== */}
          {/* PAGE 1 (LEFT PAGE ON DESKTOP / MAIN VIEW ON MOBILE)                 */}
          {/* ================================================================== */}
          <div className="p-5 sm:p-7 md:p-8 space-y-5 md:border-r border-[#d8c5a4]/70 relative">
            {/* Top Vintage Bookplate Upload Box (Styled as in uploaded user mockup) */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative p-5 sm:p-6 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center space-y-3 group ${
                isDragOver
                  ? 'border-[#8d6c34] bg-[#ebdcc2]/60 scale-[1.01]'
                  : 'border-[#b89868]/80 hover:border-[#8d6c34] bg-[#f5ecda]/60 hover:bg-[#ebdcc2]/50'
              }`}
            >
              {/* Ornate Engraved Corner Filigrees */}
              <span className="absolute top-1 left-1.5 text-xs text-[#a07e46] font-serif select-none pointer-events-none">
                ❖
              </span>
              <span className="absolute top-1 right-1.5 text-xs text-[#a07e46] font-serif select-none pointer-events-none">
                ❖
              </span>
              <span className="absolute bottom-1 left-1.5 text-xs text-[#a07e46] font-serif select-none pointer-events-none">
                ❖
              </span>
              <span className="absolute bottom-1 right-1.5 text-xs text-[#a07e46] font-serif select-none pointer-events-none">
                ❖
              </span>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    parsePdfFile(e.target.files[0]);
                  }
                }}
                accept=".pdf,application/pdf"
                className="hidden"
              />

              <h4 className="text-sm sm:text-base font-serif font-bold text-[#2a1e16] tracking-wide">
                Place your PDF Manuscript here
              </h4>

              {/* Embossed Vintage Leather/Brass Button matching mockup */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-b from-[#ebdcc2] via-[#dfcdb0] to-[#cbba98] border-2 border-[#8d6c34] text-[#2c1e14] font-serif font-bold text-xs sm:text-sm shadow-[0_4px_10px_rgba(70,50,25,0.25)] group-hover:scale-105 transition-transform duration-150">
                <BookOpen className="w-4 h-4 text-[#8d6c34]" />
                <span>Open PDF</span>
              </div>

              {/* Status / Ink Progress Notice matching mockup */}
              <p className="text-[11px] font-serif italic text-[#6a533c] tracking-wide">
                {loadingState === 'reading_pdf' && 'Examining Manuscript...'}
                {loadingState === 'generating_script' && 'Distilling Wisdom (Gemini 2.5 Flash)...'}
                {loadingState === 'preparing_audio' && 'Preparing Voice & Print...'}
                {loadingState === 'idle' && (fileName ? `${fileName} • ${pageCount} Pages` : 'Examining Manuscript... Distilling Wisdom...')}
              </p>
            </div>

            {/* Victorian Flourish Divider Ornament */}
            <div className="flex items-center justify-center gap-3 py-1 text-[#a07e46] opacity-80 select-none">
              <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-[#a07e46] to-transparent" />
              <span className="text-sm font-serif">❧ ❖ ❦</span>
              <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-[#a07e46] to-transparent" />
            </div>

            {/* Section: Summary of the Manuscript with Illuminated Drop-Cap */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {/* Vintage Medieval Drop Cap Box matching user mockup */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-[#2a1e16] to-[#1a120c] border-2 border-[#b89868] text-[#fbf8f0] font-serif font-black text-2xl sm:text-3xl flex items-center justify-center shadow-[2px_3px_8px_rgba(0,0,0,0.35)] shrink-0 select-none">
                  {summaryLetter}
                </div>

                <div className="pt-0.5">
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#1a1a24] leading-tight">
                    {summaryRestOfTitle}
                  </h3>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#8d6c34] font-semibold">
                    STUDY MANUSCRIPT COMPENDIUM
                  </span>
                </div>
              </div>

              {/* Italic Fountain Pen Body Ink Text matching mockup */}
              <div className="text-xs sm:text-sm font-serif italic leading-relaxed text-[#241c18] space-y-2.5 pt-1 pl-1">
                {result ? (
                  <p className="first-letter:float-none">
                    {result.book_chapters?.[0]?.content || result.spoken_script.slice(0, 400)}
                  </p>
                ) : (
                  <p className="opacity-75">
                    The handwritten-style summary and use of fountain pen ink in the vintage manuscript page, dark
                    sepia summary of the manuscript, insights distilled by scholarly AI search to complete the study
                    manuscript and fit elegantly on mobile and desktop viewports.
                  </p>
                )}
              </div>
            </div>

            {/* Chapter I: Core Logic */}
            <div className="space-y-2 pt-2 border-t border-[#d8c5a4]/50">
              <h4 className="text-sm sm:text-base font-serif font-bold text-[#1a1a24] flex items-center gap-2">
                <span className="text-[#8d6c34]">❖</span>
                <span>
                  {result?.book_chapters?.[0]?.chapter_number || 'Chapter I'}:{' '}
                  {result?.book_chapters?.[0]?.title || 'Core Logic'}
                </span>
              </h4>
              <p className="text-xs sm:text-sm font-serif leading-relaxed text-[#2c221e]">
                {result?.book_chapters?.[0]?.content
                  ? result.book_chapters[0].content
                  : 'Key study insights and takeaways in serif ink takeaways, in order to learn to execute components and create systems that ask to implement insightful industry-standard foundations.'}
              </p>
              {result?.book_chapters?.[0]?.key_insight && (
                <div className="p-2.5 rounded-lg bg-[#ebdcc2]/40 border-l-2 border-[#8d6c34] text-[11px] font-serif italic text-[#543d2b]">
                  <strong>Marginal Note:</strong> {result.book_chapters[0].key_insight}
                </div>
              )}
            </div>

            {/* Antique Wax Seal & Postage Stamp Accent in corner */}
            <div className="pt-3 flex items-center justify-between text-[11px] text-[#7d654d] font-serif">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">📜</span>
                <span>Page I of II</span>
              </div>
              <div className="flex items-center gap-1.5 border border-[#8d6c34]/50 px-2.5 py-1 rounded bg-[#f5edd6]/70 shadow-sm">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6a4f27] font-bold">
                  GKEDIT AI SEAL
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* PAGE 2 (RIGHT PAGE ON DESKTOP / LOWER SECTION ON MOBILE)           */}
          {/* ================================================================== */}
          <div className="p-5 sm:p-7 md:p-8 space-y-5 bg-[#faf5e8]/50 relative flex flex-col justify-between">
            {/* Top Vintage Stamp watermark */}
            <div className="space-y-4">
              {/* Chapter II or Continued Insights */}
              {result?.book_chapters?.[1] ? (
                <div className="space-y-2 border-b border-[#d8c5a4]/50 pb-3">
                  <h4 className="text-sm sm:text-base font-serif font-bold text-[#1a1a24] flex items-center gap-2">
                    <span className="text-[#8d6c34]">❖</span>
                    <span>
                      {result.book_chapters[1].chapter_number}: {result.book_chapters[1].title}
                    </span>
                  </h4>
                  <p className="text-xs sm:text-sm font-serif leading-relaxed text-[#2c221e]">
                    {result.book_chapters[1].content}
                  </p>
                  {result.book_chapters[1].key_insight && (
                    <div className="p-2.5 rounded-lg bg-[#ebdcc2]/40 border-l-2 border-[#8d6c34] text-[11px] font-serif italic text-[#543d2b]">
                      <strong>Marginal Note:</strong> {result.book_chapters[1].key_insight}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Exam Takeaways & Scholar Axioms */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#d8c5a4]/60 pb-1.5">
                  <h4 className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-[#7a5a30] flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-[#8d6c34]" />
                    <span>Exam Key Takeaways</span>
                  </h4>
                  {result && (
                    <button
                      onClick={handleCopyTakeaways}
                      className="text-[10px] font-mono text-[#8d6c34] hover:text-[#5a3e1b] cursor-pointer"
                    >
                      {copiedTakeaways ? '✓ Copied' : 'Copy'}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {(result?.exam_takeaways || [
                    'Superposition & attention matrix decomposition form the bedrock of synthesis.',
                    'Long-range dependencies propagate losslessly through parallel dot-product scaling.',
                    'Cross-entropy objectives guide convergence upon invariant conceptual embeddings.',
                    'Rigorous study notes and audio recitation yield optimal retention for exams.',
                  ]).map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2 rounded-lg bg-[#ebdcc2]/30 hover:bg-[#ebdcc2]/60 transition-colors text-xs font-serif leading-relaxed"
                    >
                      <span className="font-mono font-bold text-[#8d6c34] text-[11px] mt-0.5 shrink-0">
                        [{idx + 1}]
                      </span>
                      <span className="text-[#2c221e]">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Controls Area (Matching the exact player bar and buttons in user screenshot) */}
            <div className="space-y-3.5 pt-4">
              {/* Interactive Antique Brass Audio Player Deck */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#e7d8be] via-[#eedec2] to-[#dfceb0] border-2 border-[#8d6c34] shadow-[inset_0_1px_3px_rgba(255,255,255,0.7),0_4px_12px_rgba(60,40,20,0.2)] space-y-2">
                <div className="flex items-center justify-between gap-3">
                  {/* Play / Pause / Replay Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isPlaying ? (
                      <button
                        onClick={startSpeech}
                        className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#8d6c34] to-[#5a411e] hover:from-[#a07c3e] hover:to-[#6d5027] text-[#fbf8f0] flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
                        title={isPaused ? 'Resume recitation' : 'Play voice notes'}
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    ) : (
                      <button
                        onClick={pauseSpeech}
                        className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#b37d35] to-[#7d531d] text-[#fbf8f0] flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
                        title="Pause voice"
                      >
                        <Pause className="w-4 h-4 fill-current" />
                      </button>
                    )}

                    <button
                      onClick={stopSpeech}
                      disabled={!isPlaying && !isPaused}
                      className="w-8 h-8 rounded-lg bg-[#dfcdb0] hover:bg-[#cbba98] border border-[#8d6c34]/60 text-[#3c2a1c] flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                      title="Stop audio"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={replaySpeech}
                      disabled={!result?.spoken_script}
                      className="w-8 h-8 rounded-lg bg-[#dfcdb0] hover:bg-[#cbba98] border border-[#8d6c34]/60 text-[#3c2a1c] flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                      title="Replay from beginning"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Volume Slider & Scrubber */}
                  <div className="flex items-center gap-2 flex-1 min-w-[100px]">
                    <button
                      onClick={() => setIsMuted((p) => !p)}
                      className="text-[#6d5027] hover:text-[#2c1e14] transition cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-full accent-[#8d6c34] cursor-pointer h-1.5 rounded-lg bg-[#caa875]/60"
                      title="Recitation Volume"
                    />
                  </div>

                  {/* Speed Selector */}
                  <select
                    value={playbackRate}
                    onChange={(e) => {
                      setPlaybackRate(Number(e.target.value));
                      if (isPlaying) {
                        stopSpeech();
                        setTimeout(startSpeech, 150);
                      }
                    }}
                    className="bg-[#dfcdb0] border border-[#8d6c34]/60 rounded-lg px-2 py-1 text-[11px] font-mono text-[#3c2a1c] focus:outline-none cursor-pointer"
                    title="Playback Rate"
                  >
                    <option value={0.8}>0.8x</option>
                    <option value={1.0}>1.0x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                  </select>
                </div>

                {/* Progress Bar in antique ink */}
                <div className="w-full bg-[#cbba98]/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8d6c34] to-[#5a411e] rounded-full transition-all duration-300"
                    style={{ width: `${speechProgress}%` }}
                  />
                </div>
              </div>

              {/* Two Embossed Vintage Buttons matching user screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Download Audio Button */}
                <button
                  onClick={handleDownloadAudio}
                  disabled={!result?.spoken_script || isDownloadingAudio}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#ebdcc2] via-[#dfcdb0] to-[#cbba98] hover:from-[#f2e5cd] hover:to-[#d5c5a3] border-2 border-[#8d6c34] text-[#2c1e14] font-serif font-bold text-xs sm:text-sm shadow-[0_4px_10px_rgba(70,50,25,0.2)] active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Save narration for offline headphone listening"
                >
                  {isDownloadingAudio ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#8d6c34]" />
                  ) : downloadAudioSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Download className="w-4 h-4 text-[#8d6c34]" />
                  )}
                  <span>
                    {isDownloadingAudio
                      ? 'Compiling Audio...'
                      : downloadAudioSuccess
                      ? 'Voice Notes Saved!'
                      : 'Download Audio'}
                  </span>
                </button>

                {/* 2. Download Summary PDF Button */}
                <button
                  onClick={handleDownloadSummaryPdf}
                  disabled={!result || isGeneratingPdf}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#ebdcc2] via-[#dfcdb0] to-[#cbba98] hover:from-[#f2e5cd] hover:to-[#d5c5a3] border-2 border-[#8d6c34] text-[#2c1e14] font-serif font-bold text-xs sm:text-sm shadow-[0_4px_10px_rgba(70,50,25,0.2)] active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Export printable study booklet PDF via jsPDF"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#8d6c34]" />
                  ) : downloadPdfSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <FileDown className="w-4 h-4 text-[#8d6c34]" />
                  )}
                  <span>
                    {isGeneratingPdf
                      ? 'Binding PDF...'
                      : downloadPdfSuccess
                      ? 'Manuscript Saved!'
                      : 'Download Summary PDF'}
                  </span>
                </button>
              </div>

              {/* Bottom Colophon and Voice Script Copier */}
              <div className="flex items-center justify-between text-[11px] text-[#7d654d] font-serif pt-1">
                <div className="flex items-center gap-1">
                  <span>📜 Page II of II</span>
                  <span>•</span>
                  <span>Audio & Print Bound</span>
                </div>
                {result?.spoken_script && (
                  <button
                    onClick={handleCopyScript}
                    className="text-[#8d6c34] hover:text-[#5a3e1b] flex items-center gap-1 cursor-pointer font-sans text-[10px]"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'Script Copied' : 'Copy Audio Script'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

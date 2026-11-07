import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  Mic, 
  MicOff, 
  Delete, 
  Plus, 
  UserPlus, 
  Copy, 
  Check, 
  Sparkles,
  ShieldCheck,
  Search,
  Volume2
} from 'lucide-react';
import { Contact } from '../../types/telephony.ts';
import { searchContactsT9 } from '../../services/telephonyData.ts';
import { dtmfAudio } from '../../services/dtmfAudio.ts';

interface LiquidGlassDialerProps {
  contacts: Contact[];
  onStartCall: (number: string, contact?: Contact) => void;
  onScreenCall: (number: string, contact?: Contact) => void;
  onAddContact?: (number: string) => void;
}

const DIAL_PAD_BUTTONS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

export const LiquidGlassDialer: React.FC<LiquidGlassDialerProps> = ({
  contacts,
  onStartCall,
  onScreenCall,
  onAddContact,
}) => {
  const [dialedNumber, setDialedNumber] = useState<string>('');
  const [matchedContacts, setMatchedContacts] = useState<Contact[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const longPressTimerRef = useRef<any>(null);

  // T9 Predictive Search updates as numbers are entered
  useEffect(() => {
    if (dialedNumber.length > 0) {
      const results = searchContactsT9(dialedNumber, contacts);
      setMatchedContacts(results);
    } else {
      setMatchedContacts([]);
    }
  }, [dialedNumber, contacts]);

  // Handle Digit Keypress
  const handleDigitPress = (digit: string) => {
    dtmfAudio.playDtmf(digit);
    setDialedNumber((prev) => prev + digit);
  };

  // Handle Long press on 0 for '+'
  const handleZeroTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      dtmfAudio.playDtmf('0');
      setDialedNumber((prev) => prev.slice(0, -1) + '+');
    }, 550);
  };

  const handleZeroTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Backspace handler
  const handleBackspace = () => {
    dtmfAudio.playTone(350, 60, 0.08);
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  // Long press backspace to clear all
  const handleClearAll = () => {
    dtmfAudio.playTone(280, 100, 0.1);
    setDialedNumber('');
  };

  // Copy number to clipboard
  const handleCopy = () => {
    if (!dialedNumber) return;
    navigator.clipboard?.writeText(dialedNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Voice command dialing (Material You mic)
  const toggleVoiceDialing = () => {
    if (isListeningVoice) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please dial using the keypad or quick-chips.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        setVoiceTranscript('Listening... say a name or number (e.g. "Call Elena" or "555-0199")');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('')
          .toLowerCase();

        setVoiceTranscript(transcript);

        // Check for contacts match or digits
        const cleanDigits = transcript.replace(/[^0-9]/g, '');
        if (cleanDigits.length >= 3) {
          setDialedNumber(cleanDigits);
        } else {
          // Check if contact name spoken
          const found = contacts.find((c) =>
            transcript.includes(c.name.toLowerCase()) ||
            (c.company && transcript.includes(c.company.toLowerCase()))
          );
          if (found) {
            setDialedNumber(found.number);
          }
        }
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  // Call current dialed number
  const handleCall = () => {
    if (!dialedNumber) return;
    const matchedContact = contacts.find(
      (c) => c.number.replace(/[^0-9]/g, '') === dialedNumber.replace(/[^0-9]/g, '')
    );
    onStartCall(dialedNumber, matchedContact);
  };

  // Call via AI Screen Assistant
  const handleScreenCall = () => {
    if (!dialedNumber) return;
    const matchedContact = contacts.find(
      (c) => c.number.replace(/[^0-9]/g, '') === dialedNumber.replace(/[^0-9]/g, '')
    );
    onScreenCall(dialedNumber, matchedContact);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto px-4 py-2 select-none">
      {/* T9 Predictive Search Quick Chips Strip */}
      <div className="w-full min-h-[48px] mb-2 flex items-center overflow-x-auto scrollbar-none py-1 gap-2">
        {matchedContacts.length > 0 ? (
          matchedContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => {
                setDialedNumber(contact.number);
                dtmfAudio.playTone(660, 50, 0.08);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/40 hover:border-cyan-300 text-slate-200 text-xs shrink-0 shadow-lg active:scale-95 transition-all group"
            >
              <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${contact.avatarGradient} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                {contact.name.charAt(0)}
              </div>
              <div className="text-left">
                <span className="font-medium text-white group-hover:text-cyan-300 block truncate max-w-[110px]">
                  {contact.name}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono block">
                  {contact.number}
                </span>
              </div>
              {contact.e2ee && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
            </button>
          ))
        ) : dialedNumber.length > 0 ? (
          <div className="flex items-center gap-2 w-full justify-center">
            {onAddContact && (
              <button
                onClick={() => onAddContact(dialedNumber)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-white text-xs transition-all"
              >
                <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save to Contacts</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-white text-xs transition-all"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 font-mono text-center w-full flex items-center justify-center gap-1.5 py-1">
            <Search className="w-3 h-3 text-slate-500" />
            <span>T9 Predictive Dialing · Type names or digits</span>
          </div>
        )}
      </div>

      {/* Dialed Number Display Area */}
      <div className="w-full flex flex-col items-center justify-center min-h-[58px] mb-3 px-2">
        <div className="flex items-center justify-center gap-2 w-full">
          <input
            type="text"
            readOnly
            value={dialedNumber}
            placeholder="Dial a number..."
            className="w-full text-center bg-transparent border-none outline-none text-3xl font-mono font-bold tracking-wider text-white placeholder-slate-600 truncate focus:ring-0"
          />
          {dialedNumber.length > 0 && (
            <button
              onClick={handleBackspace}
              onContextMenu={(e) => {
                e.preventDefault();
                handleClearAll();
              }}
              className="p-2 rounded-full text-slate-400 hover:text-white active:scale-90 transition-all hover:bg-white/5 shrink-0"
              title="Backspace (Right click / hold to clear all)"
            >
              <Delete className="w-6 h-6 text-slate-400 hover:text-cyan-400" />
            </button>
          )}
        </div>

        {/* Voice command feedback badge */}
        {isListeningVoice && (
          <div className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-[11px] text-cyan-300 animate-pulse">
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
            <span className="truncate max-w-[260px]">{voiceTranscript}</span>
          </div>
        )}
      </div>

      {/* Xiaomi HyperOS 4 Liquid Glass Circular Keypad */}
      <div className="grid grid-cols-3 gap-x-5 gap-y-3.5 mb-5 w-full max-w-[290px]">
        {DIAL_PAD_BUTTONS.map((item) => (
          <button
            key={item.digit}
            onClick={() => handleDigitPress(item.digit)}
            onMouseDown={item.digit === '0' ? handleZeroTouchStart : undefined}
            onMouseUp={item.digit === '0' ? handleZeroTouchEnd : undefined}
            onTouchStart={item.digit === '0' ? handleZeroTouchStart : undefined}
            onTouchEnd={item.digit === '0' ? handleZeroTouchEnd : undefined}
            className="hyperos-dial-btn group relative flex flex-col items-center justify-center w-[74px] h-[74px] rounded-full mx-auto select-none"
            aria-label={`Digit ${item.digit}`}
          >
            {/* Acrylic highlight specular top edge */}
            <span className="absolute top-1 inset-x-3 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
            
            {/* Main digit */}
            <span className="text-2xl font-mono font-medium text-white group-hover:text-cyan-200 group-active:text-cyan-400 transition-colors leading-tight">
              {item.digit}
            </span>

            {/* Sub letters for T9 */}
            {item.letters && (
              <span className="text-[10px] font-mono tracking-widest text-slate-400 group-hover:text-cyan-300/80 font-semibold uppercase leading-none mt-0.5">
                {item.letters}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Call Actions Row: Material You Voice Mic + Glowing Neon Emerald Call Button + AI Screening */}
      <div className="flex items-center justify-center gap-4 w-full max-w-[290px] pt-1 pb-3">
        {/* Voice Hands-Free Mic Button */}
        <button
          onClick={toggleVoiceDialing}
          className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all ${
            isListeningVoice
              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse'
              : 'bg-slate-900/80 border-white/15 text-slate-300 hover:text-white hover:border-cyan-400/40 active:scale-90'
          }`}
          title="Voice command dialing"
          aria-label="Hands-free voice microphone"
        >
          {isListeningVoice ? (
            <Mic className="w-5 h-5 text-cyan-300" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Primary Glowing Neon-Emerald Call Button */}
        <button
          onClick={handleCall}
          disabled={!dialedNumber}
          className={`relative flex items-center justify-center w-16 h-16 rounded-full hyperos-call-btn text-white transition-all ${
            dialedNumber
              ? 'opacity-100 cursor-pointer hover:brightness-110 active:scale-90'
              : 'opacity-40 cursor-not-allowed saturate-50'
          }`}
          title={dialedNumber ? `Call ${dialedNumber}` : 'Enter a number to call'}
          aria-label="Call"
        >
          <Phone className="w-7 h-7 text-white fill-white/20" />
          
          {/* Specular glass gleam reflection */}
          <span className="absolute top-1.5 inset-x-4 h-2 rounded-full bg-white/30 blur-[1px]" />
        </button>

        {/* AI Screen Call Trigger Button */}
        <button
          onClick={handleScreenCall}
          disabled={!dialedNumber}
          className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all ${
            dialedNumber
              ? 'bg-gradient-to-tr from-cyan-900/60 to-blue-900/60 border-cyan-400/60 text-cyan-300 hover:border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-90'
              : 'bg-slate-900/40 border-white/10 text-slate-600 cursor-not-allowed'
          }`}
          title="Screen outbound call with AI"
          aria-label="Screen call via AI"
        >
          <Sparkles className="w-5 h-5 text-cyan-300" />
        </button>
      </div>

      {/* Quick Status Subtext */}
      <div className="text-[10.5px] font-mono text-slate-500 text-center tracking-tight flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Ready · End-to-End Encrypted Telephony Line</span>
      </div>
    </div>
  );
};

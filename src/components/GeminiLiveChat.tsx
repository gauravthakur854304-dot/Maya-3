import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Radio,
  BookOpen,
  UserCheck,
  RotateCcw,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { ConversationTurn, MemoryItem, VoiceAuthState } from '../types';

interface GeminiLiveChatProps {
  conversation: ConversationTurn[];
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
  personality: string;
  onPersonalityChange: (p: string) => void;
  longTermMemory: MemoryItem[];
  activeTurnToken: string;
  voiceAuthState: VoiceAuthState;
  isLoading: boolean;
}

export const GeminiLiveChat: React.FC<GeminiLiveChatProps> = ({
  conversation,
  onSendMessage,
  onClearChat,
  personality,
  onPersonalityChange,
  longTermMemory,
  activeTurnToken,
  voiceAuthState,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);

  // Voice speech synthesis for assistant responses
  const speakText = (text: string) => {
    if (!isSpeechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // safety flush
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeakingNow(true);
    utterance.onend = () => setIsSpeakingNow(false);
    utterance.onerror = () => setIsSpeakingNow(false);

    // Prefer high-quality English / Indian voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.name.includes('Google') ||
        v.name.includes('Natural') ||
        v.lang === 'en-IN' ||
        v.lang === 'en-US'
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Speak the newest assistant reply when generated
  useEffect(() => {
    if (conversation.length > 0) {
      const lastMsg = conversation[conversation.length - 1];
      if (lastMsg.role === 'assistant' && isSpeechEnabled) {
        speakText(lastMsg.content);
      }
    }
  }, [conversation.length]);

  // Web Speech API for voice recognition input
  const toggleSpeechRecognition = () => {
    if (isListeningMic) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningMic(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech Recognition is not supported by your browser.');
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = personality === 'English Teacher' ? 'en-US' : 'en-IN';

      recognition.onstart = () => {
        setIsListeningMic(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setSpeechError('Microphone permission or speech recognition failed.');
      setIsListeningMic(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    setInputText('');
    await onSendMessage(trimmed);
  };

  const personalities = [
    {
      id: 'MYRA Default',
      name: 'MYRA Default',
      badge: 'Multilingual AI',
      desc: 'Bilingual assistant (English & Hinglish) for tools and speed.',
      icon: Sparkles,
    },
    {
      id: 'English Teacher',
      name: 'English Teacher',
      badge: 'Spoken Coach',
      desc: 'Pronunciation hints, VAD rhythm, conversational fluency feedback.',
      icon: BookOpen,
    },
    {
      id: 'Security Auditor',
      name: 'Security Auditor',
      badge: 'Strict Protocol',
      desc: 'Zero-trust verification, exact tool clearance & logging.',
      icon: ShieldCheck,
    },
    {
      id: 'Coder Companion',
      name: 'Coder Companion',
      badge: 'Engineering',
      desc: 'Technical reasoning, scripts, API orchestration.',
      icon: Bot,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar: Personality & Active Memory Context */}
      <div className="space-y-5 lg:col-span-1">
        {/* Personality Switcher */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Personality Mode
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Context Retained</span>
          </div>

          <div className="space-y-2">
            {personalities.map((p) => {
              const Icon = p.icon;
              const isSelected = personality === p.id;
              return (
                <button
                  key={p.id}
                  id={`btn-persona-${p.id.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => onPersonalityChange(p.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200 text-indigo-950'
                      : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{p.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {p.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[11px] text-slate-400 italic">
            *Context continuity preserved across personality shifts without repetitive self-introductions.
          </p>
        </div>

        {/* Long-Term Memory Summary in Context */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Long-Term Memory Active
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
              {longTermMemory.length} Items
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Injected into Gemini context separately from chat turns:
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {longTermMemory.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="text-[11px] p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700"
              >
                <span className="font-semibold text-indigo-600 mr-1">[{m.category}]:</span>
                <span>{m.content}</span>
              </div>
            ))}
            {longTermMemory.length > 4 && (
              <span className="text-[10px] text-slate-400 block text-center">
                +{longTermMemory.length - 4} more items in Memory tab
              </span>
            )}
          </div>
        </div>

        {/* Turn Token Security Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Turn Binding</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
              Anti-Replay
            </span>
          </div>
          <p className="font-mono text-[11px] text-slate-300 truncate mb-2">
            {activeTurnToken}
          </p>
          <div className="flex items-center gap-1.5 text-[11px]">
            {voiceAuthState === 'VERIFIED_ADMIN' ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Turn Authorized for Protected Tools
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <ShieldAlert className="w-3.5 h-3.5" />
                Unverified Voice (Standard Safety)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Conversation Window (3 Cols) */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px]">
        {/* Chat Header Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-sm text-slate-900">
              Live Session: {personality}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              gemini-3.8-flash
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Speech Toggle */}
            <button
              id="btn-toggle-tts"
              onClick={() => {
                if (isSpeechEnabled) {
                  window.speechSynthesis?.cancel();
                  setIsSpeakingNow(false);
                }
                setIsSpeechEnabled(!isSpeechEnabled);
              }}
              title={isSpeechEnabled ? 'Mute AI Voice Output' : 'Enable AI Voice Output'}
              className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isSpeechEnabled
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isSpeechEnabled ? (
                <>
                  <Volume2 className={`w-4 h-4 ${isSpeakingNow ? 'animate-bounce' : ''}`} />
                  <span className="text-xs hidden sm:inline">Voice On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">Voice Muted</span>
                </>
              )}
            </button>

            {/* Clear Chat (Preserves Long-Term Memory safely) */}
            <button
              id="btn-clear-chat"
              onClick={onClearChat}
              title="Clear active conversation turns without affecting Long-Term Memory"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {conversation.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-base mb-1">
                MYRA v2.2.3 Ready
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Speak or type in English, Hindi, or Hinglish. Current conversation is bound to your voice authentication state and separate long-term memory.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => onSendMessage('Hey MYRA, what is new in version 2.2.3?')}
                  className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors"
                >
                  "What's new in v2.2.3?"
                </button>
                <button
                  onClick={() => onSendMessage('Remember that my default cloud backup is Google Drive.')}
                  className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors"
                >
                  "Remember my cloud backup preference"
                </button>
                <button
                  onClick={() => onSendMessage('Help me practice conversational English for a tech interview.')}
                  className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors"
                >
                  "Practice English for interview"
                </button>
              </div>
            </div>
          ) : (
            conversation.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%]`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-slate-50 border border-slate-200 text-slate-800'
                          : 'bg-indigo-600 text-white shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    <div
                      className={`flex items-center gap-2 mt-1 text-[10px] text-slate-400 px-1 ${
                        isAssistant ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.turnToken && (
                        <span className="font-mono truncate max-w-[100px]">
                          {msg.turnToken}
                        </span>
                      )}
                      {msg.authState === 'VERIFIED_ADMIN' && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                </div>
                <span>MYRA is processing with debounced streaming...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white">
          {speechError && (
            <div className="text-xs text-rose-600 mb-2 px-1 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{speechError}</span>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                id="chat-input-field"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListeningMic
                    ? 'Listening... speak clearly into microphone'
                    : 'Type a message or use voice input...'
                }
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
              />

              {isListeningMic && (
                <div className="absolute right-3 top-3">
                  <Radio className="w-4 h-4 text-rose-500 animate-ping" />
                </div>
              )}
            </div>

            {/* Mic Toggle Button */}
            <button
              type="button"
              id="btn-toggle-mic-input"
              onClick={toggleSpeechRecognition}
              title={isListeningMic ? 'Stop speech recognition' : 'Speech-to-text input'}
              className={`p-2.5 rounded-xl border transition-all ${
                isListeningMic
                  ? 'bg-rose-50 border-rose-300 text-rose-600 ring-2 ring-rose-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              id="btn-send-message"
              disabled={!inputText.trim() || isLoading}
              className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 transition-all ${
                inputText.trim() && !isLoading
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xs'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

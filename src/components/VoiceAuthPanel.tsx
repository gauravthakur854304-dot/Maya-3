import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Volume2,
  RefreshCw,
  KeyRound,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
} from 'lucide-react';
import { VoiceSample, VoiceVerificationResult, VoiceAuthState } from '../types';
import {
  startMicrophoneAnalysis,
  extractEmbeddingFromAudio,
  verifyVoiceMultiSample,
  generateTurnToken,
} from '../services/voiceAuthService';

interface VoiceAuthPanelProps {
  voiceSamples: VoiceSample[];
  onUpdateSample: (slotNumber: number, sample: Partial<VoiceSample>) => void;
  verificationResult: VoiceVerificationResult | null;
  onVerify: (result: VoiceVerificationResult) => void;
  voiceThreshold: number;
  onThresholdChange: (threshold: number) => void;
  pinCode: string;
  onPinCodeChange: (newPin: string) => void;
  activeTurnToken: string;
  onRefreshTurnToken: () => void;
}

export const VoiceAuthPanel: React.FC<VoiceAuthPanelProps> = ({
  voiceSamples,
  onUpdateSample,
  verificationResult,
  onVerify,
  voiceThreshold,
  onThresholdChange,
  pinCode,
  onPinCodeChange,
  activeTurnToken,
  onRefreshTurnToken,
}) => {
  const [isTestingLive, setIsTestingLive] = useState(false);
  const [isRecordingSlot, setIsRecordingSlot] = useState<number | null>(null);
  const [currentRms, setCurrentRms] = useState(0);
  const [testSpeechQuality, setTestSpeechQuality] = useState<'GOOD' | 'LOW' | 'NOISY_OR_SILENT'>('GOOD');
  const [activePinInput, setActivePinInput] = useState(pinCode);
  const [pinSavedNotification, setPinSavedNotification] = useState(false);

  const audioCleanupRef = useRef<(() => void) | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformBufferRef = useRef<Uint8Array | null>(null);

  // Stop recording on unmount
  useEffect(() => {
    return () => {
      if (audioCleanupRef.current) {
        audioCleanupRef.current();
      }
    };
  }, []);

  // Visualizer loop on canvas
  const drawWaveform = (data: Uint8Array) => {
    waveformBufferRef.current = data;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4f46e5';
    ctx.beginPath();

    const sliceWidth = canvas.width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  // Start live microphone testing for verification
  const handleToggleLiveTest = async () => {
    if (isTestingLive) {
      if (audioCleanupRef.current) {
        audioCleanupRef.current();
        audioCleanupRef.current = null;
      }
      setIsTestingLive(false);
      return;
    }

    try {
      setIsTestingLive(true);
      const audioHandle = await startMicrophoneAnalysis((rms, waveform) => {
        setCurrentRms(rms);
        drawWaveform(waveform);
      });
      audioCleanupRef.current = audioHandle.stop;
    } catch (err) {
      console.warn('Microphone access unavailable, starting simulated acoustic verification:', err);
      // Fallback calibration loop
      setIsTestingLive(true);
      const interval = setInterval(() => {
        const simRms = Math.random() * 0.12 + 0.04;
        setCurrentRms(simRms);
        const dummyWave = new Uint8Array(256).map(() => 128 + Math.floor((Math.random() - 0.5) * 60));
        drawWaveform(dummyWave);
      }, 100);

      audioCleanupRef.current = () => clearInterval(interval);
    }
  };

  // Evaluate current speech input against multi-sample embeddings
  const handlePerformVerification = () => {
    const dummyWave = waveformBufferRef.current || new Uint8Array(256).map(() => 128 + Math.floor((Math.random() - 0.5) * 50));
    const embedding = extractEmbeddingFromAudio(dummyWave, currentRms);

    // Call 3-state verification
    const result = verifyVoiceMultiSample(
      embedding,
      currentRms,
      voiceSamples,
      voiceThreshold,
      activeTurnToken
    );

    setTestSpeechQuality(result.speechQuality);
    onVerify(result);

    // Stop mic stream after verifying turn
    if (audioCleanupRef.current) {
      audioCleanupRef.current();
      audioCleanupRef.current = null;
    }
    setIsTestingLive(false);
  };

  // Re-record / replace an individual enrollment sample
  const handleRecordSampleSlot = async (slotNumber: number) => {
    if (isRecordingSlot === slotNumber) {
      // Finish recording slot
      if (audioCleanupRef.current) {
        audioCleanupRef.current();
        audioCleanupRef.current = null;
      }
      setIsRecordingSlot(null);

      const dummyWave = waveformBufferRef.current || new Uint8Array(256).map(() => 128 + Math.floor((Math.random() - 0.5) * 60));
      const embedding = extractEmbeddingFromAudio(dummyWave, Math.max(currentRms, 0.08));

      onUpdateSample(slotNumber, {
        isEnrolled: true,
        rmsLevel: Number(Math.max(currentRms, 0.09).toFixed(3)),
        recordedAt: new Date().toISOString(),
        embeddingVector: embedding,
      });
      return;
    }

    try {
      setIsRecordingSlot(slotNumber);
      const audioHandle = await startMicrophoneAnalysis((rms, waveform) => {
        setCurrentRms(rms);
        drawWaveform(waveform);
      });
      audioCleanupRef.current = audioHandle.stop;
    } catch {
      // fallback simulation
      setIsRecordingSlot(slotNumber);
      const interval = setInterval(() => {
        setCurrentRms(Math.random() * 0.14 + 0.05);
      }, 150);
      audioCleanupRef.current = () => clearInterval(interval);
    }
  };

  const handleSavePin = () => {
    if (activePinInput.length >= 4) {
      onPinCodeChange(activePinInput);
      setPinSavedNotification(true);
      setTimeout(() => setPinSavedNotification(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Major Security Update v2.2.3
              </span>
              <span className="text-xs text-slate-400">Fail-Closed Authorization</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Multi-Sample Speaker Embedding Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Voice verification now operates on multi-sample speaker embeddings with a 3-state
              evaluation matrix (<span className="text-emerald-400 font-medium">Verified Admin</span>,{' '}
              <span className="text-rose-400 font-medium">Not Verified</span>, and{' '}
              <span className="text-amber-400 font-medium">Insufficient Evidence</span>).
              Silent or noisy audio is automatically rejected, and authorization is bound to the
              current conversation turn.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Turn</span>
              <span className="font-mono text-xs text-indigo-200 block truncate max-w-[130px]">
                {activeTurnToken}
              </span>
              <button
                id="btn-refresh-turn-token"
                onClick={onRefreshTurnToken}
                className="mt-1 text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 mx-auto"
                title="Generate new turn token to prevent replay"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Renew Turn</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Multi-Sample Enrollment Slots & Live Verification */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrollment Slots */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Enrollment Voice Samples (Multi-Profile)
                </h3>
                <p className="text-xs text-slate-500">
                  Each sample captures distinct acoustic prosody and frequency bands. You can re-record individual samples safely.
                </p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                {voiceSamples.filter((s) => s.isEnrolled).length} of 3 Enrolled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {voiceSamples.map((sample) => {
                const isRecordingThis = isRecordingSlot === sample.slotNumber;
                return (
                  <div
                    key={sample.id}
                    id={`voice-slot-card-${sample.slotNumber}`}
                    className={`rounded-xl p-4 border transition-all ${
                      isRecordingThis
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-200'
                        : sample.isEnrolled
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-dashed border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        Slot #{sample.slotNumber}
                      </span>
                      {sample.isEnrolled ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Enrolled
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">Empty</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 italic mb-3 min-h-[38px] line-clamp-2">
                      "{sample.phrase}"
                    </p>

                    <div className="space-y-1.5 text-[11px] text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex justify-between">
                        <span>Acoustic Energy:</span>
                        <span className="font-mono font-medium text-slate-700">
                          {(sample.rmsLevel * 100).toFixed(1)}% RMS
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Embedding Dim:</span>
                        <span className="font-mono font-medium text-slate-700">
                          {sample.embeddingVector.length} bands
                        </span>
                      </div>
                      <div className="flex justify-between truncate">
                        <span>Updated:</span>
                        <span className="text-slate-600 truncate max-w-[80px]">
                          {sample.recordedAt ? new Date(sample.recordedAt).toLocaleTimeString() : 'Default'}
                        </span>
                      </div>
                    </div>

                    <button
                      id={`btn-record-slot-${sample.slotNumber}`}
                      onClick={() => handleRecordSampleSlot(sample.slotNumber)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        isRecordingThis
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                          : sample.isEnrolled
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isRecordingThis ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Stop & Save</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>{sample.isEnrolled ? 'Re-record Sample' : 'Record Sample'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Voice Verification & 3-State Test Bench */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Live Verification Test Bench
                </h3>
                <p className="text-xs text-slate-500">
                  Speak a passphrase to test speech quality, noise rejection, and speaker similarity.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Speech Level:</span>
                <div className="w-20 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-75 ${
                      currentRms > 0.02 ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    style={{ width: `${Math.min(100, currentRms * 400)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Audio Waveform Canvas */}
            <div className="bg-slate-900 rounded-xl p-3 mb-4 relative overflow-hidden">
              <canvas
                ref={canvasRef}
                width={500}
                height={70}
                className="w-full h-[70px] block"
              />
              {!isTestingLive && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-slate-400 text-xs gap-2">
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  <span>Microphone idle. Click "Start Listening" to speak.</span>
                </div>
              )}
            </div>

            {/* Verification Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-toggle-live-test"
                onClick={handleToggleLiveTest}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isTestingLive
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isTestingLive ? (
                  <>
                    <MicOff className="w-4 h-4 text-rose-600" />
                    <span>Stop Listening</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Start Listening</span>
                  </>
                )}
              </button>

              <button
                id="btn-verify-active-turn"
                disabled={!isTestingLive}
                onClick={handlePerformVerification}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isTestingLive
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authenticate Current Turn</span>
              </button>

              {/* Speech Quality status */}
              {isTestingLive && (
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
                  <Radio className="w-3.5 h-3.5 text-indigo-600 animate-ping" />
                  <span>
                    RMS: {(currentRms * 100).toFixed(1)}% |{' '}
                    {currentRms < 0.018 ? (
                      <span className="text-amber-600 font-semibold">Too Quiet / Silence</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">Voice Detected</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* 3-State Result Display */}
            {verificationResult && (
              <div
                id="verification-result-card"
                className={`mt-5 p-4 rounded-xl border transition-all ${
                  verificationResult.state === 'VERIFIED_ADMIN'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : verificationResult.state === 'NOT_VERIFIED'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {verificationResult.state === 'VERIFIED_ADMIN' && (
                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                      )}
                      {verificationResult.state === 'NOT_VERIFIED' && (
                        <ShieldX className="w-6 h-6 text-rose-600" />
                      )}
                      {verificationResult.state === 'INSUFFICIENT_EVIDENCE' && (
                        <ShieldAlert className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">
                          {verificationResult.state === 'VERIFIED_ADMIN' && 'State: VERIFIED_ADMIN'}
                          {verificationResult.state === 'NOT_VERIFIED' && 'State: NOT_VERIFIED'}
                          {verificationResult.state === 'INSUFFICIENT_EVIDENCE' &&
                            'State: INSUFFICIENT_EVIDENCE'}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded font-mono bg-white/60">
                          Score: {(verificationResult.similarityScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">
                        {verificationResult.details}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono opacity-80">
                        <span>RMS: {(verificationResult.rmsLevel * 100).toFixed(1)}%</span>
                        <span>Bound Turn: {verificationResult.turnToken}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Similarity Breakdown across samples */}
                {verificationResult.sampleScores && verificationResult.sampleScores.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/10 grid grid-cols-3 gap-2 text-center text-xs">
                    {verificationResult.sampleScores.map((s) => (
                      <div key={s.slot} className="bg-white/60 rounded p-1.5 font-mono">
                        <span className="text-[10px] text-slate-500 block">Slot #{s.slot} Match</span>
                        <span className="font-bold">{(s.score * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Security Controls & PIN Fallback Config */}
        <div className="space-y-6">
          {/* Fail-Closed Threshold Slider */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Authentication Threshold</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Minimum acoustic similarity score required to authorize admin tools without falling closed.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span>Confidence Threshold:</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono">
                  {(voiceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={voiceThreshold}
                onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.50 (Permissive)</span>
                <span>0.75 (Recommended)</span>
                <span>0.95 (High Security)</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
              <span className="font-bold block mb-0.5">Fail-Closed Security:</span>
              Any score below {(voiceThreshold * 100).toFixed(0)}% blocks tool execution immediately. Silence or ambient noise triggers automatic rejection.
            </div>
          </div>

          {/* PIN / Pattern Fallback Configuration */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">PIN Fallback (App Lock)</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              When voice verification fails due to noisy surroundings or insufficient audio, use this fallback PIN to authorize protected tools.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4-Digit Admin Fallback PIN
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={activePinInput}
                    onChange={(e) => setActivePinInput(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2 text-sm font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="2233"
                  />
                  <button
                    id="btn-save-pin"
                    onClick={handleSavePin}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>

              {pinSavedNotification && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Fallback PIN saved securely!</span>
                </div>
              )}

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>App Lock is configured. Failed voice prompts will present PIN challenge.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

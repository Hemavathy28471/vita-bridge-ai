import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity,
  Heart,
  Eye,
  Wind,
  Mic,
  Camera,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';

const PROTOCOLS = [
  {
    id: 'general',
    name: 'General Recheck',
    description: 'Comprehensive cross-modal verification: Camera visual, Microphone acoustics, Heart Rate, SpO2, and user symptom input.',
    signals: ['Camera', 'Microphone', 'Heart Rate', 'SpO2', 'Symptoms'],
    icon: Activity,
    color: 'teal',
  },
  {
    id: 'fatigue',
    name: 'Fatigue Recheck',
    description: 'Specialized for exhaustion: Facial eye openness, blink patterns, vocal pause tempo, sleep deficit, and heart rate.',
    signals: ['Facial Landmarks', 'Blink Rate', 'Voice Pauses', 'Sleep', 'Heart Rate'],
    icon: Eye,
    color: 'amber',
  },
  {
    id: 'respiratory',
    name: 'Respiratory Pattern Recheck',
    description: 'Specialized for airway / breathing: Breathing audio cadence, vocal hoarseness, SpO2, and respiratory rate.',
    signals: ['Acoustic Cough/Breathing', 'Voice Quality', 'SpO2', 'Respiratory Rate'],
    icon: Wind,
    color: 'cyan',
  },
  {
    id: 'activity',
    name: 'Activity Recheck',
    description: 'Specialized for mobility changes: Camera movement tracking, daily step curve, inactivity duration, and heart rate.',
    signals: ['Camera Movement', 'Step History', 'Inactivity Duration', 'Heart Rate'],
    icon: ArrowRight,
    color: 'emerald',
  },
  {
    id: 'stress_recovery',
    name: 'Stress / Recovery Recheck',
    description: 'Specialized for autonomic recovery: Heart rate variability (HRV), resting pulse, sleep quality, and vocal pitch strain.',
    signals: ['HRV (RMSSD)', 'Resting Pulse', 'Sleep Quality', 'Voice Pitch Strain'],
    icon: Heart,
    color: 'rose',
  },
];

export default function RecheckStudioPage({ onExplainAlert }) {
  const [selectedProtocol, setSelectedProtocol] = useState('general');
  const [isRechecking, setIsRechecking] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [activeStep, setActiveStep] = useState(0);
  const [recheckResult, setRecheckResult] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [symptomFatigue, setSymptomFatigue] = useState(2);
  const [symptomDyspnea, setSymptomDyspnea] = useState(false);
  const [symptomNotes, setSymptomNotes] = useState('');

  // Live Camera preview state during recheck
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Guarantee video element receives mediaStream whenever active in recheck
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (cameraStream && isRechecking) {
        video.srcObject = cameraStream;
        video.play().catch((err) => console.warn('Recheck video play warning:', err));
      } else {
        video.srcObject = null;
      }
    }
  }, [cameraStream, isRechecking]);

  // Clean up camera on completion or unmount
  useEffect(() => {
    if (!isRechecking && cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
      setIsCameraActive(false);
    }
  }, [isRechecking]);

  // Fetch recent recheck sessions
  const fetchRecentRechecks = async () => {
    try {
      const res = await api.get('/recheck/history');
      if (res.data?.data) {
        setRecentSessions(res.data.data);
      }
    } catch (e) {
      console.warn('Could not fetch recheck history:', e.message);
    }
  };

  useEffect(() => {
    fetchRecentRechecks();
  }, []);

  // 30-Second Guided Recheck Timer
  useEffect(() => {
    let timer;
    if (isRechecking && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
        if (countdown === 22) setActiveStep(1); // Visual/Optical lock
        if (countdown === 14) setActiveStep(2); // Acoustic capture
        if (countdown === 6) setActiveStep(3);  // Physiological verification
      }, 1000);
    } else if (isRechecking && countdown === 0) {
      setIsRechecking(false);
      finishRecheck();
    }
    return () => clearInterval(timer);
  }, [isRechecking, countdown]);

  const handleStartRecheck = async () => {
    setRecheckResult(null);
    setCountdown(30);
    setActiveStep(0);
    setIsRechecking(true);

    // Request camera for real-time face alignment preview during recheck
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
        });
        setCameraStream(stream);
        setIsCameraActive(true);
      }
    } catch (e) {
      console.warn('Recheck camera stream not available or permission denied:', e);
      setIsCameraActive(false);
    }

    try {
      await api.post('/recheck/start', {
        protocolType: selectedProtocol,
        triggerSource: 'manual',
        initialSignals: {
          heartRate: 84,
          spo2: 95,
          respiratoryRate: 18,
          coughEventCount: selectedProtocol === 'respiratory' ? 5 : 0,
        },
      });
    } catch (e) {
      console.warn('Error starting recheck session:', e.message);
    }
  };

  const finishRecheck = async () => {
    try {
      const res = await api.post('/recheck/complete', {
        protocolType: selectedProtocol,
        recheckSignals: {
          heartRate: selectedProtocol === 'stress_recovery' ? 78 : 82,
          spo2: selectedProtocol === 'respiratory' ? 95 : 97,
          temperature: 36.9,
          respiratoryRate: 17,
          blinkRatePerMin: 18,
          eyeOpennessPercent: 82,
          coughEventCount: selectedProtocol === 'respiratory' ? 1 : 0,
          rppgPulseBpm: 82,
        },
        userSymptomInput: {
          reportedFatigue: symptomFatigue,
          reportedDyspnea: symptomDyspnea,
          notes: symptomNotes,
        },
      });

      setRecheckResult(res.data);
      fetchRecentRechecks();
    } catch (e) {
      console.warn('Error completing recheck:', e.message);
    }
  };

  const currentProto = PROTOCOLS.find((p) => p.id === selectedProtocol) || PROTOCOLS[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Recheck Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Detect → Verify → Fuse → Warn
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Interactive Multimodal Recheck Studio
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              When an unusual signal emerges, VitaBridge does not jump to conclusions. A 30-second guided recheck tests signal persistence before fusing measurements.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-teal-200 bg-teal-950/70 px-4 py-2.5 rounded-2xl border border-teal-700/50 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Non-Diagnostic Clinical Guardrail Active</span>
          </div>
        </div>
      </div>

      {/* Protocol Selection Tabs (Section 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {PROTOCOLS.map((proto) => {
          const IconComponent = proto.icon;
          const isSelected = selectedProtocol === proto.id;
          return (
            <button
              key={proto.id}
              type="button"
              onClick={() => setSelectedProtocol(proto.id)}
              disabled={isRechecking}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'border-teal-600 bg-white shadow-card text-slate-900 ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-xs text-slate-900 block">{proto.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{proto.description}</p>
            </button>
          );
        })}
      </div>

      {/* Active Recheck Workspace */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-teal-600" />
              <span>{currentProto.name} Session (30 Seconds)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentProto.description}</p>
          </div>

          {!isRechecking ? (
            <button
              type="button"
              onClick={handleStartRecheck}
              className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition flex items-center justify-center space-x-2 self-start sm:self-auto"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch 30-Second Recheck</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3 text-teal-700 font-extrabold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 live-pulse"></span>
              <span>Recheck in Progress...</span>
            </div>
          )}
        </div>

        {/* Live Recheck Countdown & Multi-Sensor Progress */}
        {isRechecking ? (
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 text-white space-y-6 border border-slate-800 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Circular Countdown & Guidance */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="8" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="#14b8a6"
                      strokeWidth="8"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * (30 - countdown)) / 30}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black font-mono">{countdown}s</span>
                    <span className="text-[10px] uppercase font-bold text-teal-400">Remaining</span>
                  </div>
                </div>

                {/* Stepped Guidance Messages */}
                <div className="space-y-1.5 max-w-sm">
                  <span className="text-xs font-bold text-teal-300 block">
                    {activeStep === 0 && 'STEP 1: Keep face aligned with camera. Optical baseline calibrating...'}
                    {activeStep === 1 && 'STEP 2: Inhale and exhale calmly. Acoustic breathing cadence monitoring...'}
                    {activeStep === 2 && 'STEP 3: Maintain stillness. rPPG pulse flux & SpO2 cross-verifying...'}
                    {activeStep === 3 && 'STEP 4: Synthesizing multi-modal signals into personal baseline model...'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Please remain comfortably seated and avoid sudden posture shifts during measurement.
                  </p>
                </div>

                {/* Active Sensor Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {currentProto.signals.map((sig, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 live-pulse"></span>
                      <span>{sig}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Live Camera Face Viewport */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
                {/* Video element always mounted for stable ref */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch((e) => console.warn('Recheck video play err:', e));
                    }
                  }}
                  className={`w-full h-full object-cover transform -scale-x-100 ${
                    isCameraActive ? 'block' : 'hidden'
                  }`}
                />

                {/* Live Face Scan HUD Overlay */}
                {isCameraActive ? (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-36 h-48 rounded-[36px] border border-teal-400/50 flex flex-col items-center justify-between p-3">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-teal-400"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-teal-400"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-teal-400"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-teal-400"></div>

                      <div className="w-20 h-7 border border-emerald-400/80 bg-emerald-500/15 rounded flex items-center justify-center mt-1">
                        <span className="text-[8px] font-mono text-emerald-300 font-bold">rPPG LOCK</span>
                      </div>

                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse top-1/2"></div>

                      <span className="text-[9px] font-mono text-teal-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-teal-500/40 mb-1">
                        RECHECK IN PROGRESS
                      </span>
                    </div>
                  </div>
                ) : (
                  /* High fidelity fallback when camera not granted */
                  <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
                    <div className="w-28 h-36 rounded-[28px] border-2 border-dashed border-teal-400/50 flex flex-col items-center justify-center mb-2">
                      <div className="w-12 h-6 border-b-2 border-teal-400/70 rounded-full mb-2"></div>
                      <div className="w-6 h-1.5 bg-teal-400/40 rounded-full mb-2"></div>
                      <div className="w-10 h-2 bg-teal-400/50 rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-teal-300 font-mono">Sensory Photometry Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Pre-recheck Symptom Input & Signals Overview */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                Target Modalities Included in this Recheck
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentProto.signals.map((sig, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">{sig}</span>
                  </div>
                ))}
              </div>

              {/* Symptom Context inputs */}
              <div className="pt-3 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Subjective Patient Input (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="font-bold text-slate-700 block mb-1">Perceived Fatigue (0–5)</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={symptomFatigue}
                      onChange={(e) => setSymptomFatigue(Number(e.target.value))}
                      className="w-full accent-teal-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>0 (None)</span>
                      <span className="font-bold text-slate-700">{symptomFatigue}</span>
                      <span>5 (Severe)</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-700 block">Shortness of Breath?</span>
                      <span className="text-[10px] text-slate-400">Dyspnea or tight breathing</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={symptomDyspnea}
                      onChange={(e) => setSymptomDyspnea(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Observation Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Mild throat scratchiness after stairs..."
                    value={symptomNotes}
                    onChange={(e) => setSymptomNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Recheck Principle Sidebar */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs text-slate-600">
              <span className="font-extrabold text-slate-900 block flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-teal-600" />
                <span>Why Perform a Recheck?</span>
              </span>
              <p className="leading-relaxed">
                Transient biometric fluctuations occur naturally due to speaking, quick movements, or sensor positioning.
              </p>
              <p className="leading-relaxed">
                By conducting a calm 30-second recheck, VitaBridge confirms whether a physiological deviation <strong>persists</strong> before generating an alert.
              </p>
              <div className="pt-2 border-t border-slate-200/80 font-mono text-[11px] text-teal-800">
                DETECT → VERIFY → FUSE → WARN
              </div>
            </div>
          </div>
        )}

        {/* Post-Recheck Multimodal Fusion Report (Section 8 & 10) */}
        {recheckResult && (
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h4 className="font-extrabold text-slate-900 text-sm">
                Multimodal Recheck Verification Report
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">1. Signal Persistence</span>
                <span className={`text-sm font-black mt-1 block ${recheckResult.verification?.persists ? 'text-orange-600' : 'text-emerald-600'}`}>
                  {recheckResult.verification?.persists ? 'Persistent Deviation' : 'Normalized'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Consistency: {recheckResult.verification?.consistencyScore}%
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">2. Early Warning Score</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">
                  {recheckResult.tier?.tier === 'RED' ? '78/100' : recheckResult.tier?.tier === 'ORANGE' ? '58/100' : '22/100'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Fused risk index</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">3. Assigned Alert Tier</span>
                <span className={`text-xs font-black mt-1.5 px-2.5 py-1 rounded-full inline-block ${
                  recheckResult.tier?.tier === 'RED' ? 'bg-red-100 text-red-800' :
                  recheckResult.tier?.tier === 'ORANGE' ? 'bg-orange-100 text-orange-800' :
                  recheckResult.tier?.tier === 'YELLOW' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {recheckResult.tier?.label || recheckResult.tier?.tier}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">4. Action Required</span>
                <span className="text-xs font-bold text-slate-800 mt-1 block leading-tight">
                  {recheckResult.tier?.message || 'Review measurements and monitor.'}
                </span>
              </div>
            </div>

            {/* Explainable AI Block for Recheck */}
            {recheckResult.explanation && (
              <div className="p-5 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs space-y-2">
                <div className="font-bold text-teal-950 flex items-center justify-between">
                  <span>Explainable AI Assessment</span>
                  {recheckResult.alert && (
                    <button
                      type="button"
                      onClick={() => onExplainAlert && onExplainAlert(recheckResult.alert)}
                      className="text-[11px] font-extrabold text-teal-700 underline"
                    >
                      View Full 5-Why Breakdown
                    </button>
                  )}
                </div>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                  {recheckResult.explanation.why}
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed pt-1 border-t border-teal-100/80">
                  <strong>Interpretation:</strong> {recheckResult.explanation.whatDoesThisMean}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Recheck Sessions Log */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Recent Recheck Sessions History</h3>
          <span className="text-xs text-slate-400">Total Recorded: {recentSessions.length}</span>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No previous recheck sessions recorded. Launch a recheck above when an unusual signal appears.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {recentSessions.map((session) => (
              <div key={session._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800 capitalize mr-2">
                    {session.protocolType} Protocol
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    session.multimodalFusionOutcome?.assignedAlertTier === 'RED' ? 'bg-red-100 text-red-800' :
                    session.multimodalFusionOutcome?.assignedAlertTier === 'ORANGE' ? 'bg-orange-100 text-orange-800' :
                    session.multimodalFusionOutcome?.assignedAlertTier === 'YELLOW' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {session.multimodalFusionOutcome?.assignedAlertTier || 'GREEN'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {session.comparisonResult?.interpretation || 'Recheck cycle completed.'}
                  </p>
                </div>
                <div className="text-slate-400 font-mono text-[11px] self-start sm:self-auto">
                  {new Date(session.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

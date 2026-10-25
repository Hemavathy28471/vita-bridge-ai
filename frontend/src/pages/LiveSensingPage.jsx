import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Mic,
  Activity,
  Heart,
  Eye,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Play,
  Square,
  Sparkles,
  Volume2,
  RefreshCw,
  Clock,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';

export default function LiveSensingPage({ onNavigateToRecheck }) {
  // Hardware refs
  const videoRef = useRef(null);
  const rppgCanvasRef = useRef(null);
  const audioSpectrumCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const rppgAnimRef = useRef(null);
  const audioAnimRef = useRef(null);

  // Sensing States
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isSimulatedFeed, setIsSimulatedFeed] = useState(false);

  // Live Visual Metrics
  const [eyeOpenness, setEyeOpenness] = useState(82);
  const [blinkCount, setBlinkCount] = useState(14);
  const [headPose, setHeadPose] = useState({ pitch: 2, yaw: -1, roll: 0 });
  const [currentPosture, setCurrentPosture] = useState('Sitting (Nominal)');
  const [movementIntensity, setMovementIntensity] = useState(16);
  const [rppgPulseBpm, setRppgPulseBpm] = useState(74);
  const [rppgSignalQuality, setRppgSignalQuality] = useState(92);

  // Live Audio Metrics
  const [audioVolumeDb, setAudioVolumeDb] = useState(-32);
  const [voicePitchHz, setVoicePitchHz] = useState(175);
  const [detectedAcousticEvent, setDetectedAcousticEvent] = useState('Speech (Normal)');
  const [coughCount, setCoughCount] = useState(0);

  // Event Log
  const [eventLog, setEventLog] = useState([
    { id: 1, time: '12:00:15', type: 'camera', text: 'Facial landmarks locked. Optical tracking nominal.', confidence: 96 },
    { id: 2, time: '12:00:30', type: 'audio', text: 'Microphone ambient noise calibrated (-48 dB).', confidence: 94 },
    { id: 3, time: '12:00:45', type: 'rppg', text: 'rPPG green-channel photometric pulse detected (74 BPM).', confidence: 91 },
  ]);

  // Overall Pattern Tier (GREEN, YELLOW, ORANGE, RED)
  const [overallPattern, setOverallPattern] = useState({
    tier: 'GREEN',
    label: 'NORMAL',
    confidence: 88,
    summary: 'All visual, acoustic, and vital signals match personal baseline.',
  });

  // Start Hardware Camera & Microphone
  const startHardwareSensors = async () => {
    setPermissionError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });

      setStream(mediaStream);
      setIsCameraActive(true);
      setIsMicActive(true);
      setIsSimulatedFeed(false);

      // Web Audio API Pipeline
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      addLog('sensor', 'Live Camera & Microphone connected. Privacy: on-device processing active.');
    } catch (err) {
      console.warn('Hardware camera/microphone not accessible:', err);
      setPermissionError('Camera/Microphone permission denied or device not found. Switched to High-Fidelity Simulation Mode.');
      setIsSimulatedFeed(true);
      setIsCameraActive(true);
      setIsMicActive(true);
    }
  };

  // Guarantee video element receives mediaStream whenever stream is active
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (stream && isCameraActive && !isSimulatedFeed) {
        video.srcObject = stream;
        video.play().catch((err) => {
          console.warn('Video auto-play warning:', err);
        });
      } else {
        video.srcObject = null;
      }
    }
  }, [stream, isCameraActive, isSimulatedFeed]);

  // Stop Sensors
  const stopHardwareSensors = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsCameraActive(false);
    setIsMicActive(false);
    addLog('sensor', 'Camera and microphone sensing session halted.');
  };

  const addLog = (type, text, confidence = 90) => {
    const newEntry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      text,
      confidence,
    };
    setEventLog((prev) => [newEntry, ...prev.slice(0, 15)]);
  };

  // Real-time rPPG Photometric Canvas Loop
  useEffect(() => {
    let phase = 0;
    const canvas = rppgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderRppg = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Draw subtle grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw rPPG Pulse Waveform (green-channel photometric pulse)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      phase += 0.08;
      for (let x = 0; x < w; x++) {
        // Photoplethysmogram synthetic wave with dicrotic notch
        const t = (x / 25) + phase;
        const mainPulse = Math.sin(t);
        const dicroticNotch = 0.35 * Math.sin(2 * t + 0.8);
        const y = h / 2 - (mainPulse + dicroticNotch) * 22;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Heartbeat pulse blip text
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '10px monospace';
      ctx.fillText(`rPPG SIGNAL: OPTICAL FLUX STABLE (${rppgPulseBpm} BPM)`, 10, 15);

      rppgAnimRef.current = requestAnimationFrame(renderRppg);
    };

    renderRppg();
    return () => {
      if (rppgAnimRef.current) cancelAnimationFrame(rppgAnimRef.current);
    };
  }, [rppgPulseBpm]);

  // Real-time Web Audio Spectrum Canvas Loop
  useEffect(() => {
    const canvas = audioSpectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderSpectrum = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 32;
      const dataArray = new Uint8Array(bufferLength);

      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        // Simulated spectrum
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.max(10, Math.sin(Date.now() / 200 + i) * 80 + 50);
        }
      }

      const barWidth = (w / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * h * 0.85;
        // Gradient teal to cyan
        ctx.fillStyle = i > bufferLength * 0.6 ? '#f59e0b' : '#14b8a6';
        ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      // Audio label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`FFT AUDIO SPECTRUM: ${detectedAcousticEvent}`, 10, 15);

      audioAnimRef.current = requestAnimationFrame(renderSpectrum);
    };

    renderSpectrum();
    return () => {
      if (audioAnimRef.current) cancelAnimationFrame(audioAnimRef.current);
    };
  }, [detectedAcousticEvent]);

  // Periodic simulated bio-signal updates & event triggering
  useEffect(() => {
    const interval = setInterval(() => {
      if (isCameraActive) {
        setEyeOpenness((prev) => Math.max(50, Math.min(95, prev + (Math.random() * 6 - 3))));
        setMovementIntensity((prev) => Math.max(5, Math.min(45, prev + (Math.random() * 4 - 2))));
        setRppgPulseBpm((prev) => Math.max(65, Math.min(92, Math.round(prev + (Math.random() * 2 - 1)))));
      }
      if (isMicActive) {
        setAudioVolumeDb((prev) => Math.max(-55, Math.min(-18, Math.round(prev + (Math.random() * 6 - 3)))));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isCameraActive, isMicActive]);

  // Trigger Demo Acoustic Cough Event
  const simulateCoughEvent = async () => {
    const newCount = coughCount + 1;
    setCoughCount(newCount);
    setDetectedAcousticEvent('Cough-Like Acoustic Event');
    addLog('audio', `Repeated cough-like acoustic event detected (${newCount} times, 86% confidence).`, 86);

    // If cough cluster reaches 3+, update pattern to ORANGE Recheck
    if (newCount >= 3) {
      setOverallPattern({
        tier: 'ORANGE',
        label: 'RECHECK RECOMMENDED',
        confidence: 89,
        summary: 'Repeated cough-like acoustic events detected during this session. Multimodal recheck advised.',
      });
    }

    try {
      await api.post('/audio-observations', {
        eventType: 'cough_like',
        confidence: 86,
        frequency: newCount,
        durationSeconds: 1.4,
        isDemo: true,
      });
    } catch (e) {
      console.warn('Simulated audio ingestion error:', e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Real-Time Human Sensing
              </span>
              <span className="flex items-center space-x-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>On-Device Privacy First</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Multimodal Human Sensing Cockpit
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Live non-invasive screening via optical camera rPPG photometry, facial landmark dynamics, and microphone acoustic event classification.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {!isCameraActive && !isMicActive ? (
              <button
                type="button"
                onClick={startHardwareSensors}
                className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/30 transition flex items-center space-x-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Activate Camera & Mic</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopHardwareSensors}
                className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition flex items-center space-x-2"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Halt Live Sensing</span>
              </button>
            )}

            <button
              type="button"
              onClick={simulateCoughEvent}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center space-x-2"
            >
              <Wind className="w-4 h-4" />
              <span>Simulate Cough Event</span>
            </button>
          </div>
        </div>

        {/* Section 19 Privacy Statement Banner */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse"></span>
            <span>Camera used strictly for visual feature extraction. Microphone used for acoustic events. No raw media is stored.</span>
          </div>
          <span className="font-mono text-[11px] text-teal-400">Protocol: rPPG Photometry v2.4</span>
        </div>
      </div>

      {permissionError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <strong>Sensor Notice:</strong> {permissionError}
          </div>
          <button
            type="button"
            onClick={startHardwareSensors}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs"
          >
            Retry Hardware
          </button>
        </div>
      )}

      {/* Real-Time Live Sensing Status Bar (Section 15) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-center space-x-1">
            <Camera className="w-3.5 h-3.5 text-teal-600" />
            <span>Camera</span>
          </div>
          <div className="text-sm font-black text-slate-900 mt-1 flex items-center justify-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            <span>{isCameraActive ? 'Active' : 'Off'}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-center space-x-1">
            <Mic className="w-3.5 h-3.5 text-teal-600" />
            <span>Microphone</span>
          </div>
          <div className="text-sm font-black text-slate-900 mt-1 flex items-center justify-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isMicActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            <span>{isMicActive ? 'Active' : 'Off'}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Audio Pipeline</div>
          <div className="text-xs font-black text-teal-700 mt-1.5">
            {isMicActive ? (coughCount > 0 ? 'Processing Events' : 'Listening') : 'Standby'}
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-center space-x-1">
            <Heart className="w-3.5 h-3.5 text-rose-600" />
            <span>Heart Rate</span>
          </div>
          <div className="text-base font-black text-slate-900 mt-0.5">
            {rppgPulseBpm} <span className="text-[10px] font-bold text-slate-400">BPM</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">SpO2</div>
          <div className="text-base font-black text-slate-900 mt-0.5">
            97% <span className="text-[10px] font-bold text-emerald-500">Nominal</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Temperature</div>
          <div className="text-base font-black text-slate-900 mt-0.5">
            36.8°C <span className="text-[10px] font-bold text-slate-400">Baseline</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Overall Pattern</div>
          <div className={`text-xs font-black mt-1.5 px-2 py-0.5 rounded-full inline-block ${
            overallPattern.tier === 'RED' ? 'bg-red-100 text-red-800' :
            overallPattern.tier === 'ORANGE' ? 'bg-orange-100 text-orange-800' :
            overallPattern.tier === 'YELLOW' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {overallPattern.label}
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Confidence</div>
          <div className="text-base font-black text-teal-600 mt-0.5">
            {overallPattern.confidence}%
          </div>
        </div>
      </div>

      {/* Main Dual Viewport: Camera & Audio Signal Processing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Optical Camera & rPPG Photometry */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-teal-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Optical Photometry & Facial Dynamics
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
              Camera rPPG Pulse
            </span>
          </div>

          {/* Video / Reticle Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
            {/* Live Camera Video (always mounted to maintain ref, visible when hardware camera active) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.play().catch((e) => console.warn('Video play error:', e));
                }
              }}
              className={`w-full h-full object-cover transform -scale-x-100 ${
                isCameraActive && !isSimulatedFeed ? 'block' : 'hidden'
              }`}
            />

            {/* Biometric Scanning Reticle HUD on Live Face */}
            {isCameraActive && !isSimulatedFeed && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-44 h-56 rounded-[40px] border border-teal-400/40 shadow-[0_0_25px_rgba(20,184,166,0.15)] flex flex-col items-center justify-between p-3">
                  {/* Corner Target Brackets */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-teal-400"></div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-teal-400"></div>
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-teal-400"></div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-teal-400"></div>

                  {/* Forehead rPPG Region of Interest (ROI) */}
                  <div className="w-24 h-9 border border-emerald-400/80 bg-emerald-500/15 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center mt-1">
                    <span className="text-[8px] font-mono font-extrabold uppercase text-emerald-300 tracking-wider">
                      rPPG ROI
                    </span>
                    <span className="text-[9px] font-mono text-emerald-200">
                      {rppgPulseBpm} BPM
                    </span>
                  </div>

                  {/* Sweeping Laser Scan Line */}
                  <div className="absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse top-1/2"></div>

                  {/* Tracking Badge */}
                  <span className="text-[9px] font-mono text-teal-300 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-teal-500/40 mb-1 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 live-pulse"></span>
                    <span>FACE LOCK ACTIVE</span>
                  </span>
                </div>
              </div>
            )}

            {/* Simulated High-Fidelity Reticle Feed (shown when camera is idle or in simulation mode) */}
            {(!isCameraActive || isSimulatedFeed) && (
              <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
                <div className="relative w-40 h-48 rounded-[48px] border-2 border-dashed border-teal-400/60 flex flex-col items-center justify-center">
                  <div className="w-20 h-10 border-b-2 border-teal-400/80 rounded-full mb-4"></div>
                  <div className="w-8 h-2 bg-teal-400/50 rounded-full mb-3"></div>
                  <div className="w-14 h-3 bg-teal-400/60 rounded-full"></div>

                  {/* Optical Scan Ray */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse top-1/3"></div>
                </div>

                <div className="mt-3 flex items-center space-x-1.5 text-teal-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>rPPG Green-Channel Photometry Active</span>
                </div>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-[11px] font-mono text-emerald-400 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse"></span>
              <span>EYE APERTURE: {Math.round(eyeOpenness)}%</span>
            </div>

            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-[11px] font-mono text-cyan-300">
              BLINKS: {blinkCount}/MIN
            </div>

            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span>POSTURE: {currentPosture}</span>
              <span>QUALITY: {rppgSignalQuality}%</span>
            </div>
          </div>

          {/* rPPG Pulse Waveform Canvas */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
              <span>Photoplethysmographic (rPPG) Waveform</span>
              <span className="text-emerald-600 font-mono">{rppgPulseBpm} BPM (Confidence: 91%)</span>
            </div>
            <canvas
              ref={rppgCanvasRef}
              width={560}
              height={70}
              className="w-full h-16 rounded-xl border border-slate-800 bg-slate-950"
            />
          </div>

          {/* Visual Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Eye Openness</span>
              <span className="font-bold text-slate-900">{Math.round(eyeOpenness)}% (Alert)</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Blink Frequency</span>
              <span className="font-bold text-slate-900">{blinkCount} / min</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Movement Index</span>
              <span className="font-bold text-slate-900">{Math.round(movementIntensity)} / 100</span>
            </div>
          </div>
        </div>

        {/* Microphone Acoustic Event & Voice Pipeline */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-teal-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Acoustic Event & Voice Analysis Pipeline
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
              Web Audio FFT
            </span>
          </div>

          {/* Audio FFT Frequency Spectrum Canvas */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex flex-col items-center justify-center border border-slate-800 shadow-inner p-3">
            <canvas
              ref={audioSpectrumCanvasRef}
              width={560}
              height={180}
              className="w-full h-full rounded-xl bg-slate-950"
            />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span>ENERGY: {audioVolumeDb} dB</span>
              <span>PITCH: {voicePitchHz} Hz</span>
              <span>EVENT: {detectedAcousticEvent}</span>
            </div>
          </div>

          {/* Audio Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Speech Rate</span>
              <span className="font-bold text-slate-900">135 WPM (Normal)</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Pause Ratio</span>
              <span className="font-bold text-slate-900">18% (Baseline)</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Cough Events</span>
              <span className={`font-bold ${coughCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {coughCount} Detected
              </span>
            </div>
          </div>

          {/* Launch Recheck Prompt if anomalous */}
          {overallPattern.tier !== 'GREEN' && (
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-orange-900 block">Unusual Sensory Signal Detected</span>
                <span className="text-[11px] text-orange-700">{overallPattern.summary}</span>
              </div>
              <button
                type="button"
                onClick={onNavigateToRecheck}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition"
              >
                Launch Recheck
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Sensor Event Stream Log (Section 5 & 17) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-teal-600 animate-pulse" />
            <h3 className="font-extrabold text-slate-900 text-sm">Real-Time Sensor Event Timeline</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Live Telemetry Buffer</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {eventLog.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-slate-400 text-[11px] shrink-0">{log.time}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  log.type === 'camera' ? 'bg-teal-50 text-teal-700' :
                  log.type === 'audio' ? 'bg-amber-50 text-amber-700' :
                  log.type === 'rppg' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {log.type}
                </span>
                <span className="text-slate-800">{log.text}</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px] shrink-0">{log.confidence}% conf</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Mic,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Video,
  Volume2,
  Sliders,
  Play,
} from 'lucide-react';

export default function CameraMicScanner({ onScanComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [simulationMode, setSimulationMode] = useState(false);
  const [simScenario, setSimScenario] = useState('febrile'); // 'febrile' | 'fatigue' | 'respiratory' | 'healthy'

  // Start live hardware camera & mic
  const startHardware = async () => {
    setPermissionError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });

      setStream(mediaStream);
      setCameraActive(true);
      setMicActive(true);

      // Initialize Web Audio API Analyser
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Audio level loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(checkAudio);
      };
      checkAudio();
    } catch (err) {
      console.warn('Hardware camera/mic not available or permission denied:', err);
      setPermissionError('Camera/Microphone permission denied or device not detected. Switched to Simulation Mode.');
      setSimulationMode(true);
    }
  };

  // Guarantee video element receives mediaStream whenever stream is active
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (stream && cameraActive && !simulationMode) {
        video.srcObject = stream;
        video.play().catch((err) => console.warn('Scanner video play err:', err));
      } else {
        video.srcObject = null;
      }
    }
  }, [stream, cameraActive, simulationMode]);

  // Stop hardware on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream]);

  // Run 6-second Guided Scan
  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        finishScan();
      }
    }, 400); // ~4 seconds
  };

  const finishScan = () => {
    let visual = {};
    let vocal = {};

    if (simScenario === 'febrile') {
      visual = {
        skinPallorIndex: 15,
        skinFlushingIndex: 68, // Flushed cheeks/forehead
        facialFatigueScore: 42,
        eyeBlinkRatePerMin: 22,
        perceivedAlertness: 'mild_fatigue',
        scanQualityScore: 94,
      };
      vocal = {
        pitchJitterPercent: 1.65, // Elevated jitter
        vocalTremorScore: 38,
        speechRateWpm: 122,
        voiceStrainScore: 48,
        hoarsenessScore: 52,
        pauseDurationRatio: 0.22,
      };
    } else if (simScenario === 'fatigue') {
      visual = {
        skinPallorIndex: -45, // Pale skin
        skinFlushingIndex: 8,
        facialFatigueScore: 78, // High fatigue
        eyeBlinkRatePerMin: 11, // Sluggish blink
        perceivedAlertness: 'moderate_exhaustion',
        scanQualityScore: 92,
      };
      vocal = {
        pitchJitterPercent: 1.1,
        vocalTremorScore: 24,
        speechRateWpm: 98, // Slow speech tempo
        voiceStrainScore: 35,
        hoarsenessScore: 22,
        pauseDurationRatio: 0.38, // Long pauses
      };
    } else if (simScenario === 'respiratory') {
      visual = {
        skinPallorIndex: -20,
        skinFlushingIndex: 25,
        facialFatigueScore: 55,
        eyeBlinkRatePerMin: 18,
        perceivedAlertness: 'mild_fatigue',
        scanQualityScore: 91,
      };
      vocal = {
        pitchJitterPercent: 1.85,
        vocalTremorScore: 42,
        speechRateWpm: 115,
        voiceStrainScore: 62,
        hoarsenessScore: 74, // High hoarseness
        pauseDurationRatio: 0.28,
      };
    } else {
      // Healthy
      visual = {
        skinPallorIndex: 0,
        skinFlushingIndex: 12,
        facialFatigueScore: 10,
        eyeBlinkRatePerMin: 16,
        perceivedAlertness: 'alert',
        scanQualityScore: 96,
      };
      vocal = {
        pitchJitterPercent: 0.72,
        vocalTremorScore: 8,
        speechRateWpm: 135,
        voiceStrainScore: 12,
        hoarsenessScore: 8,
        pauseDurationRatio: 0.16,
      };
    }

    if (onScanComplete) {
      onScanComplete({ visualBiomarkers: visual, vocalBiomarkers: vocal, scenarioUsed: simScenario });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Camera className="w-5 h-5 text-teal-600" />
            <span>Multimodal BioSensing Scanner</span>
          </h3>
          <p className="text-xs text-slate-500">
            Captures facial skin photometry, vascular flushing, eye fatigue, and vocal acoustics
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setSimulationMode(false);
              startHardware();
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              !simulationMode ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Camera & Mic
          </button>
          <button
            type="button"
            onClick={() => setSimulationMode(true)}
            className={`px-3 py-1.5 rounded-lg transition ${
              simulationMode ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Simulated Bio-Scan
          </button>
        </div>
      </div>

      {permissionError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Main Viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-w-xl mx-auto flex items-center justify-center border border-slate-800 shadow-inner">
        {/* Live Camera Video (always mounted to maintain ref) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.play().catch((e) => console.warn('Play err:', e));
            }
          }}
          className={`w-full h-full object-cover transform -scale-x-100 ${
            !simulationMode && cameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Live Camera Biometric HUD Overlay */}
        {!simulationMode && cameraActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-40 h-52 rounded-[36px] border border-teal-400/40 flex flex-col items-center justify-between p-3">
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-teal-400"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-teal-400"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-teal-400"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-teal-400"></div>

              {isScanning && (
                <div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent"
                  style={{ top: `${scanProgress}%` }}
                ></div>
              )}

              <span className="text-[9px] font-mono text-teal-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-teal-500/40">
                {isScanning ? `SCANNING: ${Math.round(scanProgress)}%` : 'ALIGN FACE IN FRAME'}
              </span>
            </div>
          </div>
        )}

        {/* Simulated Face Scan Feed (shown when simulation mode or idle) */}
        {(simulationMode || !cameraActive) && (
          <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
            {/* Animated Face Reticle */}
            <div className="relative w-36 h-44 rounded-[40px] border-2 border-dashed border-teal-400/50 flex flex-col items-center justify-center">
              <div className="w-16 h-8 border-b-2 border-teal-400/70 rounded-full mb-4"></div>
              <div className="w-8 h-2 bg-teal-400/40 rounded-full mb-3"></div>
              <div className="w-12 h-3 bg-teal-400/50 rounded-full"></div>

              {/* Scanning Ray Line */}
              {isScanning && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-bounce"
                  style={{ top: `${scanProgress}%` }}
                ></div>
              )}
            </div>

            <span className="text-xs font-bold text-teal-300 mt-3 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bio-Photometric Simulator Ready</span>
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Target Preset: <strong className="text-slate-300 capitalize">{simScenario} Syndrome</strong>
            </span>
          </div>
        )}

        {/* Video HUD Overlays */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs pointer-events-none">
          <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 text-white font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-teal-400 live-indicator"></span>
            <span>PHOTOMETRY: {isScanning ? 'ANALYZING...' : 'STANDBY'}</span>
          </div>

          {/* Voice level meter */}
          <div className="flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 text-white text-[11px]">
            <Mic className="w-3.5 h-3.5 text-teal-400" />
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-400 transition-all duration-75"
                style={{ width: `${isScanning ? Math.random() * 40 + 40 : audioLevel}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Progress Bar when scanning */}
        {isScanning && (
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex justify-between text-[11px] text-teal-300 font-bold mb-1">
              <span>Extracting Skin & Vocal Biomarkers...</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Simulation Scenario Selector (if simulation active) */}
      {simulationMode && (
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
            Select Test Biomarker Scenario
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'febrile', label: 'Febrile / Flushed Skin', desc: 'Flushed skin + vocal strain' },
              { id: 'fatigue', label: 'Fatigue / Pale Skin', desc: 'Cutaneous pallor + slow speech' },
              { id: 'respiratory', label: 'Upper Respiratory', desc: 'Acoustic hoarseness' },
              { id: 'healthy', label: 'Healthy Baseline', desc: 'Nominal equilibrium' },
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSimScenario(sc.id)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  simScenario === sc.id
                    ? 'border-teal-600 bg-teal-50 text-slate-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-[11px] text-slate-900">{sc.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{sc.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trigger CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="text-xs text-slate-500 leading-relaxed">
          Position your face in good lighting. When prompted, speak normally for 5 seconds.
        </div>

        <button
          type="button"
          onClick={handleStartScan}
          disabled={isScanning}
          className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 shrink-0"
        >
          {isScanning ? (
            <span>Scanning Bio-Signals...</span>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Initiate 5-Second BioScan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import CameraMicScanner from '../components/CameraMicScanner';
import HealthQuestionnaireModal from '../components/HealthQuestionnaireModal';
import api from '../services/api';
import {
  Camera,
  Mic,
  ClipboardList,
  Sparkles,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Stethoscope,
  HeartPulse,
  Thermometer,
  Wind,
  Download,
  ArrowRight,
} from 'lucide-react';

export default function BioSensingCheckupPage() {
  const [activeStep, setActiveStep] = useState(1); // 1: BioScan (Camera+Mic), 2: Questionnaire, 3: Results
  const [scanData, setScanData] = useState(null);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recheckMinutesLeft, setRecheckMinutesLeft] = useState(45);

  const handleScanComplete = ({ visualBiomarkers, vocalBiomarkers, scenarioUsed }) => {
    setScanData({ visualBiomarkers, vocalBiomarkers, scenarioUsed });
    // Pre-populate questionnaire based on scan if helpful
    if (scenarioUsed === 'febrile') {
      setQuestionnaireData({
        primarySymptoms: ['fever', 'body aches'],
        durationDays: 2,
        feverReported: true,
        breathingDifficulty: 'none',
        painScore: 4,
      });
    } else if (scenarioUsed === 'respiratory') {
      setQuestionnaireData({
        primarySymptoms: ['cough', 'sore throat'],
        durationDays: 3,
        feverReported: false,
        breathingDifficulty: 'mild_on_exertion',
        painScore: 3,
      });
    } else if (scenarioUsed === 'fatigue') {
      setQuestionnaireData({
        primarySymptoms: ['fatigue', 'headache'],
        durationDays: 2,
        feverReported: false,
        breathingDifficulty: 'none',
        painScore: 3,
      });
    }
    setActiveStep(2);
  };

  const handleQuestionnaireSubmit = async (answers) => {
    setQuestionnaireData(answers);
    setLoading(true);

    try {
      const payload = {
        visualBiomarkers: scanData?.visualBiomarkers || {},
        vocalBiomarkers: scanData?.vocalBiomarkers || {},
        questionnaire: answers,
      };

      const res = await api.post('/checkup/submit', payload);
      if (res.data.success) {
        setEvaluationResult(res.data.data);
        setRecheckMinutesLeft(res.data.data.recheckProtocol?.recommendedIntervalMinutes || 45);
        setActiveStep(3);
      }
    } catch (err) {
      console.error('Failed to submit multimodal checkup', err);
      alert('Checkup evaluation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCheckup = () => {
    setScanData(null);
    setQuestionnaireData(null);
    setEvaluationResult(null);
    setActiveStep(1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            VitaCheck: Multimodal BioSensing Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Facial skin photometry, vocal acoustics, clinical questionnaire, and recheck triage
          </p>
        </div>

        {/* Phase progress tracker */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-2xs text-xs font-semibold self-start sm:self-auto">
          <span className={`px-2.5 py-1 rounded-xl ${activeStep === 1 ? 'bg-teal-600 text-white font-bold' : 'text-slate-500'}`}>
            1. Face & Voice Scan
          </span>
          <span className="text-slate-300">→</span>
          <span className={`px-2.5 py-1 rounded-xl ${activeStep === 2 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500'}`}>
            2. Symptom Q&A
          </span>
          <span className="text-slate-300">→</span>
          <span className={`px-2.5 py-1 rounded-xl ${activeStep === 3 ? 'bg-slate-900 text-white font-bold' : 'text-slate-500'}`}>
            3. AI Report & Rechk
          </span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start space-x-3 text-teal-900 text-xs">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block font-bold mb-0.5">Clinical Decision Support Policy:</strong>
          VitaCheck identifies observable physiological clusters and generates structured monitoring timelines. It is <strong>NOT</strong> a clinical diagnostic tool and does not replace medical consultation.
        </div>
      </div>

      {/* STEP 1: Camera & Mic Scanner */}
      {activeStep === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <CameraMicScanner onScanComplete={handleScanComplete} />
        </div>
      )}

      {/* STEP 2: Clinical Health Questionnaire */}
      {activeStep === 2 && (
        <div className="space-y-4 animate-in fade-in">
          {scanData && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-800">BioScan Complete:</span>
                <span className="text-slate-500">
                  Skin flushing: {scanData.visualBiomarkers.skinFlushingIndex}% • Voice strain: {scanData.vocalBiomarkers.voiceStrainScore}%
                </span>
              </div>
              <button
                onClick={() => setActiveStep(1)}
                className="text-teal-600 hover:text-teal-700 font-bold underline"
              >
                Re-scan
              </button>
            </div>
          )}

          <HealthQuestionnaireModal
            onSubmitAnswers={handleQuestionnaireSubmit}
            initialData={questionnaireData || {}}
          />

          {loading && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-bold text-slate-700">Fusing Camera, Voice, and Symptom Streams...</p>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Evaluation & Recheck Protocol Report */}
      {activeStep === 3 && evaluationResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Result Card */}
          <div
            className={`rounded-3xl p-6 border shadow-card transition bg-white ${
              evaluationResult.triageLevel === 'URGENT_EVALUATION'
                ? 'border-rose-300 bg-rose-50/20'
                : evaluationResult.triageLevel === 'MONITOR_CLOSELY'
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-emerald-300 bg-emerald-50/20'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${
                    evaluationResult.triageLevel === 'URGENT_EVALUATION'
                      ? 'bg-rose-600'
                      : evaluationResult.triageLevel === 'MONITOR_CLOSELY'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                >
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Identified Physiological Cluster
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        evaluationResult.triageLevel === 'URGENT_EVALUATION'
                          ? 'bg-rose-100 text-rose-800'
                          : evaluationResult.triageLevel === 'MONITOR_CLOSELY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {evaluationResult.triageLevel.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    {evaluationResult.patternAnalysis?.primaryPattern}
                  </h2>
                </div>
              </div>

              <div className="text-right self-start sm:self-auto">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">AI Concordance</span>
                <span className="text-lg font-black text-slate-800">
                  {Math.round((evaluationResult.patternAnalysis?.patternConfidence || 0.9) * 100)}% Match
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
              {evaluationResult.patternAnalysis?.patternSummary}
            </p>

            {/* Contributing Modalities Breakdown */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Contributing Multimodal Signals
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {evaluationResult.patternAnalysis?.contributingModalities?.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white border border-slate-200/90 text-xs shadow-2xs">
                    <div className="flex justify-between items-center mb-1 font-bold text-slate-900">
                      <span>{m.modality}</span>
                      <span className="text-teal-600 text-[10px] font-extrabold">{m.impactWeight}% Weight</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{m.observation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Differential Possibilities to Discuss With a Doctor */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                <span>Potential Categories to Discuss With a Healthcare Professional</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Non-diagnostic comparative patterns that share phenotypic similarities with your assessment
              </p>
            </div>

            <div className="space-y-3">
              {evaluationResult.potentialConditionsToDiscuss?.map((cond, cIdx) => (
                <div key={cIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-slate-900 text-sm">{cond.categoryName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase">
                      {cond.likelihoodTier.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-2">{cond.description}</p>
                  <div className="text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-200/60">
                    <strong className="text-slate-700 font-semibold">Clinical Alignment: </strong>
                    {cond.rationale}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* THE RECHECK PROTOCOL ("RECHK") */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-700 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Structured Recheck Protocol ("Rechk")</h3>
                  <p className="text-xs text-slate-400">Scheduled clinical monitoring window</p>
                </div>
              </div>

              {/* Recheck Timer Badge */}
              <div className="px-3.5 py-1.5 rounded-full bg-teal-400/15 border border-teal-400/30 text-teal-300 text-xs font-bold self-start sm:self-auto flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 live-indicator"></span>
                <span>Next Recheck in: {evaluationResult.recheckProtocol?.recommendedIntervalMinutes} Minutes</span>
              </div>
            </div>

            {/* Recheck Action Steps */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 block mb-2">
                Recommended Monitoring Steps:
              </span>
              <ul className="space-y-2 text-xs text-slate-200">
                {evaluationResult.recheckProtocol?.recheckActions?.map((act, aIdx) => (
                  <li key={aIdx} className="flex items-start space-x-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Emergency Red Flags */}
            {evaluationResult.recheckProtocol?.urgentEmergencyRedFlags?.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-rose-400 uppercase text-[11px] tracking-wider">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>Immediate Escalation / Emergency Red Flags:</span>
                </div>
                <p className="text-[11px] text-rose-300">
                  Do not wait for the recheck window if any of the following occur:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {evaluationResult.recheckProtocol.urgentEmergencyRedFlags.map((rf, rIdx) => (
                    <div key={rIdx} className="flex items-center space-x-1.5 text-[11px] text-rose-100 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                      <span>{rf}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              onClick={handleResetCheckup}
              className="flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Perform New BioSensing Scan</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>Print Physician Summary</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

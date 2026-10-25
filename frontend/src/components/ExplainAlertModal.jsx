import React from 'react';
import { X, Sparkles, ShieldAlert, CheckCircle2, AlertCircle, ArrowRight, HeartPulse, HelpCircle } from 'lucide-react';
import api from '../services/api';

export default function ExplainAlertModal({ alert, isOpen, onClose, onAcknowledged, onNavigateToRecheck }) {
  if (!isOpen || !alert) return null;

  const { explainableAi, affectedSignals = [], alertLevel, title, earlyWarningScore } = alert;

  const handleAcknowledge = async () => {
    try {
      await api.put(`/alerts/${alert._id}/read`);
      if (onAcknowledged) onAcknowledged(alert._id);
      onClose();
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  };

  const isRed = alertLevel === 'RED';
  const isOrange = alertLevel === 'ORANGE';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold tracking-tight">“Why am I seeing this?”</h3>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                    isRed ? 'bg-rose-500 text-white' : isOrange ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {alertLevel} ALERT
                </span>
              </div>
              <p className="text-xs text-slate-400">Section 13 Explainable AI Assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Emergency Safety Alert for Red Tier */}
          {isRed && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-xs block uppercase">Emergency Safety Advisory</span>
                <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                  VitaBridge cannot determine whether this is a medical emergency. If you are experiencing severe chest pain, extreme shortness of breath, sudden weakness, or rapidly worsening symptoms, seek emergency medical care immediately.
                </p>
              </div>
            </div>
          )}

          {/* Core Question 1: WHY? */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-teal-600" />
              <span>Why?</span>
            </h4>
            <p className="text-slate-800 font-semibold whitespace-pre-line leading-relaxed">
              {explainableAi?.why || alert.baselineComparisonText || 'Your recent data differs from your personal baseline:'}
            </p>

            {/* Signal diff pills */}
            {affectedSignals.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {affectedSignals.map((sig, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{sig.signal || sig.name}</span>
                      <span className={sig.percentChange > 0 ? 'text-rose-600' : 'text-blue-600'}>
                        {sig.percentChange > 0 ? '+' : ''}{sig.percentChange}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px] mt-0.5">
                      <span>Current: {sig.currentValue}</span>
                      <span>Baseline: {sig.baselineValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core Question 2: WHAT DOES THIS MEAN? */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>What does this mean?</span>
            </h4>
            <p className="text-slate-700 leading-relaxed font-medium">
              {explainableAi?.whatDoesThisMean ||
                'These signals represent a change from your usual pattern. They do not establish a diagnosis.'}
            </p>
          </div>

          {/* Core Question 3: WHAT SHOULD I DO? */}
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
            <h4 className="font-extrabold text-teal-950 text-sm flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>What should I do?</span>
            </h4>
            <p className="text-teal-900 leading-relaxed font-bold">
              {explainableAi?.whatShouldIDo || alert.recommendedNextAction ||
                'Perform a recheck and monitor how you feel. Seek professional advice if symptoms persist or worsen.'}
            </p>
          </div>

          {/* Non-Diagnostic Clinical Safety Disclaimer */}
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            <strong>Clinical Safety Guarantee:</strong> VitaBridge AI is a health screening and early-warning decision-support tool, not a diagnostic system. Never present an AI prediction as a confirmed diagnosis.
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Deviation Risk Index: <strong className="text-slate-800 font-bold">{earlyWarningScore}/100</strong>
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition"
            >
              Dismiss
            </button>
            <button
              onClick={handleAcknowledge}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition"
            >
              Acknowledge Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

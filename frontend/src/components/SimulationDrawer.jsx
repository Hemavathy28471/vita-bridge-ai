import React, { useState } from 'react';
import { X, PlayCircle, Activity, Sparkles, Check, AlertTriangle, ShieldCheck, Wind, Footprints, Camera, Heart } from 'lucide-react';
import api from '../services/api';

export default function SimulationDrawer({ isOpen, onClose, onSimulationCompleted }) {
  const [selectedScenario, setSelectedScenario] = useState('NORMAL_MODE');
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  if (!isOpen) return null;

  // Section 24 Demo Mode Presets
  const scenarios = [
    {
      key: 'NORMAL_MODE',
      name: '1. Normal Mode',
      desc: 'All signals (camera, audio, vitals, activity) remain closely aligned with personal baseline.',
      badge: 'GREEN — Normal',
      icon: Activity,
      color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/40',
    },
    {
      key: 'UNUSUAL_ACTIVITY_MODE',
      name: '2. Unusual Activity Mode',
      desc: 'Activity suddenly decreases from 8,200 to 2,800 steps. Triggers context prompt [I\'m resting] / [Recheck].',
      badge: 'Activity Engine Prompt',
      icon: Footprints,
      color: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/40',
    },
    {
      key: 'AUDIO_EVENT_MODE',
      name: '3. Audio Event Mode',
      desc: 'Simulates 8 cough-like acoustic events over 12 minutes (86% confidence). Triggers respiratory recheck.',
      badge: 'Acoustic Pipeline Cluster',
      icon: Wind,
      color: 'border-amber-200 hover:border-amber-400 bg-amber-50/40',
    },
    {
      key: 'PHYSIOLOGICAL_CHANGE_MODE',
      name: '4. Physiological Change Mode',
      desc: 'Simulates changes in resting HR (+18%), SpO2 dip to 94%, sleep down 25%, and low physical activity.',
      badge: 'YELLOW — Monitor',
      icon: Heart,
      color: 'border-orange-200 hover:border-orange-400 bg-orange-50/40',
    },
    {
      key: 'MULTIMODAL_EVENT_MODE',
      name: '5. Multimodal Event Mode',
      desc: 'Concurrently simulates: Camera pattern change + Audio cough events + Heart rate deviation + Reduced activity -> Recheck -> RED Alert.',
      badge: 'RED — Seek Attention',
      icon: Camera,
      color: 'border-rose-200 hover:border-rose-400 bg-rose-50/40',
    },
  ];

  const handleRunSimulation = async () => {
    setLoading(true);
    setResultMessage(null);
    try {
      const res = await api.post('/simulation/trigger', { scenarioKey: selectedScenario });
      if (res.data.success) {
        setResultMessage({
          success: true,
          text: `Demo scenario simulated! Fused ${res.data.data.alertLevel} early-warning reading streamed live.`,
        });
        if (onSimulationCompleted) {
          onSimulationCompleted(res.data.data);
        }
      }
    } catch (err) {
      setResultMessage({
        success: false,
        text: err.response?.data?.message || 'Failed to trigger simulation.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Demo Simulation Studio</h3>
              <p className="text-xs text-slate-500">Section 24 Multimodal Demonstration Presets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Watermark Banner */}
        <div className="mx-6 mt-4 p-3 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black text-center tracking-wider uppercase">
          DEMO DATA — NOT REAL MEDICAL MEASUREMENTS
        </div>

        {/* Scenarios selection list */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          <p className="text-xs text-slate-500 leading-relaxed">
            Select a preset scenario to test how the <strong>Detect → Verify → Fuse → Warn</strong> engine processes multi-sensory deviations.
          </p>

          <div className="space-y-2.5 pt-1">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isSelected = selectedScenario === sc.key;
              return (
                <div
                  key={sc.key}
                  onClick={() => setSelectedScenario(sc.key)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${sc.color} ${
                    isSelected ? 'ring-2 ring-teal-600 shadow-md' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-slate-700" />
                      <span className="text-xs font-extrabold text-slate-900">{sc.name}</span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white border text-slate-800 shadow-2xs">
                      {sc.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-6">{sc.desc}</p>
                </div>
              );
            })}
          </div>

          {resultMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold ${
                resultMessage.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800'
              }`}
            >
              {resultMessage.text}
            </div>
          )}
        </div>

        {/* Footer trigger button */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-2">
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Simulating Multimodal Stream...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Simulate Selected Demo Scenario</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">
            Clear labeling: DEMO DATA — NOT REAL MEDICAL MEASUREMENTS
          </p>
        </div>
      </div>
    </div>
  );
}

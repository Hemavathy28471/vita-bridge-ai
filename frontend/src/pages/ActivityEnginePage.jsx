import React, { useState, useEffect } from 'react';
import {
  Activity,
  Footprints,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  UserCheck,
  TrendingDown,
  Info,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import api from '../services/api';

export default function ActivityEnginePage({ onNavigateToRecheck }) {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contextFeedback, setContextFeedback] = useState(null);
  const [submittingContext, setSubmittingContext] = useState(false);

  // Hourly step curve mockup for chart
  const hourlyData = [
    { hour: '08:00', steps: 420, baseline: 550 },
    { hour: '10:00', steps: 680, baseline: 850 },
    { hour: '12:00', steps: 850, baseline: 1200 },
    { hour: '14:00', steps: 350, baseline: 1100 },
    { hour: '16:00', steps: 220, baseline: 1400 },
    { hour: '18:00', steps: 280, baseline: 1600 },
  ];

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity');
      if (res.data?.data) {
        setActivityData(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to load activity telemetry:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const handleProvideContext = async (contextKey) => {
    if (contextKey === 'recheck') {
      onNavigateToRecheck && onNavigateToRecheck();
      return;
    }

    try {
      setSubmittingContext(true);
      const res = await api.post('/activity/context', { context: contextKey });
      setContextFeedback(res.data?.evaluation?.contextInterpretation || 'Context recorded.');
      fetchActivity();
    } catch (e) {
      console.warn('Error submitting activity context:', e.message);
    } finally {
      setSubmittingContext(false);
    }
  };

  const stepsToday = activityData?.currentSteps || 2800;
  const baselineMean = activityData?.baselineSteps?.mean || 8200;
  const deficitPct = Math.round(((stepsToday - baselineMean) / baselineMean) * 100);
  const isDeficit = deficitPct < -25;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Behavioral Modality
              </span>
              <span className="text-xs text-slate-400 font-mono">Unusual Activity Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Physical Activity Baseline & Deviation Engine
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              VitaBridge tracks your personal movement rhythm. When activity drops or prolonged inactivity occurs, the system asks for context before jumping to conclusions.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-indigo-200 bg-indigo-950/70 px-4 py-2.5 rounded-2xl border border-indigo-700/50 self-start sm:self-auto">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Context-Aware Inference Active</span>
          </div>
        </div>
      </div>

      {/* Primary Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Today's Accumulation</span>
            <Footprints className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stepsToday.toLocaleString()} <span className="text-xs font-bold text-slate-400">steps</span>
          </div>
          <div className={`text-xs font-bold mt-2 flex items-center space-x-1 ${isDeficit ? 'text-amber-600' : 'text-emerald-600'}`}>
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{deficitPct}% vs personal baseline</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Personal Step Baseline</span>
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            7,000–9,000 <span className="text-xs font-bold text-slate-400">steps/day</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Mean: <strong>{baselineMean.toLocaleString()} steps</strong> (30-day calibrated)
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Continuous Inactivity</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {activityData?.inactivityDurationMinutes || 120} <span className="text-xs font-bold text-slate-400">mins</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Current Posture: <strong className="capitalize">{activityData?.posture || 'Sitting'}</strong>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Inference State</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-2">
            {isDeficit ? 'Unusual Deficit' : 'Nominal Routine'}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {activityData?.evaluation?.contextInterpretation || 'Awaiting user context'}
          </div>
        </div>
      </div>

      {/* Interactive Context Prompt Banner (Section 7) */}
      {isDeficit && (
        <div className="bg-amber-50 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-amber-950">
                  You have been significantly less active than your usual pattern today.
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Your activity level is {Math.abs(deficitPct)}% lower than your usual baseline ({stepsToday.toLocaleString()} vs {baselineMean.toLocaleString()} steps). Would you like to provide context or perform a health recheck?
                </p>
              </div>
            </div>
          </div>

          {/* 4 Interactive Buttons per Section 7 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleProvideContext('resting')}
              disabled={submittingContext}
              className="p-3.5 rounded-2xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-950 font-bold text-xs shadow-2xs transition text-center"
            >
              [I'm resting]
            </button>
            <button
              type="button"
              onClick={() => handleProvideContext('unwell')}
              disabled={submittingContext}
              className="p-3.5 rounded-2xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-950 font-bold text-xs shadow-2xs transition text-center"
            >
              [I'm feeling unwell]
            </button>
            <button
              type="button"
              onClick={() => handleProvideContext('different_schedule')}
              disabled={submittingContext}
              className="p-3.5 rounded-2xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-950 font-bold text-xs shadow-2xs transition text-center"
            >
              [Different schedule]
            </button>
            <button
              type="button"
              onClick={() => handleProvideContext('recheck')}
              className="p-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition text-center flex items-center justify-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>[Launch Recheck]</span>
            </button>
          </div>

          {contextFeedback && (
            <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs text-amber-900 font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{contextFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* Hourly Step Accumulation vs Baseline Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Today's Hourly Step Accumulation vs Typical Curve</h3>
            <p className="text-xs text-slate-500">Visualizes physical mobility trajectory relative to your learned circadian activity profile</p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <span className="flex items-center space-x-1.5 text-indigo-600 font-bold">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span>
              <span>Today's Steps</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-400 font-bold">
              <span className="w-3 h-3 rounded bg-slate-300 inline-block"></span>
              <span>Baseline Expected</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
              />
              <Bar dataKey="baseline" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Baseline Steps" />
              <Bar dataKey="steps" fill="#6366f1" radius={[4, 4, 0, 0]} name="Actual Steps" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

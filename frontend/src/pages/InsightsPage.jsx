import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Lightbulb,
  Heart,
  Moon,
  Wind,
  Activity,
  Flame,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Search,
  CheckCircle2,
  Stethoscope,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function InsightsPage({ onNavigateToRecheck }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('flags'); // 'flags' | 'all' | 'cardiovascular' | 'respiratory' | 'sleep'

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const res = await api.get('/insights');
        if (res.data.success) {
          setInsights(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load insights', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const conditionFlags = insights?.conditionPatternFlags || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Pattern Screening
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Section 12 Non-Diagnostic Framework
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Disease Screening & Possible Condition Flags
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              VitaBridge distinguishes between raw observations, AI-detected patterns, possible interpretations, rechecks, and professional review criteria.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-teal-950/80 border border-teal-700/50 text-xs text-teal-200 space-y-1 max-w-sm self-start sm:self-auto">
            <span className="font-extrabold flex items-center space-x-1.5 text-teal-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict Clinical Non-Diagnosis Policy</span>
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              The system never claims to diagnose a disease. It identifies patterns that can occur across multiple conditions and advises rechecking.
            </p>
          </div>
        </div>
      </div>

      {/* Main Condition Flags List with 5 Distinct Parts (Section 12) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <Search className="w-5 h-5 text-teal-600" />
            <span>Active Possible Health-Related Pattern Flags</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Total Flags: {conditionFlags.length}</span>
        </div>

        {conditionFlags.map((flag) => (
          <div
            key={flag.id}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5"
          >
            {/* Flag Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block">
                    {flag.categoryName}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    {flag.aiPattern}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigateToRecheck}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-xs transition flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Perform Recommended Recheck</span>
              </button>
            </div>

            {/* The 5 Demarcated Sections per Section 12 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
              {/* 1. Observation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>1. Observation</span>
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {flag.observation}
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">What the system measured</span>
              </div>

              {/* 2. AI Pattern */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 block flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>2. AI Pattern</span>
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {flag.aiPattern}
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">What the model detected</span>
              </div>

              {/* 3. Possible Interpretation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 block flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>3. Possible Interpretation</span>
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {flag.possibleInterpretation}
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">Non-diagnostic association</span>
              </div>

              {/* 4. Recheck */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block flex items-center space-x-1">
                  <RotateCcw className="w-3.5 h-3.5 text-teal-700" />
                  <span>4. Recheck</span>
                </span>
                <p className="text-teal-950 font-medium leading-relaxed">
                  {flag.recheck}
                </p>
                <span className="text-[10px] text-teal-600 block pt-1">What to verify again</span>
              </div>

              {/* 5. Professional Review */}
              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block flex items-center space-x-1">
                  <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                  <span>5. Professional Review</span>
                </span>
                <p className="text-rose-950 font-medium leading-relaxed">
                  {flag.professionalReview}
                </p>
                <span className="text-[10px] text-rose-600 block pt-1">When to consult a doctor</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

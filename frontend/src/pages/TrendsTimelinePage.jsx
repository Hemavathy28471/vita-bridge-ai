import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Heart,
  Moon,
  Activity,
  Wind,
  Sparkles,
  ChevronRight,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import api from '../services/api';

export default function TrendsTimelinePage({ onExplainAlert }) {
  const [readings, setReadings] = useState([]);
  const [baseline, setBaseline] = useState(null);
  const [timeframe, setTimeframe] = useState('7d'); // 'today' | '7d' | '30d' | '90d'
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMetricTab, setActiveMetricTab] = useState('heartRate');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/trends?timeframe=${timeframe}`);
        if (res.data.success) {
          setReadings(res.data.readings || []);
          setBaseline(res.data.baseline);
          if (res.data.timeline && res.data.timeline.length > 0) {
            setTimelineEvents(res.data.timeline);
          } else {
            // Default event timeline per Section 17
            setTimelineEvents([
              { time: '09:00', status: 'Normal', icon: 'check', text: 'Baseline equilibrium verified', badgeClass: 'bg-emerald-100 text-emerald-800' },
              { time: '11:30', status: 'Warning', icon: 'activity', text: 'Activity decreased (2,800 steps vs 8,200 baseline)', badgeClass: 'bg-amber-100 text-amber-800' },
              { time: '13:10', status: 'Warning', icon: 'voice', text: 'Voice pattern changed (vocal strain & pause ratio 28%)', badgeClass: 'bg-amber-100 text-amber-800' },
              { time: '13:15', status: 'Recheck', icon: 'recheck', text: 'Recheck requested: 30-second respiratory protocol', badgeClass: 'bg-teal-100 text-teal-800' },
              { time: '13:17', status: 'Completed', icon: 'check', text: 'Recheck completed: persistent SpO2 94% & cough events', badgeClass: 'bg-teal-100 text-teal-800' },
              { time: '13:20', status: 'Alert', icon: 'alert', text: 'Multiple signals differ from baseline (ORANGE Alert)', badgeClass: 'bg-orange-100 text-orange-800' },
              { time: '18:00', status: 'Recovery', icon: 'check', text: 'Pattern returned toward baseline after rest and hydration', badgeClass: 'bg-emerald-100 text-emerald-800' },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load trends data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeframe]);

  // Formatted chart data
  const chartData = readings.map((r) => {
    const d = new Date(r.timestamp);
    return {
      date: timeframe === 'today'
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      heartRate: r.heartRate,
      hrv: r.hrv,
      spo2: r.spo2,
      temperature: r.temperature,
      sleep: r.sleepHours,
      steps: r.steps || 0,
      baselineHR: baseline?.heartRate?.mean || 72,
      baselineSpO2: baseline?.spo2?.mean || 98,
      baselineSleep: baseline?.sleepHours?.mean || 7.5,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trend Dashboard & Event Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Longitudinal multi-modal tracking with calibrated personal baseline comparison bands
          </p>
        </div>

        {/* Timeframe Tabs: Today, 7d, 30d, 90d (Section 16) */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          {[
            { key: 'today', label: 'Today' },
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '90d', label: '90 Days' },
          ].map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTimeframe(tf.key)}
              className={`px-3 py-1.5 rounded-xl transition ${
                timeframe === tf.key
                  ? 'bg-white text-slate-900 font-extrabold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'heartRate', label: 'Heart Rate (BPM)', icon: Heart, color: '#ef4444' },
          { key: 'spo2', label: 'Oxygen (SpO2 %)', icon: Wind, color: '#10b981' },
          { key: 'sleep', label: 'Sleep (Hours)', icon: Moon, color: '#8b5cf6' },
          { key: 'steps', label: 'Daily Steps', icon: Activity, color: '#06b6d4' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeMetricTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveMetricTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: tab.color }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Longitudinal Trend Chart with Personal Baseline Band */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span>Biometric Trend vs Individual Baseline</span>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Calibrated
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              The dashed line shows your 30-day personalized baseline mean.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-bold">
            <span className="flex items-center space-x-1.5 text-teal-700">
              <span className="w-3 h-0.5 bg-teal-600 inline-block"></span>
              <span>Observed Signal</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-400">
              <span className="w-3 h-0.5 border-b border-dashed border-slate-400 inline-block"></span>
              <span>Baseline Mean</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
              />
              {activeMetricTab === 'heartRate' && (
                <>
                  <ReferenceLine y={baseline?.heartRate?.mean || 72} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Baseline: ${baseline?.heartRate?.mean || 72} BPM`, fill: '#f59e0b', fontSize: 10 }} />
                  <Area type="monotone" dataKey="heartRate" stroke="#0d9488" strokeWidth={2.5} fill="url(#metricGrad)" name="Heart Rate (BPM)" />
                </>
              )}
              {activeMetricTab === 'spo2' && (
                <>
                  <ReferenceLine y={baseline?.spo2?.mean || 98} stroke="#10b981" strokeDasharray="4 4" label={{ value: `Baseline: ${baseline?.spo2?.mean || 98}%`, fill: '#10b981', fontSize: 10 }} />
                  <Area type="monotone" dataKey="spo2" stroke="#06b6d4" strokeWidth={2.5} fill="url(#metricGrad)" name="SpO2 (%)" />
                </>
              )}
              {activeMetricTab === 'sleep' && (
                <>
                  <ReferenceLine y={baseline?.sleepHours?.mean || 7.5} stroke="#8b5cf6" strokeDasharray="4 4" label={{ value: `Baseline: ${baseline?.sleepHours?.mean || 7.5}h`, fill: '#8b5cf6', fontSize: 10 }} />
                  <Area type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#metricGrad)" name="Sleep Duration (h)" />
                </>
              )}
              {activeMetricTab === 'steps' && (
                <>
                  <ReferenceLine y={baseline?.dailySteps?.mean || 8200} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: `Baseline: ${baseline?.dailySteps?.mean || 8200}`, fill: '#3b82f6', fontSize: 10 }} />
                  <Area type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={2.5} fill="url(#metricGrad)" name="Daily Steps" />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chronological Event Timeline (Section 17) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span>Chronological Event Timeline</span>
            </h3>
            <p className="text-xs text-slate-500">
              Sequence of baseline verifications, sensory deviations, recheck requests, and recovery milestones
            </p>
          </div>
          <span className="font-mono text-xs text-slate-400">Total Milestones: {timelineEvents.length}</span>
        </div>

        {/* Timeline Items */}
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6">
          {timelineEvents.map((evt, idx) => (
            <div key={idx} className="relative group">
              {/* Marker Node */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center shadow-xs border-teal-600 text-teal-600">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              </div>

              {/* Event Card */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono font-extrabold text-xs text-slate-900">{evt.time}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${evt.badgeClass || 'bg-slate-100 text-slate-700'}`}>
                      {evt.status || evt.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-semibold">{evt.title || evt.text}</p>
                  {evt.description && evt.description !== evt.text && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{evt.description}</p>
                  )}
                </div>

                <div className="self-start sm:self-auto">
                  <span className="text-[11px] font-bold text-teal-700 flex items-center space-x-1">
                    <span>Verified</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

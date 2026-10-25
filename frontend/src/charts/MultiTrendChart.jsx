import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceArea,
} from 'recharts';

export default function MultiTrendChart({ readings = [], baseline = null, timeframe = '7d', onTimeframeChange }) {
  const [activeSignals, setActiveSignals] = useState({
    heartRate: true,
    hrv: true,
    spo2: false,
    temperature: false,
  });

  const toggleSignal = (key) => {
    setActiveSignals((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formattedData = readings.map((r) => {
    const d = new Date(r.timestamp);
    const dateLabel =
      timeframe === 'today'
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : `${d.getMonth() + 1}/${d.getDate()}`;

    return {
      date: dateLabel,
      heartRate: r.heartRate,
      hrv: r.hrv,
      spo2: r.spo2,
      temperature: r.temperature,
      sleepHours: r.sleepHours,
      activityLevel: r.activityLevel,
    };
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Physiological Multi-Signal Trajectory
          </h2>
          <p className="text-xs text-slate-500">
            Interactive multimodal trend compared against personal baseline
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          {['today', '7d', '30d', '90d'].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange && onTimeframeChange(tf)}
              className={`px-3 py-1 rounded-lg transition uppercase ${
                timeframe === tf
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tf === 'today' ? 'Today' : tf}
            </button>
          ))}
        </div>
      </div>

      {/* Signal Toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'heartRate', label: 'Heart Rate (BPM)', color: 'bg-rose-500' },
          { key: 'hrv', label: 'HRV (ms)', color: 'bg-indigo-500' },
          { key: 'spo2', label: 'SpO2 (%)', color: 'bg-cyan-500' },
          { key: 'temperature', label: 'Temperature (°C)', color: 'bg-amber-500' },
        ].map((sig) => {
          const isActive = activeSignals[sig.key];
          return (
            <button
              key={sig.key}
              onClick={() => toggleSignal(sig.key)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${sig.color}`}></span>
              <span>{sig.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        {formattedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No readings recorded for this timeframe yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {/* Shaded baseline corridor for Heart Rate if active */}
              {activeSignals.heartRate && baseline?.heartRate && (
                <ReferenceArea
                  y1={baseline.heartRate.p25 || baseline.heartRate.mean - 4}
                  y2={baseline.heartRate.p75 || baseline.heartRate.mean + 4}
                  fill="#f43f5e"
                  fillOpacity={0.06}
                />
              )}

              {activeSignals.heartRate && (
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  name="Heart Rate (BPM)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f43f5e' }}
                  activeDot={{ r: 5 }}
                />
              )}

              {activeSignals.hrv && (
                <Line
                  type="monotone"
                  dataKey="hrv"
                  name="HRV (ms)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6366f1' }}
                />
              )}

              {activeSignals.spo2 && (
                <Line
                  type="monotone"
                  dataKey="spo2"
                  name="Blood Oxygen (%)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#06b6d4' }}
                />
              )}

              {activeSignals.temperature && (
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-50 border border-rose-200"></span>
          <span>Shaded Area: Personal Baseline Range (p25–p75)</span>
        </span>
        <span>Sampling: Normalized Multimodal Stream</span>
      </div>
    </div>
  );
}

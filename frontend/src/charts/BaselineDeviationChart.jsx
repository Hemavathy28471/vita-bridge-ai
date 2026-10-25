import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';

export default function BaselineDeviationChart({ reading, baseline }) {
  if (!reading || !baseline) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card flex items-center justify-center text-xs text-slate-400 h-64">
        Baseline calibration required.
      </div>
    );
  }

  const calcDiff = (val, baseMean) => {
    if (typeof val !== 'number' || typeof baseMean !== 'number' || baseMean === 0) return 0;
    return Number((((val - baseMean) / baseMean) * 100).toFixed(1));
  };

  const deviations = [
    {
      metric: 'Heart Rate',
      delta: calcDiff(reading.heartRate, baseline.heartRate?.mean),
      current: `${reading.heartRate} BPM`,
      baseline: `${baseline.heartRate?.mean} BPM`,
    },
    {
      metric: 'HRV',
      delta: calcDiff(reading.hrv, baseline.hrv?.mean),
      current: `${reading.hrv} ms`,
      baseline: `${baseline.hrv?.mean} ms`,
    },
    {
      metric: 'SpO2',
      delta: calcDiff(reading.spo2, baseline.spo2?.mean),
      current: `${reading.spo2}%`,
      baseline: `${baseline.spo2?.mean}%`,
    },
    {
      metric: 'Temp',
      delta: calcDiff(reading.temperature, baseline.temperature?.mean),
      current: `${reading.temperature}°C`,
      baseline: `${baseline.temperature?.mean}°C`,
    },
    {
      metric: 'Sleep',
      delta: calcDiff(reading.sleepHours, baseline.sleepHours?.mean),
      current: `${reading.sleepHours}h`,
      baseline: `${baseline.sleepHours?.mean}h`,
    },
    {
      metric: 'Activity',
      delta: calcDiff(reading.activityLevel, baseline.activityLevel?.mean),
      current: `${Math.round((reading.activityLevel || 0) * 100)}%`,
      baseline: `${Math.round((baseline.activityLevel?.mean || 0) * 100)}%`,
    },
  ];

  const getBarColor = (delta, metric) => {
    const abs = Math.abs(delta);
    if (abs <= 5) return '#10b981'; // Nominal / Green
    if (abs <= 15) return '#f59e0b'; // Mild / Yellow
    return '#f43f5e'; // Significant / Red
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
          Personal Baseline Deviation (%)
        </h3>
        <p className="text-xs text-slate-500">
          Percentage shift of latest biometrics compared to your individual normal mean
        </p>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={deviations} layout="horizontal" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
            <Tooltip
              formatter={(value, name, item) => [
                `${value}% (Current: ${item.payload.current}, Baseline: ${item.payload.baseline})`,
                'Deviation',
              ]}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '11px',
              }}
            />
            <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
              {deviations.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.delta, entry.metric)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center space-x-4 text-[11px] text-slate-500">
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Within ±5% (Expected)</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>±6% to 15% (Mild Drift)</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>&gt;15% (Significant Shift)</span>
        </span>
      </div>
    </div>
  );
}

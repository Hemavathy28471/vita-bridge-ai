import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  unit,
  baselineMean,
  baselineRange,
  percentChange = 0,
  icon: Icon,
  color = 'text-brand-600',
  bgColor = 'bg-brand-50',
  isAlert = false,
}) {
  const isPositive = percentChange > 0;
  const isNeutral = Math.abs(percentChange) <= 3;

  return (
    <div
      className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md ${
        isAlert ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`w-8 h-8 rounded-xl ${bgColor} flex items-center justify-center ${color}`}>
            {Icon && <Icon className="w-4 h-4" />}
          </div>
          <span className="text-xs font-bold text-slate-700">{title}</span>
        </div>

        {/* Change indicator */}
        {!isNeutral ? (
          <div
            className={`flex items-center space-x-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isAlert ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {percentChange}%
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-0.5 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
            <Minus className="w-3 h-3" />
            <span>Nominal</span>
          </div>
        )}
      </div>

      {/* Current Value */}
      <div className="flex items-baseline space-x-1.5 mb-2">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {value !== undefined && value !== null ? value : '--'}
        </span>
        <span className="text-xs font-semibold text-slate-500">{unit}</span>
      </div>

      {/* Baseline Context Chip */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Personal Baseline:</span>
        <span className="font-semibold text-slate-700">
          {baselineRange || (baselineMean ? `~${baselineMean} ${unit}` : 'Calibrating...')}
        </span>
      </div>
    </div>
  );
}

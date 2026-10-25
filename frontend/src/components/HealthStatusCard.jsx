import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function HealthStatusCard({
  userName = 'Sarah',
  status = 'Stable',
  earlyWarningScore = 15,
  physiologicalTrendScore = 88,
  activeAlert = null,
  onExplainAlert,
}) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusConfig = () => {
    if (status === 'Attention') {
      return {
        badge: 'Attention Needed',
        color: 'bg-rose-500',
        textColor: 'text-rose-700',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
        icon: AlertCircle,
        desc: 'Notable physiological variation detected across multiple vital signs compared with your personal baseline.',
      };
    }
    if (status === 'Monitor') {
      return {
        badge: 'Monitor Closely',
        color: 'bg-amber-500',
        textColor: 'text-amber-800',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: AlertTriangle,
        desc: 'Mild divergence detected from your standard baseline. Resting metrics suggest elevated physical or mental strain.',
      };
    }
    return {
      badge: 'Stable Baseline',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-800',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: ShieldCheck,
      desc: 'All monitored physiological modalities align closely with your personalized health baseline signatures.',
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className={`rounded-2xl p-6 border ${config.borderColor} ${config.bgColor} shadow-card transition-all`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Greeting & Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}, {userName.split(' ')[0]}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-sm">
              <span className={`w-2 h-2 rounded-full mr-1.5 ${config.color} live-indicator`}></span>
              {config.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            {config.desc}
          </p>
        </div>

        {/* Right: Scores Meter */}
        <div className="flex items-center space-x-4 sm:space-x-6 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/80 shadow-sm self-start md:self-auto">
          {/* Early Warning Score */}
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Early Warning Score
            </span>
            <div className="flex items-baseline justify-center space-x-1 mt-0.5">
              <span
                className={`text-2xl font-black ${
                  earlyWarningScore >= 70
                    ? 'text-rose-600'
                    : earlyWarningScore >= 35
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {earlyWarningScore}
              </span>
              <span className="text-xs font-semibold text-slate-400">/100</span>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200"></div>

          {/* Physiological Trend Score */}
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Baseline Stability
            </span>
            <div className="flex items-baseline justify-center space-x-1 mt-0.5">
              <span className="text-2xl font-black text-brand-700">{physiologicalTrendScore}</span>
              <span className="text-xs font-semibold text-slate-400">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active alert snippet with Explain CTA */}
      {activeAlert && activeAlert.alertLevel !== 'GREEN' && (
        <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs text-slate-700">
            <StatusIcon className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">{activeAlert.title}:</span>
            <span className="text-slate-600 truncate max-w-lg">{activeAlert.summary}</span>
          </div>

          <button
            onClick={() => onExplainAlert && onExplainAlert(activeAlert)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 shadow-sm transition shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Explain This Alert</span>
          </button>
        </div>
      )}
    </div>
  );
}

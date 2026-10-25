import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function AlertsPage({ onExplainAlert }) {
  const [alerts, setAlerts] = useState([]);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async (level = 'ALL') => {
    setLoading(true);
    try {
      const url = level === 'ALL' ? '/alerts' : `/alerts?level=${level}`;
      const res = await api.get(url);
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(filterLevel);
  }, [filterLevel]);

  const handleAcknowledge = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, status: 'acknowledged' } : a))
      );
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  };

  const hasRedAlert = alerts.some((a) => a.alertLevel === 'RED' && a.status === 'active');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Early Warning Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Calibrated 4-Tier Early-Warning Engine with Explainable AI ("Why am I seeing this?")
          </p>
        </div>

        {/* 4-Level Filters per Section 11 */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          {['ALL', 'RED', 'ORANGE', 'YELLOW', 'GREEN'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl transition uppercase font-extrabold text-[11px] ${
                filterLevel === lvl
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {lvl === 'RED' ? 'RED (Attention)' :
               lvl === 'ORANGE' ? 'ORANGE (Recheck)' :
               lvl === 'YELLOW' ? 'YELLOW (Monitor)' :
               lvl === 'GREEN' ? 'GREEN (Normal)' : 'ALL'}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Notice if Red Alert Present */}
      {hasRedAlert && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-900 text-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Emergency Clinical Safety Notice:</strong> VitaBridge cannot determine whether this is a medical emergency. If you are experiencing severe or rapidly worsening symptoms, seek emergency medical care immediately.
          </p>
        </div>
      )}

      {/* Decision Support Guarantee Notice */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start space-x-3 text-teal-900 text-xs">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Decision Support Policy:</strong> VitaBridge alerts highlight statistical deviations from your personal baseline. They are observational and never represent a confirmed medical diagnosis.
        </p>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-extrabold text-slate-800">No Alerts for Selected Filter</p>
            <p className="text-xs text-slate-500 mt-0.5">All monitored physiological and behavioral signals are nominal.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isRed = alert.alertLevel === 'RED';
            const isOrange = alert.alertLevel === 'ORANGE';
            const isYellow = alert.alertLevel === 'YELLOW';
            const StatusIcon = isRed ? AlertOctagon : isOrange ? AlertTriangle : isYellow ? AlertTriangle : CheckCircle2;

            return (
              <div
                key={alert._id}
                className={`rounded-3xl p-6 sm:p-7 border transition bg-white shadow-card ${
                  isRed
                    ? 'border-rose-300 ring-2 ring-rose-200'
                    : isOrange
                    ? 'border-orange-300 ring-1 ring-orange-200'
                    : isYellow
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                        isRed
                          ? 'bg-rose-100 text-rose-800'
                          : isOrange
                          ? 'bg-orange-100 text-orange-800'
                          : isYellow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <StatusIcon className="w-3.5 h-3.5 mr-1" />
                      {alert.alertLevel} ALERT
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">{alert.title}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                    {alert.status === 'acknowledged' && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                  {alert.summary}
                </p>

                {/* Affected signals comparison */}
                {alert.affectedSignals && alert.affectedSignals.length > 0 && (
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {alert.affectedSignals.map((sig, sIdx) => (
                      <div key={sIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex justify-between font-bold text-slate-800 mb-0.5">
                          <span>{sig.signal || sig.name}</span>
                          <span className={sig.percentChange > 0 ? 'text-rose-600' : 'text-blue-600'}>
                            {sig.percentChange > 0 ? '+' : ''}
                            {sig.percentChange}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex justify-between">
                          <span>Current: {sig.currentValue} {sig.unit}</span>
                          <span>Baseline: {sig.baselineValue} {sig.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommended action */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 mb-4 flex items-start space-x-2">
                  <span className="font-extrabold text-slate-900 shrink-0">Guidance:</span>
                  <span className="leading-relaxed">{alert.recommendedNextAction}</span>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    Deviation Score: <strong className="text-slate-700 font-bold">{alert.earlyWarningScore}/100</strong> (Confidence: {Math.round((alert.confidence || 0.9) * 100)}%)
                  </span>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    {alert.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(alert._id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                      >
                        Mark Acknowledged
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onExplainAlert && onExplainAlert(alert)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-xs transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Why Am I Seeing This?</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

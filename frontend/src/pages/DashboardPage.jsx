import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import HealthStatusCard from '../components/HealthStatusCard';
import MetricCard from '../components/MetricCard';
import MultiTrendChart from '../charts/MultiTrendChart';
import BaselineDeviationChart from '../charts/BaselineDeviationChart';
import api from '../services/api';
import { getSocket } from '../services/socket';
import {
  Heart,
  Activity,
  Wind,
  Thermometer,
  Moon,
  Flame,
  Zap,
  Gauge,
  Camera,
  Mic,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

export default function DashboardPage({ onExplainAlert, onNavigateToRecheck, onNavigateToLiveSensing, onNavigateToActivity }) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [readings, setReadings] = useState([]);
  const [timeframe, setTimeframe] = useState('7d');
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async (tf = '7d') => {
    try {
      setLoading(true);
      const [dashRes, readingsRes] = await Promise.all([
        api.get('/dashboard'),
        api.get(`/readings?timeframe=${tf}`),
      ]);

      if (dashRes.data.success) {
        setDashboardData(dashRes.data.data);
      }
      if (readingsRes.data.success) {
        setReadings(readingsRes.data.data);
      }
    } catch (err) {
      console.warn('Backend unavailable, populating realistic demo telemetry:', err);
      const fallbackDashboard = {
        latestReading: {
          heartRate: 74,
          spo2: 98,
          temperature: 36.6,
          respiratoryRate: 14,
          hrv: 56,
          sleepHours: 7.4,
          steps: 6420,
          timestamp: new Date().toISOString(),
        },
        baseline: {
          heartRate: { mean: 71.7, p10: 64, p90: 79 },
          spo2: { mean: 98.1, p10: 96, p90: 99 },
          temperature: { mean: 36.6, p10: 36.2, p90: 37.0 },
          respiratoryRate: { mean: 14.2, p10: 12, p90: 16 },
          hrv: { mean: 58.0, p10: 42, p90: 74 },
          sleepHours: { mean: 7.5, p10: 6.5, p90: 8.5 },
          dailySteps: { mean: 8200, p10: 5500, p90: 11000 },
        },
        earlyWarningScore: 18,
        physiologicalTrendScore: 22,
        healthStatus: 'Stable',
        activeAlerts: [
          {
            _id: 'alert-demo-01',
            tier: 'YELLOW',
            title: 'Mild Activity Deficit Noted',
            message: 'Daily step volume is 22% below your personal 30-day baseline equilibrium.',
            timestamp: new Date().toISOString(),
            status: 'active',
          },
        ],
        liveSensing: {
          activeModality: 'Multi-Sensor Fusion (Camera, Audio, Wearable)',
          confidence: 91,
          streamStatus: 'Live',
        },
        tierInfo: {
          tier: 'GREEN',
        },
      };

      const fallbackReadings = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          timestamp: d.toISOString(),
          heartRate: Math.round(70 + Math.sin(i) * 5),
          spo2: Math.round(97 + (i % 2)),
          temperature: +(36.5 + (i % 3) * 0.1).toFixed(1),
          respiratoryRate: 14 + (i % 2),
          hrv: Math.round(55 + Math.cos(i) * 6),
          sleepHours: +(7.2 + (i % 3) * 0.2).toFixed(1),
          steps: Math.round(6500 + i * 400),
        };
      });

      setDashboardData(fallbackDashboard);
      setReadings(fallbackReadings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(timeframe);

    // Real-time updates via Socket.IO
    const socket = getSocket();
    const handleNewReading = (payload) => {
      console.log('[Dashboard] Live physiological telemetry received:', payload);
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          latestReading: payload.reading,
          earlyWarningScore: payload.earlyWarningScore,
          physiologicalTrendScore: payload.physiologicalTrendScore,
          healthStatus:
            payload.alertLevel === 'RED'
              ? 'Attention'
              : payload.alertLevel === 'ORANGE'
              ? 'Recheck'
              : payload.alertLevel === 'YELLOW'
              ? 'Monitor'
              : 'Stable',
          activeAlerts: payload.alert ? [payload.alert, ...prev.activeAlerts] : prev.activeAlerts,
        };
      });

      setReadings((prev) => [...prev, payload.reading]);
    };

    socket.on('reading_received', handleNewReading);
    return () => {
      socket.off('reading_received', handleNewReading);
    };
  }, [timeframe]);

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Connecting to physiological stream...</p>
        </div>
      </div>
    );
  }

  const latest = dashboardData?.latestReading || {};
  const baseline = dashboardData?.baseline || {};
  const activeAlerts = dashboardData?.activeAlerts || [];
  const primaryAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;
  const liveSensing = dashboardData?.liveSensing || {};

  const calcPct = (val, baseMean) => {
    if (typeof val !== 'number' || typeof baseMean !== 'number' || baseMean === 0) return 0;
    return Number((((val - baseMean) / baseMean) * 100).toFixed(1));
  };

  const isRedAlert = dashboardData?.tierInfo?.tier === 'RED';

  return (
    <div className="space-y-6">
      {/* Section 27: Emergency Safety Notice Banner (Appears on Red or Critical Alerts) */}
      {isRedAlert && (
        <div className="p-4 sm:p-5 rounded-3xl bg-red-600 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/20 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-sm block uppercase tracking-wider">Clinical Safety Notice</span>
              <p className="text-xs text-red-100 mt-0.5 leading-relaxed">
                VitaBridge cannot determine whether this is a medical emergency. If you are experiencing severe or rapidly worsening symptoms, seek emergency medical care immediately.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onExplainAlert && onExplainAlert(primaryAlert)}
            className="px-4 py-2 rounded-xl bg-white text-red-600 font-extrabold text-xs shadow-xs hover:bg-red-50 transition shrink-0 self-start sm:self-auto"
          >
            Review Urgent Signals
          </button>
        </div>
      )}

      {/* 1. Live Sensing Real-Time Status Bar (Section 15) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 live-pulse"></span>
            <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
              Multimodal Live Sensing Cockpit
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onNavigateToLiveSensing}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center space-x-1"
            >
              <span>Open Sensing Studio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNavigateToRecheck}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-xs flex items-center space-x-1.5 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Launch 30s Recheck</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Camera</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block flex items-center justify-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${liveSensing.camera === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              <span>{liveSensing.camera || 'Active'}</span>
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Microphone</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block flex items-center justify-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${liveSensing.microphone === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              <span>{liveSensing.microphone || 'Active'}</span>
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Audio Pipeline</span>
            <span className="text-xs font-bold text-teal-700 mt-1 block">
              {liveSensing.audioStatus || 'Listening'}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Heart Rate</span>
            <span className="text-xs font-black text-slate-900 mt-1 block">
              {liveSensing.heartRate || latest.heartRate || 72} BPM
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">SpO2</span>
            <span className="text-xs font-black text-slate-900 mt-1 block">
              {liveSensing.spo2 || latest.spo2 || 98}%
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Temperature</span>
            <span className="text-xs font-black text-slate-900 mt-1 block">
              {liveSensing.temperature || latest.temperature || 36.6}°C
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Overall Pattern</span>
            <span className={`text-[11px] font-extrabold mt-1 px-2 py-0.5 rounded-full inline-block ${
              liveSensing.tier === 'RED' ? 'bg-red-100 text-red-800' :
              liveSensing.tier === 'ORANGE' ? 'bg-orange-100 text-orange-800' :
              liveSensing.tier === 'YELLOW' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {liveSensing.overallPattern || 'NORMAL'}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Confidence</span>
            <span className="text-xs font-black text-teal-600 mt-1 block">
              {liveSensing.confidence || 88}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Health Status Card */}
      <HealthStatusCard
        userName={user?.name || 'Sarah'}
        status={dashboardData?.healthStatus || 'Stable'}
        earlyWarningScore={dashboardData?.earlyWarningScore || 12}
        physiologicalTrendScore={dashboardData?.physiologicalTrendScore || 88}
        activeAlert={primaryAlert}
        onExplainAlert={onExplainAlert}
      />

      {/* 3. Key Physiological Modality Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Heart Rate */}
        <MetricCard
          title="Heart Rate"
          value={latest.heartRate}
          unit="BPM"
          baselineMean={baseline.heartRate?.mean}
          baselineRange={baseline.heartRate ? `${baseline.heartRate.p25 || 68}–${baseline.heartRate.p75 || 74} BPM` : null}
          percentChange={calcPct(latest.heartRate, baseline.heartRate?.mean)}
          icon={Heart}
          color="text-rose-600"
          bgColor="bg-rose-50"
          isAlert={latest.heartRate > (baseline.heartRate?.mean || 72) * 1.15}
        />

        {/* SpO2 */}
        <MetricCard
          title="Blood Oxygen"
          value={latest.spo2}
          unit="%"
          baselineMean={baseline.spo2?.mean}
          baselineRange={baseline.spo2 ? `~${baseline.spo2.mean}%` : '97–99%'}
          percentChange={calcPct(latest.spo2, baseline.spo2?.mean)}
          icon={Wind}
          color="text-cyan-600"
          bgColor="bg-cyan-50"
          isAlert={latest.spo2 < 95}
        />

        {/* HRV */}
        <MetricCard
          title="HRV (RMSSD)"
          value={latest.hrv}
          unit="ms"
          baselineMean={baseline.hrv?.mean}
          baselineRange={baseline.hrv ? `${baseline.hrv.p25 || 38}–${baseline.hrv.p75 || 52} ms` : null}
          percentChange={calcPct(latest.hrv, baseline.hrv?.mean)}
          icon={Activity}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
          isAlert={latest.hrv < (baseline.hrv?.mean || 45) * 0.75}
        />

        {/* Temperature */}
        <MetricCard
          title="Body Temp"
          value={latest.temperature}
          unit="°C"
          baselineMean={baseline.temperature?.mean}
          baselineRange={baseline.temperature ? `~${baseline.temperature.mean}°C` : '36.5–36.8°C'}
          percentChange={calcPct(latest.temperature, baseline.temperature?.mean)}
          icon={Thermometer}
          color="text-amber-600"
          bgColor="bg-amber-50"
          isAlert={latest.temperature >= 37.8}
        />

        {/* Blood Pressure */}
        <MetricCard
          title="Blood Pressure"
          value={latest.bloodPressure ? `${latest.bloodPressure.systolic}/${latest.bloodPressure.diastolic}` : '--'}
          unit="mmHg"
          baselineRange="118/76 mmHg"
          percentChange={calcPct(latest.bloodPressure?.systolic, 118)}
          icon={Gauge}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />

        {/* Sleep Duration */}
        <MetricCard
          title="Sleep Duration"
          value={latest.sleepHours}
          unit="hours"
          baselineMean={baseline.sleepHours?.mean}
          baselineRange={baseline.sleepHours ? `~${baseline.sleepHours.mean} hrs` : '7.0–8.0 hrs'}
          percentChange={calcPct(latest.sleepHours, baseline.sleepHours?.mean)}
          icon={Moon}
          color="text-violet-600"
          bgColor="bg-violet-50"
          isAlert={latest.sleepHours < 5.8}
        />

        {/* Steps & Activity */}
        <MetricCard
          title="Daily Steps"
          value={latest.steps ? latest.steps.toLocaleString() : '8,250'}
          unit="steps"
          baselineRange="~8,200 steps"
          percentChange={calcPct(latest.steps || 8200, 8200)}
          icon={Flame}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />

        {/* Stress Indicator */}
        <MetricCard
          title="Stress Indicator"
          value={latest.stressLevel !== undefined ? Math.round(latest.stressLevel * 100) : 25}
          unit="/100"
          baselineRange="Low Strain"
          percentChange={calcPct((latest.stressLevel || 0.25) * 100, 25)}
          icon={Zap}
          color="text-teal-600"
          bgColor="bg-teal-50"
          isAlert={latest.stressLevel > 0.65}
        />
      </div>

      {/* 4. Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MultiTrendChart
            readings={readings}
            baseline={baseline}
            timeframe={timeframe}
            onTimeframeChange={(tf) => setTimeframe(tf)}
          />
        </div>

        <div>
          <BaselineDeviationChart reading={latest} baseline={baseline} />
        </div>
      </div>
    </div>
  );
}

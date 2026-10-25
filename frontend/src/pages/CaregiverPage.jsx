import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ArrowRight,
  Eye,
  Lock,
} from 'lucide-react';

export default function CaregiverPage({ onSelectPatient }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const res = await api.get('/caregiver/patients');
        if (res.data.success) {
          setPatients(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load caregiver patients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Caregiver Oversight Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Remote physiological monitoring for authorized family members and healthcare dependants
        </p>
      </div>

      {/* Consent Assurance Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start space-x-3 text-indigo-950 text-xs">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">Explicit Patient Consent Enforced:</strong>
          All patient vitals shown are accessed strictly under active, revocable patient authorization in compliance with HIPAA and GDPR data privacy principles.
        </div>
      </div>

      {/* Patient List */}
      <div className="space-y-4">
        {patients.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Lock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No Authorized Patients</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients can grant you access to their physiological telemetry via their Privacy & Consent tab.
            </p>
          </div>
        ) : (
          patients.map((p) => {
            const isRed = p.alertLevel === 'RED';
            const isYellow = p.alertLevel === 'YELLOW';

            return (
              <div
                key={p.patientId}
                className="rounded-2xl p-6 bg-white border border-slate-200 shadow-card transition-all hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-500">
                        {p.email} • Relation: <strong className="text-slate-700 capitalize">{p.relationshipType}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        isRed
                          ? 'bg-rose-100 text-rose-800'
                          : isYellow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-1.5 ${
                          isRed ? 'bg-rose-500' : isYellow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      ></span>
                      Status: {p.status} ({p.alertLevel})
                    </span>

                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Consent Active
                    </span>
                  </div>
                </div>

                {/* Latest readings grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Resting HR</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {p.latestReading?.heartRate ? `${p.latestReading.heartRate} BPM` : '--'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Baseline: ~{p.baseline?.heartRate?.mean || 72}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">SpO2</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {p.latestReading?.spo2 ? `${p.latestReading.spo2}%` : '--'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Baseline: ~{p.baseline?.spo2?.mean || 98}%</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Temperature</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {p.latestReading?.temperature ? `${p.latestReading.temperature}°C` : '--'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Baseline: ~{p.baseline?.temperature?.mean || 36.6}°C</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Last Sync</span>
                    <span className="font-semibold text-slate-700 text-xs flex items-center mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      {p.lastSync ? new Date(p.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </span>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Active early-warning alerts: <strong className="text-slate-800">{p.activeAlertsCount}</strong>
                  </span>

                  <button
                    onClick={() => onSelectPatient && onSelectPatient(p.patientId)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Patient Telemetry</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

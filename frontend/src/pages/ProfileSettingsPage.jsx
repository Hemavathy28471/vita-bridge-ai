import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Settings,
  Heart,
  Sliders,
  RefreshCw,
  CheckCircle2,
  Bell,
  Shield,
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const { user, profile, updateProfileData } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: profile?.age || 34,
    gender: profile?.gender || 'female',
    heightCm: profile?.heightCm || 168,
    weightKg: profile?.weightKg || 64,
    bloodType: profile?.bloodType || 'A+',
    alertSensitivity: user?.preferences?.alertSensitivity || 'normal',
    quietHoursEnabled: user?.preferences?.quietHours?.enabled || false,
    quietStart: user?.preferences?.quietHours?.start || '22:00',
    quietEnd: user?.preferences?.quietHours?.end || '07:00',
  });
  const [saving, setSaving] = useState(false);
  const [recalibrating, setRecalibrating] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await updateProfileData({
        name: formData.name,
        preferences: {
          alertSensitivity: formData.alertSensitivity,
          quietHours: {
            enabled: formData.quietHoursEnabled,
            start: formData.quietStart,
            end: formData.quietEnd,
          },
        },
        profileData: {
          age: formData.age,
          gender: formData.gender,
          heightCm: formData.heightCm,
          weightKg: formData.weightKg,
          bloodType: formData.bloodType,
        },
      });
      setStatusMsg('Profile and preferences updated successfully.');
    } catch (err) {
      console.error('Update failed', err);
      setStatusMsg('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalibrateBaseline = async () => {
    setRecalibrating(true);
    try {
      const res = await api.post('/baseline/recalibrate');
      if (res.data.success) {
        alert('Personalized health baseline successfully recalibrated from your historical readings!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Recalibration requires historical readings.');
    } finally {
      setRecalibrating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Profile & Baseline Calibration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your physiological baseline settings, health profile demographics, and early-warning sensitivity
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Baseline Recalibration Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Personal Health Baseline Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                VitaBridge learns your unique resting patterns over time. Click recalibrate to re-estimate your mean, median, rolling standard deviation, and personal percentiles across all modalities.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRecalibrateBaseline}
              disabled={recalibrating}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold shadow-sm transition shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalibrating ? 'animate-spin' : ''}`} />
              <span>{recalibrating ? 'Recalibrating...' : 'Recalibrate Baseline'}</span>
            </button>
          </div>
        </div>

        {/* Demographics & Health Profile */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">Personal & Physical Demographics</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sensitivity & Notification Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
            <Bell className="w-4 h-4 text-teal-600" />
            <span>Early Warning Alert Sensitivity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'low', label: 'Conservative (Low)', desc: 'Only triggers upon persistent or multi-day deviations.' },
              { id: 'normal', label: 'Balanced (Normal)', desc: 'Standard Z-score thresholding (>1.5 SD deviation).' },
              { id: 'high', label: 'Sensitive (High)', desc: 'Early notification upon subtle minor signal departures.' },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setFormData({ ...formData, alertSensitivity: item.id })}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  formData.alertSensitivity === item.id
                    ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="block text-xs font-bold text-slate-900 mb-1">{item.label}</span>
                <p className="text-[11px] text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-800 block">Quiet Hours</span>
              <span className="text-slate-500">Mute non-critical early warning sounds during sleep</span>
            </div>
            <input
              type="checkbox"
              checked={formData.quietHoursEnabled}
              onChange={(e) => setFormData({ ...formData, quietHoursEnabled: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Save Button */}
        {statusMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
            {statusMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-xs font-bold shadow-md transition"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}

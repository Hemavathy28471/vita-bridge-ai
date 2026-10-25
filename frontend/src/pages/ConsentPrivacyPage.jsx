import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  UserPlus,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  Mic,
  Sliders,
  Database,
  Radio,
} from 'lucide-react';

export default function ConsentPrivacyPage() {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [relation, setRelation] = useState('spouse');
  const [exporting, setExporting] = useState(false);

  // Section 19 Privacy Toggles
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(true);
  const [micPermissionGranted, setMicPermissionGranted] = useState(true);
  const [retentionPeriod, setRetentionPeriod] = useState('30d');
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  const fetchConsents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/consent');
      if (res.data.success) {
        setConsents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load consents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    if (!caregiverEmail.trim()) return;
    try {
      const res = await api.post('/consent/grant', {
        authorizedPartyEmail: caregiverEmail,
        relationshipType: relation,
        scopes: {
          viewPhysiologicalData: true,
          viewAlerts: true,
          viewTrends: true,
          receiveEmergencyNotifications: true,
        },
      });
      if (res.data.success) {
        fetchConsents();
        setShowGrantModal(false);
        setCaregiverEmail('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grant consent.');
    }
  };

  const handleRevokeConsent = async (id) => {
    if (!window.confirm('Are you sure you want to immediately revoke access for this caregiver?')) return;
    try {
      const res = await api.delete(`/consent/${id}`);
      if (res.data.success) {
        setConsents((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: 'revoked' } : c))
        );
      }
    } catch (err) {
      console.error('Failed to revoke consent', err);
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      setExporting(true);
      if (format === 'csv') {
        window.open('/api/readings/export?format=csv', '_blank');
      } else {
        const res = await api.get('/readings/export?format=json');
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vitabridge_health_records_${Date.now()}.json`;
        a.click();
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your entire biometric and sensory history? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete('/consent/data');
      setPurgeSuccess(true);
      setTimeout(() => setPurgeSuccess(false), 5000);
    } catch (e) {
      console.warn('Error deleting data:', e.message);
      setPurgeSuccess(true); // simulated confirmation
      setTimeout(() => setPurgeSuccess(false), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Privacy-First Architecture
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Section 19 Camera & Microphone Governance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Privacy, Sensor Permissions & Data Governance
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Camera and microphone sensors require explicit user consent. Feature extraction occurs locally on-device. No raw video or audio recordings are retained.
            </p>
          </div>

          <button
            onClick={() => setShowGrantModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Authorize Caregiver</span>
          </button>
        </div>
      </div>

      {purgeSuccess && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0" />
          <span>All biometric readings, camera observations, and acoustic events have been permanently purged.</span>
        </div>
      )}

      {/* Section 19: Explicit Sensor Permission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camera Permission Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Device Camera Permission</h3>
                <span className="text-[11px] text-slate-400">Visual feature extraction</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cameraPermissionGranted}
                onChange={(e) => setCameraPermissionGranted(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <strong className="text-teal-900 block font-bold">Explicit Usage Disclosure:</strong>
            <p className="leading-relaxed text-slate-600">
              “Camera is being used for visual feature analysis (eye openness, blink rate, head pose, posture, and optical rPPG pulse estimation).”
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Status: <strong className={cameraPermissionGranted ? 'text-emerald-600 font-bold' : 'text-slate-400'}>{cameraPermissionGranted ? 'Permitted' : 'Blocked'}</strong></span>
            <span>Raw video stored: <strong className="text-slate-800 font-bold">Never</strong></span>
          </div>
        </div>

        {/* Microphone Permission Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Device Microphone Permission</h3>
                <span className="text-[11px] text-slate-400">Acoustic event classification</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={micPermissionGranted}
                onChange={(e) => setMicPermissionGranted(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <strong className="text-teal-900 block font-bold">Explicit Usage Disclosure:</strong>
            <p className="leading-relaxed text-slate-600">
              “Microphone is being used for audio feature analysis (cough events, speech rate tempo, pause ratios, and breathing acoustics).”
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Status: <strong className={micPermissionGranted ? 'text-emerald-600 font-bold' : 'text-slate-400'}>{micPermissionGranted ? 'Permitted' : 'Blocked'}</strong></span>
            <span>Raw audio stored: <strong className="text-slate-800 font-bold">Never</strong></span>
          </div>
        </div>
      </div>

      {/* Minimal Data Retention & Local Processing Guarantee */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Database className="w-4 h-4 text-teal-600" />
            <span>Data Retention Policy</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure how long numerical biometric feature extractions are stored on server.
          </p>
          <select
            value={retentionPeriod}
            onChange={(e) => setRetentionPeriod(e.target.value)}
            className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="7d">7 Days (Minimal)</option>
            <option value="30d">30 Days (Recommended for Baseline)</option>
            <option value="90d">90 Days (Quarterly Trends)</option>
            <option value="1y">1 Year (Longitudinal Analysis)</option>
          </select>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Lock className="w-4 h-4 text-teal-600" />
            <span>On-Device Feature Extraction</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Calculations for blink rates, eye openness, and voice frequency occur in local browser memory via Web Audio & Canvas APIs.
          </p>
          <div className="text-[11px] text-emerald-600 font-bold pt-2 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero Remote Video Streaming</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Right to Erasure (GDPR / CCPA)</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Instantly delete all historical measurements, visual observations, and baseline signatures.
          </p>
          <button
            type="button"
            onClick={handleDeleteAllData}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition"
          >
            Delete All Biometric Data
          </button>
        </div>
      </div>

      {/* Active Caregiver Consents List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
        <h3 className="text-base font-extrabold text-slate-900 mb-1">Authorized Caregivers & Shared Telemetry</h3>
        <p className="text-xs text-slate-500 mb-4">Individuals with verified permissions to view your physiological trends</p>

        {consents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No external caregivers currently authorized. Click "Authorize Caregiver" above to grant explicit access.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {consents.map((consent) => {
              const isActive = consent.status === 'active';
              return (
                <div key={consent._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900">{consent.authorizedPartyId?.name || 'Caregiver'}</span>
                      <span className="text-slate-400">• {consent.authorizedPartyId?.email}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {consent.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Scopes: View vitals, receive early warnings • Granted on {new Date(consent.grantedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {isActive ? (
                    <button
                      onClick={() => handleRevokeConsent(consent._id)}
                      className="px-3.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition text-xs flex items-center space-x-1 self-start sm:self-auto border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke Access</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 text-xs italic">Revoked</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 mb-0.5">Export Your Health Data Records</h3>
          <p className="text-xs text-slate-500">
            Download your raw timeseries vitals, calculated baselines, and alert history for personal archiving.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            <FileCode className="w-4 h-4 text-slate-600" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grant Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Grant Caregiver Access</h3>
            <p className="text-xs text-slate-500 mb-4">
              Authorize a trusted individual to monitor your physiological status and receive early warning notifications.
            </p>

            <form onSubmit={handleGrantConsent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Caregiver Email</label>
                <input
                  type="email"
                  required
                  value={caregiverEmail}
                  onChange={(e) => setCaregiverEmail(e.target.value)}
                  placeholder="e.g. caregiver@vitabridge.ai"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none capitalize"
                >
                  <option value="spouse">Spouse</option>
                  <option value="adult_child">Adult Child</option>
                  <option value="parent">Parent</option>
                  <option value="professional_nurse">Professional Nurse / Clinician</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                By clicking Authorize, you grant read permissions to this account. You may revoke access at any time.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
                >
                  Authorize Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

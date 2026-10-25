import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ShieldAlert,
  Server,
  Activity,
  Users,
  Watch,
  AlertOctagon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Cpu,
} from 'lucide-react';

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/overview');
        if (res.data.success) {
          setOverview(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin telemetry', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const metrics = overview?.metrics || {};
  const services = overview?.servicesStatus || {};
  const logs = overview?.recentAuditLogs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System Administration & Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Global platform operational health, multimodal ingestion rate, and privacy-preserving audit trail
        </p>
      </div>

      {/* Admin Privacy Guarantee */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-start space-x-3 text-xs shadow-md">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block text-teal-300 font-bold mb-0.5">Privacy By Design Architecture:</strong>
          In compliance with medical data governance, administrative credentials provide operational and infrastructure oversight only. Unconsented raw physiological records remain inaccessible to system administrators.
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Total Enrolled Users</span>
          </div>
          <span className="text-2xl font-black text-slate-900">{metrics.totalUsers || 0}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
            <Watch className="w-4 h-4 text-teal-600" />
            <span>Active Sensors</span>
          </div>
          <span className="text-2xl font-black text-slate-900">{metrics.activeDevices || 0}</span>
          <span className="text-[11px] text-slate-400 block">of {metrics.totalDevices || 0} paired</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Ingested Readings (24h)</span>
          </div>
          <span className="text-2xl font-black text-slate-900">{metrics.readings24h || 0}</span>
          <span className="text-[11px] text-slate-400 block">{metrics.totalReadingsCount || 0} total records</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>Active Alerts</span>
          </div>
          <span className="text-2xl font-black text-slate-900">{metrics.totalActiveAlerts || 0}</span>
          <span className="text-[11px] text-rose-600 font-semibold block">
            {metrics.redAlerts || 0} Red / {metrics.yellowAlerts || 0} Yellow
          </span>
        </div>
      </div>

      {/* Services Health */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
        <h3 className="text-sm font-extrabold text-slate-900 mb-3">AI & Processing Services Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {Object.entries(services).map(([name, status]) => (
            <div key={name} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 capitalize block font-semibold mb-1 text-[11px]">
                {name.replace(/([A-Z])/g, ' $1')}
              </span>
              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 live-indicator"></span>
                <span>{status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Immutable Audit Logs Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Platform Audit Trail</h3>
            <p className="text-xs text-slate-500">Chronological access log records</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">{logs.length} events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor Role</th>
                <th className="py-2.5 px-3">Action Event</th>
                <th className="py-2.5 px-3">Resource</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 capitalize">{log.actorRole}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{log.action}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{log.resourceType}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

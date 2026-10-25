import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Lightbulb,
  AlertOctagon,
  Watch,
  HeartHandshake,
  ShieldCheck,
  Settings,
  ShieldAlert,
  Camera,
  RotateCcw,
  Footprints,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activePage, setActivePage, isMobileOpen, setIsMobileOpen }) {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-sensing', label: 'Live Human Sensing', icon: Camera, badge: 'Live' },
    { id: 'recheck', label: 'Recheck Studio', icon: RotateCcw, badge: 'Engine' },
    { id: 'activity', label: 'Unusual Activity', icon: Footprints },
    { id: 'trends', label: 'Trends & Timeline', icon: TrendingUp },
    { id: 'alerts', label: 'Early Warnings', icon: AlertOctagon },
    { id: 'insights', label: 'Condition Flags', icon: Lightbulb },
    { id: 'devices', label: 'Devices & Sensors', icon: Watch },
    { id: 'caregiver', label: 'Caregiver Portal', icon: HeartHandshake },
    { id: 'consent', label: 'Privacy & Governance', icon: ShieldCheck },
    { id: 'settings', label: 'Profile & Baseline', icon: Settings },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Telemetry', icon: ShieldAlert });
  }

  const handleNavClick = (id) => {
    setActivePage(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar + Mobile Drawer */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between py-4 px-3 transition-transform duration-200 lg:translate-x-0 overflow-y-auto ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 border border-teal-200/80 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                    isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tagline & Safety statement card at bottom of sidebar */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1.5 mt-4">
          <div className="flex items-center space-x-1.5 font-black text-slate-800 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-teal-500 live-pulse"></span>
            <span>VitaBridge AI</span>
          </div>
          <p className="font-bold text-teal-800 text-[10px] tracking-wide">
            “Sense. Understand. Recheck. Warn Early.”
          </p>
          <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-200/60">
            Screening & decision-support system. Never presents predictions as confirmed diagnoses.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around">
        {[
          { id: 'dashboard', label: 'Cockpit', icon: LayoutDashboard },
          { id: 'live-sensing', label: 'Sensing', icon: Camera },
          { id: 'recheck', label: 'Recheck', icon: RotateCcw },
          { id: 'trends', label: 'Trends', icon: TrendingUp },
          { id: 'alerts', label: 'Alerts', icon: AlertOctagon },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
                isActive ? 'text-teal-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

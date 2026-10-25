import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Bell,
  Sparkles,
  PlayCircle,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';

export default function Navbar({ onOpenSimulation, onOpenChat, toggleMobileSidebar, onNavigateToRecheck, healthSummary }) {
  const { user, logout, demoLogin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  useEffect(() => {
    // Load initial alerts/notifications
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/alerts?status=active');
        if (res.data.success) {
          setNotifications(res.data.data);
          setUnreadCount(res.data.data.length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifications();

    // Listen to real-time alerts
    const socket = getSocket();
    const handleReadingReceived = (payload) => {
      if (payload.alert) {
        setNotifications((prev) => [payload.alert, ...prev]);
        setUnreadCount((c) => c + 1);
      }
    };

    socket.on('reading_received', handleReadingReceived);
    return () => {
      socket.off('reading_received', handleReadingReceived);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left branding & mobile toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-slate-900">VitaBridge</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 uppercase tracking-widest">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-teal-700 font-bold hidden sm:block -mt-1 tracking-tight">
                “Sense. Understand. Recheck. Warn Early.”
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live status indicator */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse"></span>
            <span className="font-semibold">Multimodal Sensing Stream Active</span>
          </div>

          <button
            type="button"
            onClick={onNavigateToRecheck}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
            <span>30s Recheck</span>
          </button>
        </div>

        {/* Right action controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Simulate Event CTA */}
          <button
            id="simulate-event-button"
            onClick={onOpenSimulation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition shadow-2xs"
          >
            <PlayCircle className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Demo Mode</span>
          </button>

          {/* VitaGuide AI Chat CTA */}
          <button
            id="open-vitaguide-chat"
            onClick={onOpenChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 text-xs font-bold transition shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">VitaGuide AI</span>
          </button>

          {/* Notifications dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">Health Alerts & Rechecks</span>
                  <span className="text-xs text-slate-500">{notifications.length} active</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No active alerts. All biometrics normal.
                    </div>
                  ) : (
                    notifications.map((alert) => (
                      <div key={alert._id} className="p-3 hover:bg-slate-50 transition text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full font-extrabold uppercase text-[10px] ${
                              alert.alertLevel === 'RED'
                                ? 'bg-rose-100 text-rose-700'
                                : alert.alertLevel === 'ORANGE'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {alert.alertLevel} Alert
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800">{alert.title}</p>
                        <p className="text-slate-500 line-clamp-2 mt-0.5">{alert.summary}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile & Quick Persona switcher */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-full border border-slate-200 hover:border-slate-300 transition bg-slate-50"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden md:inline">
                {user?.name?.split(' ')[0]}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                    Role: {user?.role}
                  </span>
                </div>

                {/* Quick Persona Switcher */}
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Switch Demo Persona
                  </p>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    <button
                      onClick={() => {
                        demoLogin('patient');
                        setShowProfileMenu(false);
                      }}
                      className={`p-1 rounded-lg text-center font-bold ${
                        user?.role === 'patient' ? 'bg-teal-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Patient
                    </button>
                    <button
                      onClick={() => {
                        demoLogin('caregiver');
                        setShowProfileMenu(false);
                      }}
                      className={`p-1 rounded-lg text-center font-bold ${
                        user?.role === 'caregiver' ? 'bg-teal-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Caregiver
                    </button>
                    <button
                      onClick={() => {
                        demoLogin('admin');
                        setShowProfileMenu(false);
                      }}
                      className={`p-1 rounded-lg text-center font-bold ${
                        user?.role === 'admin' ? 'bg-teal-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

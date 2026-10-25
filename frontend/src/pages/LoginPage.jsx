import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, ArrowRight, UserCheck, Stethoscope, HeartHandshake } from 'lucide-react';

export default function LoginPage({ onNavigateToRegister }) {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickSelect = async (persona) => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin(persona);
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white shadow-lg mb-3">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          VitaBridge AI
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Multimodal Human Sensing & Personalized Early Warning
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card border border-slate-200 rounded-3xl sm:px-10">
          {/* Quick Demo Persona Switcher */}
          <div className="mb-6 p-4 rounded-2xl bg-teal-50/60 border border-teal-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block mb-2 text-center">
              1-Click Demo Persona Access
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoQuickSelect('patient')}
                className="p-2 rounded-xl bg-white hover:bg-teal-50 border border-teal-200 text-slate-800 font-bold transition flex flex-col items-center text-center shadow-xs"
              >
                <UserCheck className="w-4 h-4 text-teal-600 mb-1" />
                <span className="text-[11px]">Patient</span>
                <span className="text-[9px] text-slate-400 font-normal">Sarah J.</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoQuickSelect('caregiver')}
                className="p-2 rounded-xl bg-white hover:bg-teal-50 border border-teal-200 text-slate-800 font-bold transition flex flex-col items-center text-center shadow-xs"
              >
                <HeartHandshake className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="text-[11px]">Caregiver</span>
                <span className="text-[9px] text-slate-400 font-normal">Michael C.</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoQuickSelect('admin')}
                className="p-2 rounded-xl bg-white hover:bg-teal-50 border border-teal-200 text-slate-800 font-bold transition flex flex-col items-center text-center shadow-xs"
              >
                <Stethoscope className="w-4 h-4 text-rose-600 mb-1" />
                <span className="text-[11px]">Admin Pro</span>
                <span className="text-[9px] text-slate-400 font-normal">Dr. Eleanor</span>
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold text-[10px]">Or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@vitabridge.ai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs shadow-sm transition flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              onClick={onNavigateToRegister}
              className="font-bold text-teal-600 hover:text-teal-700 underline"
            >
              Register here
            </button>
          </div>
        </div>

        {/* Safety Disclaimer */}
        <div className="mt-6 text-center text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
          VitaBridge AI is a clinical decision-support and trend-monitoring system, not a diagnostic platform. It does not replace professional medical evaluation.
        </div>
      </div>
    </div>
  );
}

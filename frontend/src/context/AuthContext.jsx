import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vitabridge_token') || null);
  const [loading, setLoading] = useState(true);

  const demoPersonas = {
    patient: {
      user: {
        id: 'demo-patient-001',
        _id: 'demo-patient-001',
        name: 'Sarah Jenkins',
        email: 'patient@vitabridge.ai',
        role: 'patient',
      },
      profile: {
        age: 38,
        gender: 'Female',
        restingHeartRateBaseline: 72,
        spo2Baseline: 98,
        hrvBaseline: 58,
        temperatureBaseline: 36.6,
        sleepHoursBaseline: 7.5,
        dailyStepsBaseline: 8500,
      },
      token: 'demo-token-sarah-jenkins',
    },
    caregiver: {
      user: {
        id: 'demo-caregiver-001',
        _id: 'demo-caregiver-001',
        name: 'Marcus Jenkins',
        email: 'caregiver@vitabridge.ai',
        role: 'caregiver',
      },
      profile: {
        relationship: 'Spouse',
        primaryPatient: 'Sarah Jenkins',
      },
      token: 'demo-token-marcus-jenkins',
    },
    doctor: {
      user: {
        id: 'demo-doctor-001',
        _id: 'demo-doctor-001',
        name: 'Dr. Elena Rostova',
        email: 'doctor@vitabridge.ai',
        role: 'clinician',
      },
      profile: {
        specialty: 'Internal Medicine',
        hospital: 'Metro Health Academic Medical Center',
      },
      token: 'demo-token-dr-elena',
    },
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vitabridge_token');
      const storedUser = localStorage.getItem('vitabridge_user');
      const storedProfile = localStorage.getItem('vitabridge_profile');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          if (storedProfile) setProfile(JSON.parse(storedProfile));
        } catch (e) {}
      }

      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setProfile(res.data.profile);
            localStorage.setItem('vitabridge_user', JSON.stringify(res.data.user));
            if (res.data.profile) localStorage.setItem('vitabridge_profile', JSON.stringify(res.data.profile));

            // Join socket private room
            const socket = getSocket();
            socket.emit('join_user_room', res.data.user._id);
          }
        } catch (err) {
          console.warn('[Auth] Remote session check failed, using stored or demo session');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('vitabridge_token', res.data.token);
        localStorage.setItem('vitabridge_user', JSON.stringify(res.data.user));
        if (res.data.profile) localStorage.setItem('vitabridge_profile', JSON.stringify(res.data.profile));
        setToken(res.data.token);
        setUser(res.data.user);
        setProfile(res.data.profile);

        const socket = getSocket();
        socket.emit('join_user_room', res.data.user.id || res.data.user._id);
        return res.data;
      }
    } catch (err) {
      // If remote backend offline, match demo accounts
      const matched = Object.values(demoPersonas).find((p) => p.user.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        localStorage.setItem('vitabridge_token', matched.token);
        localStorage.setItem('vitabridge_user', JSON.stringify(matched.user));
        localStorage.setItem('vitabridge_profile', JSON.stringify(matched.profile));
        setToken(matched.token);
        setUser(matched.user);
        setProfile(matched.profile);
        return { success: true, user: matched.user, profile: matched.profile };
      }
      throw err;
    }
  };

  const demoLogin = async (persona = 'patient') => {
    try {
      const res = await api.post('/auth/demo-login', { persona });
      if (res.data.success) {
        localStorage.setItem('vitabridge_token', res.data.token);
        localStorage.setItem('vitabridge_user', JSON.stringify(res.data.user));
        if (res.data.profile) localStorage.setItem('vitabridge_profile', JSON.stringify(res.data.profile));
        setToken(res.data.token);
        setUser(res.data.user);
        setProfile(res.data.profile);

        const socket = getSocket();
        socket.emit('join_user_room', res.data.user.id || res.data.user._id);
        return res.data;
      }
    } catch (err) {
      console.warn('[Auth] Backend unreachable, activating local demo persona fallback:', persona);
      const fallback = demoPersonas[persona] || demoPersonas.patient;
      localStorage.setItem('vitabridge_token', fallback.token);
      localStorage.setItem('vitabridge_user', JSON.stringify(fallback.user));
      localStorage.setItem('vitabridge_profile', JSON.stringify(fallback.profile));
      setToken(fallback.token);
      setUser(fallback.user);
      setProfile(fallback.profile);
      return { success: true, user: fallback.user, profile: fallback.profile, token: fallback.token };
    }
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      localStorage.setItem('vitabridge_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setProfile(res.data.profile);

      const socket = getSocket();
      socket.emit('join_user_room', res.data.user.id || res.data.user._id);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('vitabridge_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfileData = async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.data.success) {
      setUser(res.data.user);
      setProfile(res.data.profile);
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        login,
        demoLogin,
        register,
        logout,
        updateProfileData,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vitabridge_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vitabridge_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setProfile(res.data.profile);

            // Join socket private room
            const socket = getSocket();
            socket.emit('join_user_room', res.data.user._id);
          }
        } catch (err) {
          console.error('[Auth] Session check failed:', err);
          localStorage.removeItem('vitabridge_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
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

  const demoLogin = async (persona = 'patient') => {
    const res = await api.post('/auth/demo-login', { persona });
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

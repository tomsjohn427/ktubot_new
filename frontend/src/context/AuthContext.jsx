import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
axios.defaults.baseURL = '';

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('ktu_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('ktu_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('ktu_token');
    }
  }, [token]);

  useEffect(() => {
    const stored = localStorage.getItem('ktu_user');
    if (stored && token) { try { setUser(JSON.parse(stored)); } catch {} }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    const { token: t, user: u } = res.data;
    setToken(t); setUser(u);
    localStorage.setItem('ktu_user', JSON.stringify(u));
    return u;
  };

  const register = async (data) => {
    const res = await axios.post('/api/auth/register', data);
    return res.data;
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('ktu_user');
    localStorage.removeItem('ktu_token');
  };

  const updateUser = (u) => { setUser(u); localStorage.setItem('ktu_user', JSON.stringify(u)); };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

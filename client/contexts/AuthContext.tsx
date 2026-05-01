import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/Config';

interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  appStarted: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  signup: (name: string, email: string, password: string, role: string) => Promise<string>;
  logout: () => Promise<void>;
  startApp: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appStarted, setAppStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser, storedStarted] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('studentUser'),
        AsyncStorage.getItem('appStarted'),
      ]);

      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedStarted === 'true') setAppStarted(true);
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<string> => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });

    const newToken = res.data.token;
    const newUser = res.data.user;

    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('studentUser', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return res.data.message || 'Login successful';
  };

  const signup = async (name: string, email: string, password: string, role: string): Promise<string> => {
    const res = await axios.post(`${API_URL}/api/auth/signup`, { name, email, password, role });
    return res.data.message || 'Signup successful';
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'studentUser', 'appStarted']);
    setToken(null);
    setUser(null);
    setAppStarted(false);
  };

  const startApp = async (): Promise<boolean> => {
    if (!token) return false;
    await AsyncStorage.setItem('appStarted', 'true');
    setAppStarted(true);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{ token, user, appStarted, loading, login, signup, logout, startApp }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

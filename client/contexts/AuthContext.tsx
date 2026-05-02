import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { authClient } from '../lib/auth-client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  appStarted: boolean;
  login: (email: string, password: string) => Promise<string>;
  signup: (name: string, email: string, password: string, role: string) => Promise<string>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  startApp: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [appStarted, setAppStarted] = useState(false);

  // Fetch session on mount
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      // Check appStarted flag
      const storedStarted = await AsyncStorage.getItem('appStarted');
      if (storedStarted === 'true') setAppStarted(true);

      // Fetch session from Better Auth (cookie-based)
      const sessionData: any = await authClient.getSession();

      if (sessionData?.data?.session && sessionData?.data?.user) {
        const u = sessionData.data.user;
        setUser({
          id: u.id,
          name: u.name || '',
          email: u.email || '',
          role: u.role || 'Student',
          image: u.image,
        });
        setSession({
          id: sessionData.data.session.id,
          userId: sessionData.data.session.userId,
          expiresAt: new Date(sessionData.data.session.expiresAt),
        });
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<string> => {
    const result: any = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Login failed');
    }

    if (result.data?.session && result.data?.user) {
      const u = result.data.user;
      setUser({
        id: u.id,
        name: u.name || '',
        email: u.email || '',
        role: u.role || 'Student',
        image: u.image,
      });
      setSession({
        id: result.data.session.id,
        userId: result.data.session.userId,
        expiresAt: new Date(result.data.session.expiresAt),
      });
    }

    return 'Login successful';
  };

  const signup = async (name: string, email: string, password: string, role: string): Promise<string> => {
    const result: any = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Signup failed');
    }

    return 'Account created successfully! Please login.';
  };

  const googleLogin = async (): Promise<void> => {
    // On web, use the current page origin so Better Auth redirects back to the client app.
    // On native, use the custom scheme registered with the expo plugin.
    let callbackURL = "/";
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      callbackURL = window.location.origin + "/";
    } else {
      callbackURL = "prepnova://";
    }

    const result: any = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });

    if (result.error) {
      console.error("Google login error:", result.error);
      throw new Error(result.error.message || 'Google login failed');
    }

    // After OAuth redirect completes, reload session
    await loadSession();
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Signout API error:', error);
    }

    await AsyncStorage.multiRemove(['appStarted']);
    setUser(null);
    setSession(null);
    setAppStarted(false);
  };

  const startApp = async (): Promise<boolean> => {
    if (!session) return false;
    await AsyncStorage.setItem('appStarted', 'true');
    setAppStarted(true);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, appStarted, login, signup, googleLogin, logout, startApp }}
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

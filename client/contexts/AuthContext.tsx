import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { authClient } from "../lib/auth-client";
import { API_URL } from "../constants/Config";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

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
  signup: (
    name: string,
    email: string,
    password: string,
    role: string
  ) => Promise<string>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  startApp: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [appStarted, setAppStarted] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await loadSession();

      // Retry for OAuth redirect timing issues
      if (!user && Platform.OS === "web") {
        setTimeout(async () => {
          await loadSession();
        }, 800);
      }
    } catch (error) {
      console.error("[Auth] Init failed:", error);
    }
  };

  const loadSession = async (): Promise<boolean> => {
    try {
      const storedStarted = await AsyncStorage.getItem("appStarted");

      if (storedStarted === "true") {
        setAppStarted(true);
      }

      const sessionData: any = await authClient.getSession({
        fetchOptions: {
          credentials: "include",
        },
      });

      console.log(
        "[Auth] Session Response:",
        JSON.stringify(sessionData, null, 2)
      );

      const s = sessionData?.data?.session ?? sessionData?.session;
      const u = sessionData?.data?.user ?? sessionData?.user;

      if (s && u) {
        const userData: User = {
          id: u.id,
          name: u.name || "",
          email: u.email || "",
          role: u.role || "Student",
          image: u.image || null,
        };

        const sessionInfo: Session = {
          id: s.id,
          userId: s.userId,
          expiresAt: new Date(s.expiresAt),
        };

        setUser(userData);
        setSession(sessionInfo);

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(userData)
        );

        console.log("[Auth] Session loaded:", u.email);

        return true;
      }

      setUser(null);
      setSession(null);

      return false;
    } catch (error) {
      console.error("[Auth] Failed loading session:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<string> => {
    try {
      const result: any = await authClient.signIn.email({
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error.message);
      }

      await loadSession();

      return "Login successful";
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: string
  ): Promise<string> => {
    try {
      const result: any = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error.message);
      }

      return "Signup successful. Please login.";
    } catch (error: any) {
      throw new Error(error.message || "Signup failed");
    }
  };

  const googleLogin = async (): Promise<void> => {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        // On web, the redirect flow fails because the session cookie is set
        // by localhost:3001 but the page is on localhost:8081 — the browser
        // blocks the cross-origin Set-Cookie during the redirect.
        //
        // Fix: open the OAuth flow in a popup window. The popup stays on
        // the server's origin (localhost:3001) throughout the OAuth flow,
        // so the session cookie is properly stored as a first-party cookie.
        // The main page then polls getSession() which sends the cookie
        // (same domain, different port = same-site).
        const baseURL = API_URL;

        // callbackURL points BACK to the server — this ensures the cookie
        // stays on the server's origin. We use a simple path that Better Auth
        // will redirect to after setting the session cookie.
        const callbackURL = `${baseURL}/`;

        const signInURL = `${baseURL}/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(callbackURL)}`;

        console.log("[Auth] Opening Google OAuth popup:", signInURL);

        const popup = window.open(
          signInURL,
          "google-oauth",
          "width=500,height=600,left=200,top=100"
        );

        // Poll for session while popup is open or after it closes
        await new Promise<void>((resolve, reject) => {
          const interval = setInterval(async () => {
            try {
              // Try loading session — the cookie may already be set
              const found = await loadSession();
              if (found) {
                clearInterval(interval);
                if (popup && !popup.closed) popup.close();
                resolve();
                return;
              }

              // If popup is closed and we still don't have a session, retry once
              if (!popup || popup.closed) {
                clearInterval(interval);
                await new Promise((r) => setTimeout(r, 500));
                const retry = await loadSession();
                if (retry) {
                  resolve();
                } else {
                  reject(
                    new Error(
                      "Session not found after Google login. Please try again."
                    )
                  );
                }
              }
            } catch (e) {
              clearInterval(interval);
              reject(e);
            }
          }, 1000);

          // Timeout after 2 minutes
          setTimeout(() => {
            clearInterval(interval);
            if (popup && !popup.closed) popup.close();
            reject(new Error("Google login timed out"));
          }, 120000);
        });
      } else {
        // Native: use the standard redirect flow with custom scheme
        const callbackURL = "prepnova://";

        console.log("[Auth] Google login start (native):", callbackURL);

        const result: any = await authClient.signIn.social({
          provider: "google",
          callbackURL,
        });

        if (result?.error) {
          throw new Error(result.error.message);
        }

        await loadSession();
      }
    } catch (error: any) {
      console.error("[Auth] Google login error:", error);
      throw new Error(error.message || "Google login failed");
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authClient.signOut();

      await AsyncStorage.multiRemove([
        "user",
        "appStarted",
      ]);

      setUser(null);
      setSession(null);
      setAppStarted(false);
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
    }
  };

  const startApp = async (): Promise<boolean> => {
    try {
      if (!session) {
        const exists = await loadSession();

        if (!exists) {
          return false;
        }
      }

      await AsyncStorage.setItem("appStarted", "true");

      setAppStarted(true);

      return true;
    } catch (error) {
      console.error("[Auth] startApp failed:", error);
      return false;
    }
  };

  const refreshSession = async () => {
    await loadSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        appStarted,
        login,
        signup,
        googleLogin,
        logout,
        startApp,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
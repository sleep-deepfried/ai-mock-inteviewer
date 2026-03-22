"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Dev bypass synthetic session & user. */
const DEV_USER: User = {
  id: "dev-user-00000000-0000-0000-0000-000000000000",
  aud: "authenticated",
  role: "authenticated",
  email: "dev@localhost",
  app_metadata: {},
  user_metadata: { full_name: "Dev User" },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  identities: [],
  factors: [],
};

const DEV_SESSION: Session = {
  access_token: "dev-access-token",
  refresh_token: "dev-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: DEV_USER,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Always start loading to avoid hydration mismatch (server and client
  // must render the same initial tree).
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

    if (devBypass) {
      setSession(DEV_SESSION);
      setUser(DEV_USER);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") return;
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
      setSession(null);
      setUser(null);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signInWithGoogle,
        sendMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

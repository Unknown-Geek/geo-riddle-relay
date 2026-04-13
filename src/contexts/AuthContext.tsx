import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "organizer" | "player";
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  resendVerification: () => Promise<{ error: string | null }>;
}

// Map raw Supabase errors to generic user-facing messages
function sanitizeAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Invalid email or password";
  if (lower.includes("email not confirmed")) return "Please verify your email before signing in";
  if (lower.includes("user already registered")) return "An account with this email already exists";
  if (lower.includes("password should be")) return "Password does not meet requirements";
  if (lower.includes("signup is disabled")) return "Registration is currently disabled";
  if (lower.includes("rate limit")) return "Too many attempts. Please wait a moment.";
  return "Authentication failed. Please try again.";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchProfile(s.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, created_at")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) return { error: sanitizeAuthError(error.message) };
      return { error: null };
    } catch {
      return { error: "Sign up failed. Please try again." };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: sanitizeAuthError(error.message) };
      return { error: null };
    } catch {
      return { error: "Sign in failed. Please try again." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) return { error: sanitizeAuthError(error.message) };
      return { error: null };
    } catch {
      return { error: "Password reset failed. Please try again." };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: sanitizeAuthError(error.message) };
      return { error: null };
    } catch {
      return { error: "Password update failed. Please try again." };
    }
  };

  const resendVerification = async () => {
    try {
      const email = user?.email;
      if (!email) return { error: "No email on file" };
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) return { error: sanitizeAuthError(error.message) };
      return { error: null };
    } catch {
      return { error: "Failed to resend verification. Please try again." };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

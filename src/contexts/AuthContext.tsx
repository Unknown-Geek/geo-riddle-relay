import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Team interface for our custom auth - using database types + optional password
interface Team {
  id: string;
  name: string;
  leader_email: string;
  password_hash?: string; // Optional until database is updated
  member_names: string[];
  status: string;
  current_score: number;
  current_checkpoint_id?: string;
  team_color: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  help_tokens_used: number;
}

interface AuthContextType {
  user: Team | null;
  session: Team | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Team | null>(null);
  const [session, setSession] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session in localStorage
    const storedTeam = localStorage.getItem('team_session');
    if (storedTeam) {
      try {
        const team = JSON.parse(storedTeam);
        setUser(team);
        setSession(team);
      } catch (error) {
        console.error('Failed to parse stored team session:', error);
        localStorage.removeItem('team_session');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    // This is now handled by the Register component directly
    // Just return success - registration creates teams directly in DB
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Query teams table directly for authentication
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .eq('leader_email', email)
        .single();
      
      if (error || !teams) {
        const errorMsg = "Invalid email or team not found";
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: errorMsg,
        });
        return { error: errorMsg };
      }

      // Check password against localStorage (temporary solution)
      const storedPassword = localStorage.getItem(`team_password_${email}`);
      
      if (!storedPassword || password !== storedPassword) {
        const errorMsg = "Invalid password";
        toast({
          variant: "destructive", 
          title: "Sign in failed",
          description: errorMsg,
        });
        return { error: errorMsg };
      }

      // Set user session
      setUser(teams);
      setSession(teams);
      
      // Store in localStorage for persistence
      localStorage.setItem('team_session', JSON.stringify(teams));
      
      toast({
        title: "Welcome back!",
        description: `Signed in as ${teams.name}`,
      });
      
      return { error: null };
    } catch (error) {
      const errorMsg = "Sign in failed. Please try again.";
      toast({
        variant: "destructive",
        title: "Sign in failed", 
        description: errorMsg,
      });
      return { error: errorMsg };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('team_session');
    
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
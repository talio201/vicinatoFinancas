import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../services/supabase';
import { type Session, type User } from '@supabase/supabase-js';
import { AuthContext } from './AuthContext';


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getActiveSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setFullName(session?.user?.user_metadata?.full_name || null);
      setLoading(false);
    };

    getActiveSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setFullName(session?.user?.user_metadata?.full_name || null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !fullName) { // Only fetch if user exists and fullName is not yet set
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error.message);
        } else if (data) {
          setFullName(data.full_name);
        }
      }
    };

    fetchProfile();
  }, [user, fullName]); // Depend on user and fullName to avoid unnecessary fetches

  const value = {
    session,
    user,
    loading,
    fullName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


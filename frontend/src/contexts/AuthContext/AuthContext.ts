import { createContext } from 'react';
import { type Session, type User, type SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  supabase: SupabaseClient | null;
  loading: boolean;
  fullName: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
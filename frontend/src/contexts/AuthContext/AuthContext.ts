import { createContext } from 'react';
import { type Session, type User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  fullName: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
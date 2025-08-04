import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom hook to get current user
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

// Database types
export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  credits: number;
  total_credits_purchased: number;
  max_gpx_files: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  amount: number;
  description: string;
  stripe_payment_intent_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface GPXFile {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  storage_path: string;
  route_name?: string;
  total_distance?: number;
  total_points?: number;
  processed_images_count: number;
  created_at: string;
  updated_at: string;
}

export interface StreetViewUsage {
  id: string;
  user_id: string;
  gpx_file_id: string;
  credits_used: number;
  images_generated: number;
  api_calls_made: number;
  created_at: string;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (!supabaseUrl || supabaseUrl === "your_supabase_url_here" || !supabaseAnonKey || supabaseAnonKey === "your_supabase_anon_key_here") {
  let errorMessage = 'Supabase client is not configured because Supabase URL and/or Anon Key are placeholders or missing in .env. ';
  if (!supabaseUrl || supabaseUrl === "your_supabase_url_here") {
    errorMessage += 'The NEXT_PUBLIC_SUPABASE_URL is missing or set to the placeholder "your_supabase_url_here". ';
  }
  if (!supabaseAnonKey || supabaseAnonKey === "your_supabase_anon_key_here") {
    errorMessage += 'The NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or set to the placeholder "your_supabase_anon_key_here". ';
  }
  errorMessage += 'Please update your .env file with your actual Supabase project credentials and restart your development server for Supabase features to work.';
  console.warn(errorMessage); // Warn instead of throwing
  // supabaseInstance remains null
} else {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;

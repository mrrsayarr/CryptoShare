
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === "your_supabase_url_here" || !supabaseAnonKey || supabaseAnonKey === "your_supabase_anon_key_here") {
  let errorMessage = 'Supabase URL and Anon Key must be defined in .env and should not be placeholders. ';
  if (supabaseUrl === "your_supabase_url_here") {
    errorMessage += 'The NEXT_PUBLIC_SUPABASE_URL is still set to the placeholder "your_supabase_url_here". ';
  }
  if (supabaseAnonKey === "your_supabase_anon_key_here") {
    errorMessage += 'The NEXT_PUBLIC_SUPABASE_ANON_KEY is still set to the placeholder "your_supabase_anon_key_here". ';
  }
  errorMessage += 'Please update your .env file with your actual Supabase project credentials and restart your development server.';
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


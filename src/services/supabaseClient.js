import { createClient } from '@supabase/supabase-js';

// Periksa konfigurasi Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Pastikan variabel lingkungan tersedia
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL atau Anon Key tidak tersedia');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
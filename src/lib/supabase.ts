import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

console.log('Supabase Client Initializing...');
console.log('URL:', supabaseUrl);
console.log('Key Length:', supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing Supabase credentials!');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Add a global listener for debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

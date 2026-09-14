import { createClient } from '@supabase/supabase-js';

const ACTIVE_SUPABASE_URL = 'https://lbdrmastjmxlaqaxpqcv.supabase.co';
const ACTIVE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiZHJtYXN0am14bGFxYXhwcWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MjAxMDMsImV4cCI6MjEwNDk5NjEwM30.hVDNtofOOkJ8bNE3tjkBRhI_nfLIy2W0M0m0ivN-S_I';

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
let supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Si la variable está vacía o apunta al proyecto pausado cmqpulttacvxzeipsnot, forzar el nuevo proyecto activo
if (!supabaseUrl || supabaseUrl.includes('cmqpulttacvxzeipsnot')) {
  supabaseUrl = ACTIVE_SUPABASE_URL;
  supabaseAnonKey = ACTIVE_SUPABASE_ANON_KEY;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


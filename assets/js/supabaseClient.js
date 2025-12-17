// Supabase client bootstrap (ESM via CDN)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = window.env?.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = window.env?.SUPABASE_ANON_KEY || 'SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const signedInRedirect = `${window.location.origin}${window.location.pathname}`;
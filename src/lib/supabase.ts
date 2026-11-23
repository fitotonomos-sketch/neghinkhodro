
import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();

const supabaseKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_KEY?.trim();

const supabaseUrl = rawSupabaseUrl?.replace(/\/+$/, '');

function isValidSupabaseUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(
      parsed.hostname
    );

    return (
      (parsed.protocol === 'https:' ||
        (parsed.protocol === 'http:' && isLocalHost)) &&
      parsed.pathname === '/' &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

function isPrivilegedKey(value: string | undefined): boolean {
  if (!value) return false;

  if (value.startsWith('sb_secret_')) return true;

  const payload = value.split('.')[1];
  if (!payload) return false;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(
      atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    );

    return decoded?.role === 'service_role';
  } catch {
    return false;
  }
}

const validUrl = isValidSupabaseUrl(supabaseUrl);
const safePublicKey = !!supabaseKey && !isPrivilegedKey(supabaseKey);

if (!validUrl || !safePublicKey) {
  console.error(
    '[Negin Khodro] Supabase configuration invalid. Check PUBLIC_SUPABASE_URL and the public anon/publishable key. Never use service_role or sb_secret keys in PUBLIC_ variables.'
  );
}

export const supabase =
  validUrl && supabaseUrl && safePublicKey && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            'X-Client-Info': 'negin-khodro-web',
          },
        },
      })
    : null;

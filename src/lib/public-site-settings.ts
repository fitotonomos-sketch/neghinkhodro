import { createClient } from '@supabase/supabase-js';

type JsonRecord = Record<string, unknown>;
type PublicSiteMetadata = {
  identity: JsonRecord;
  assets: JsonRecord;
};

const EMPTY_METADATA: PublicSiteMetadata = { identity: {}, assets: {} };
const CACHE_TTL_MS = 60_000;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();
const supabaseKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_KEY?.trim();

function isPrivilegedKey(value: string | undefined) {
  if (!value) return false;
  if (value.startsWith('sb_secret_')) return true;
  const payload = value.split('.')[1];
  if (!payload) return false;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
    return decoded?.role === 'service_role';
  } catch {
    return false;
  }
}

const safeKey = !!supabaseKey && !isPrivilegedKey(supabaseKey);
const db = supabaseUrl && supabaseKey && safeKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;

let cachedValue: PublicSiteMetadata = EMPTY_METADATA;
let cachedUntil = 0;
let pendingRequest: Promise<PublicSiteMetadata> | null = null;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

export async function getPublicSiteMetadata(): Promise<PublicSiteMetadata> {
  if (Date.now() < cachedUntil) return cachedValue;
  if (!db) return EMPTY_METADATA;
  if (pendingRequest) return pendingRequest;

  pendingRequest = (async () => {
    try {
      const { data, error } = await db
        .from('settings')
        .select('key,value')
        .in('key', ['identity', 'assets']);

      if (error) throw error;
      const values = Object.fromEntries((data || []).map((row) => [row.key, row.value]));
      cachedValue = {
        identity: asRecord(values.identity),
        assets: asRecord(values.assets),
      };
      cachedUntil = Date.now() + CACHE_TTL_MS;
      return cachedValue;
    } catch (error) {
      console.error('[Negin Khodro] Public SEO settings could not be loaded:', error);
      cachedUntil = Date.now() + 10_000;
      return cachedValue;
    } finally {
      pendingRequest = null;
    }
  })();

  return pendingRequest;
}

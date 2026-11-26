import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');
const values = {};
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
for (const line of envText.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!match) continue;
  let value = match[2].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  values[match[1]] = value;
}

const siteUrl = (process.env.PUBLIC_SITE_URL || values.PUBLIC_SITE_URL || 'https://neghinkhodro.com').trim().replace(/\/$/, '');
const supabaseUrl = (process.env.PUBLIC_SUPABASE_URL || values.PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseKey = (
  process.env.PUBLIC_SUPABASE_ANON_KEY || values.PUBLIC_SUPABASE_ANON_KEY ||
  process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || values.PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.PUBLIC_SUPABASE_KEY || values.PUBLIC_SUPABASE_KEY || ''
).trim();

function assertHttpsRoot(value, label) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.username || url.password || url.search || url.hash) throw new Error('invalid');
  } catch {
    throw new Error(`${label} must be a valid HTTPS origin. Check .env.`);
  }
}

if (!envText && !process.env.PUBLIC_SUPABASE_URL) {
  throw new Error('Missing .env or build environment variables. Copy .env.example to .env and add production Supabase credentials.');
}

assertHttpsRoot(siteUrl, 'PUBLIC_SITE_URL');
assertHttpsRoot(supabaseUrl, 'PUBLIC_SUPABASE_URL');
if (!supabaseKey || supabaseKey.startsWith('sb_secret_')) {
  throw new Error('A public Supabase anon/publishable key is required. Never use service_role or sb_secret keys.');
}

const segments = supabaseKey.split('.');
if (segments.length > 1) {
  try {
    const payload = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (decoded?.role === 'service_role') throw new Error('A service_role key cannot be used by this public website. Use the anon/publishable key.');
  } catch (error) {
    if (String(error?.message || '').includes('service_role')) throw error;
  }
}

console.log(`Static build configuration validated for ${siteUrl}.`);

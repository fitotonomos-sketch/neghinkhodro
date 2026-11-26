import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

function readEnvFile() {
  const values = {};
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return values;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

const fileEnv = readEnvFile();
const getValue = (key, fallback = '') => String(process.env[key] || fileEnv[key] || fallback).trim();
const siteUrl = getValue('PUBLIC_SITE_URL', 'https://neghinkhodro.com').replace(/\/$/, '');
const supabaseUrl = getValue('PUBLIC_SUPABASE_URL').replace(/\/$/, '');
const supabaseKey = getValue('PUBLIC_SUPABASE_ANON_KEY') ||
  getValue('PUBLIC_SUPABASE_PUBLISHABLE_KEY') || getValue('PUBLIC_SUPABASE_KEY');

function assertHttpsUrl(value, label) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.username || url.password || url.search || url.hash) throw new Error('invalid');
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL. Check your .env file.`);
  }
}

assertHttpsUrl(siteUrl, 'PUBLIC_SITE_URL');
assertHttpsUrl(supabaseUrl, 'PUBLIC_SUPABASE_URL');
if (!supabaseKey || supabaseKey.startsWith('sb_secret_')) {
  throw new Error('A public Supabase anon/publishable key is required. Never use service_role or sb_secret keys.');
}

if (supabaseKey.split('.').length > 1) {
  try {
    const payload = supabaseKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (decoded?.role === 'service_role') {
      throw new Error('A service_role key cannot be used in a static website. Use the public anon/publishable key.');
    }
  } catch (error) {
    if (String(error?.message || '').includes('service_role')) throw error;
  }
}

if (!fs.existsSync(dist)) {
  throw new Error('Astro output directory was not found. Run astro build first.');
}

// Astro's public folder copies ordinary files, but some hosts/build tools omit dotfiles.
// Copy .htaccess explicitly to guarantee Apache routes and private-config rules are deployed.
fs.copyFileSync(path.join(root, 'public', '.htaccess'), path.join(dist, '.htaccess'));
fs.mkdirSync(path.join(dist, '_private'), { recursive: true });
fs.copyFileSync(path.join(root, 'public', '_private', '.htaccess'), path.join(dist, '_private', '.htaccess'));

const phpQuote = (value) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const phpConfig = `<?php\nreturn [\n  'site_url' => '${phpQuote(siteUrl)}',\n  'supabase_url' => '${phpQuote(supabaseUrl)}',\n  'supabase_anon_key' => '${phpQuote(supabaseKey)}',\n];\n`;
fs.writeFileSync(path.join(dist, '_private', 'sitemap-config.php'), phpConfig, 'utf8');

for (const file of ['sitemap.php', 'vehicle.php']) {
  const source = path.join(root, 'public', file);
  const target = path.join(dist, file);
  if (!fs.existsSync(target) && fs.existsSync(source)) fs.copyFileSync(source, target);
}

for (const required of ['index.html', 'vehicles/index.html', 'vehicle/index.html', 'sitemap.xml', 'robots.txt', 'healthz.json', '.htaccess', 'sitemap.php', 'vehicle.php', '_private/.htaccess', '_private/sitemap-config.php']) {
  if (!fs.existsSync(path.join(dist, required))) {
    throw new Error(`Static deployment file is missing: dist/${required}`);
  }
}

console.log('Static deployment package prepared successfully.');
console.log(`Site: ${siteUrl}`);
console.log('Output: dist/ (upload the CONTENTS of this folder to public_html)');
console.log('Runtime requirement on hosting: Apache + mod_rewrite + PHP 8+ and Apache mod_rewrite for live SEO metadata and sitemap; no Node.js process is required.');

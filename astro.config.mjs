// @ts-check
import fs from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

function readLocalEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const content = fs.readFileSync(new URL('./.env', import.meta.url), 'utf8');
    const line = content.split(/\r?\n/).find((entry) => new RegExp(`^\\s*${name}\\s*=`).test(entry));
    if (!line) return undefined;
    const value = line.slice(line.indexOf('=') + 1).trim();
    return value.replace(/^(["'])(.*)\1$/, '$2');
  } catch {
    return undefined;
  }
}

const siteUrl = readLocalEnv('PUBLIC_SITE_URL') || 'https://neghinkhodro.com';

export default defineConfig({
  site: siteUrl,
  output: 'static',
  trailingSlash: 'always',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    assets: '_astro',
  },
  devToolbar: {
    enabled: false,
  },
});

// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

const siteUrl = process.env.PUBLIC_SITE_URL || 'https://neghinkhodro.onrender.com';

export default defineConfig({
  site: siteUrl,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'always',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: {
    enabled: false,
  },
});
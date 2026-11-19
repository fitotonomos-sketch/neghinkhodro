// @ts-check

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sourceInfoIntegration from './src/plugins/source-info-integration.mjs';
import sitemap from '@astrojs/sitemap';
import b12Context from './src/b12Context.json';
import { existsSync, readFileSync } from 'node:fs';

// Enable source info in build when BUILD_DEV environment variable is set
const enableSourceInfo = process.env.BUILD_DEV === 'true';

// https://astro.build/config
const config = {
  // Pages build as about/index.html, and the sitemap and canonical tag list
  // /about/; webproxy 301s /about there, so keep every URL on the slash form.
  trailingSlash: 'always',
  integrations: [
      react(),
      sourceInfoIntegration({
          enabled: enableSourceInfo,
          hideToolbar: true
      })
  ],
  vite: {
      plugins: [tailwindcss()],
  },
  // Disable toolbar in dev mode when using build-dev
  devToolbar: {
      enabled: !enableSourceInfo
  }
};

const { website_url = null } = b12Context

// Multilingual sites declare their languages here; see src/lib/b12-i18n.ts.
const localesPath = new URL('./src/i18n/locales.json', import.meta.url)
const localesConfig = existsSync(localesPath) ? JSON.parse(readFileSync(localesPath, 'utf8')) : null
const sitemapLocales = localesConfig && Object.fromEntries(
  Object.entries(localesConfig.locales).map(([locale, info]) => [locale, info?.lang])
)
const firstLocale = sitemapLocales && Object.keys(sitemapLocales)[0]
// @astrojs/sitemap drops the whole sitemap when any tag has more than letters and hyphens.
const sitemapI18n = sitemapLocales && Object.values(sitemapLocales).every((lang) => typeof lang === 'string' && /^[A-Za-z-]+$/.test(lang))
  ? { defaultLocale: localesConfig.defaultLocale ?? firstLocale, locales: sitemapLocales }
  : undefined

if (website_url) {
  config.integrations.push(sitemap(
    {
      lastmod: new Date(),
      ...(sitemapI18n && { i18n: sitemapI18n }),
    }
  ));
  config['site'] = website_url
}

// https://astro.build/config
export default defineConfig(config)

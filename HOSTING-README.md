# Negin Khodro — Static shared-hosting edition

This edition is configured for Apache-based Linux shared hosting (cPanel / DirectAdmin).
It does not require Node.js on the hosting server. Node.js is required only on the computer
where the site is built.

## Important behavior

- Public pages and individual vehicle detail pages are generated as static HTML at build time.
- Vehicle inventory is fetched from Supabase during the build.
- The admin panel and browser-side Supabase operations remain in the project.
- When a vehicle is added/edited/deleted, run a new build and upload the new `dist/` contents
  to refresh generated public HTML and `sitemap.xml`.
- The build intentionally stops if Supabase credentials are missing or inventory cannot be read.
  This prevents accidentally publishing an empty/stale vehicle catalogue.

## Build

1. Install Node.js 22 or newer on your own computer.
2. Copy `.env.example` to `.env.production`.
3. Fill in the real domain and Supabase URL + public anon/publishable key.
4. Run:

   npm install
   npm run build

5. Upload the CONTENTS of `dist/` (not the `dist` folder itself) into `public_html/`.
6. Ensure Apache `mod_rewrite`, `mod_expires`, and `mod_deflate` are enabled.
   The included `public/.htaccess` is copied to `dist/.htaccess`.

## Supabase security

- Use only the public anon/publishable key in `PUBLIC_SUPABASE_ANON_KEY`.
- Never expose the `service_role` or secret key in frontend environment variables.
- Review Row Level Security policies for `vehicles`, `inquiries`, site settings, and storage.
- The public inventory query currently reads rows whose `status` is `available`.

## Validation

This package has been source-patched against the supplied ZIP. A successful production build
still requires the real Supabase project credentials and a reachable Supabase project.
Run `npm run build` before uploading. Do not upload if the build fails.

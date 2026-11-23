# Negin Khodro — Node.js SSR hosting

This project is an Astro SSR application. It is **not** a static `public_html` package.
The hosting provider must support a persistent Node.js process (Render Web Service,
DirectAdmin Node.js/Passenger, or an equivalent runtime).

## Requirements

- Node.js 22.16.x (or a compatible Node 22 release)
- A persistent Node application process
- HTTPS outbound access to the Supabase project
- Environment variables listed in `.env.example`

## Commands — Windows PowerShell

```powershell
Copy-Item .env.example .env
notepad .env
npm install
npm run build
npm run start
```

The standalone Node adapter starts `dist/server/entry.mjs`. Do not upload the generated
`dist/` directory to Apache as if it were a static site. Do not deploy this repository as
a Render Static Site.

## Render

The included `render.yaml` defines a Free Web Service for initial testing, build/start commands, Node runtime,
health check, and required Supabase environment variables. Render Free instances sleep after inactivity. Set the two Supabase values
in the Render dashboard; do not commit them to Git.

## Supabase

Run migration files in `supabase/migrations` in filename order. On an existing project,
run only migrations that have not already been applied, then run the new
`20261122100000_harden_admin_rls_and_grants.sql` migration. Do not re-run data-import
migrations blindly against a production database.

Use only the public anon/publishable key in `PUBLIC_SUPABASE_ANON_KEY`. Never put a
`service_role` or `sb_secret_` key in a `PUBLIC_` variable.

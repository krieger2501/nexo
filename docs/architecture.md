# Architecture

## Overview

Nexo is a monorepo of independent SvelteKit apps that share a single PostgreSQL database and a central auth service. Each app is a self-contained PWA deployable as a home screen icon on iOS.

```
nexo/
├── apps/
│   ├── auth/        → auth.krieger2501.de   — OIDC provider, login UI
│   ├── finance/     → finance.krieger2501.de — Finance PWA
│   ├── landing/     → krieger2501.de         — App directory, not a PWA
│   ├── gym/         → (planned)
│   ├── time/        → (planned)
│   └── pomodoro/    → (planned)
└── packages/
    └── db/          → shared Drizzle schemas + migration runner
```

---

## Authentication flow

All user-facing apps delegate authentication to the central auth server via OAuth 2.0 / OIDC. The auth server is the only service that knows about passwords or OAuth provider credentials.

```
1. User opens finance.krieger2501.de
2. hooks.server.ts checks for a valid Better Auth session cookie
3. No session → redirect to auth.krieger2501.de/login?redirectTo=...
4. User clicks "Sign in with Google" (or GitHub / Discord)
5. Browser goes to provider → provider redirects back to auth server callback
6. Auth server checks auth.allowed_emails table
   - Not found → redirect to /not-authorized
   - Found → create session, set cookie on auth.krieger2501.de domain
7. Auth server redirects back to the original app URL
8. App's hooks.server.ts now sees a valid session via the auth server API
9. User is in
```

The session cookie is set on the **auth domain**, not the app domain. Each app validates the session by calling the auth server on every request — there is no JWT passed between apps.

---

## Database layout

One PostgreSQL instance, one database (`nexo`), namespaced by Postgres schema:

```
nexo (database)
├── auth (schema)
│   ├── users              — one row per user (Better Auth managed)
│   ├── sessions           — active sessions (Better Auth managed)
│   ├── accounts           — OAuth provider links (Better Auth managed)
│   ├── allowed_emails     — email whitelist; controls who can sign in
│   └── user_app_access    — per-user, per-app access control
├── finance (schema)
│   ├── accounts           — bank/cash accounts
│   ├── expenses           — recurring and one-off expenses
│   ├── income             — recurring and one-off income
│   ├── debts              — money owed to/from others
│   └── user_settings      — per-user preferences (currency, display name)
├── gym (schema)           — planned
├── time (schema)          — planned
└── pomodoro (schema)      — planned
```

Every app-schema table has a `user_id UUID` foreign key referencing `auth.users.id`. This means every query is automatically scoped to the authenticated user.

**All schemas are defined in `packages/db/schema/`** and consumed by every app as a workspace dependency (`@nexo/db`).

---

## Monorepo structure

```
nexo/
├── .env                        ← secrets (gitignored)
├── .env.local                  ← local overrides, e.g. localhost DATABASE_URL (gitignored)
├── .env.example                ← template, committed
├── docker-compose.yml          ← production-ready service definitions
├── docker-compose.override.yml ← local dev overrides (auto-loaded by Docker Compose)
├── Caddyfile                   ← reverse proxy + TLS config
├── turbo.json                  ← task pipeline (build order, caching)
├── pnpm-workspace.yaml         ← workspace package globs
├── package.json                ← root scripts, shared dev deps
├── tsconfig.json               ← base TS config (extended by all packages)
├── apps/
│   └── <app>/
│       ├── src/
│       │   ├── app.html
│       │   ├── app.css
│       │   ├── app.d.ts        ← App.Locals, App.PageData types
│       │   ├── hooks.server.ts ← auth guard on every request
│       │   ├── lib/
│       │   │   ├── server/     ← server-only code (never imported by .svelte files)
│       │   │   └── components/
│       │   └── routes/
│       │       ├── +layout.server.ts  ← session + shared data load
│       │       ├── +layout.svelte
│       │       ├── auth/callback/+server.ts  ← OIDC callback handler
│       │       └── [feature]/
│       │           ├── +page.server.ts
│       │           └── +page.svelte
│       ├── svelte.config.js    ← adapter-node, Svelte compiler options
│       ├── vite.config.ts      ← Vite + PWA plugin config
│       ├── Dockerfile
│       └── package.json
└── packages/
    └── db/
        ├── schema/
        │   ├── auth.ts
        │   └── finance.ts
        ├── src/
        │   ├── index.ts        ← Drizzle client + all schema exports
        │   └── migrate.ts      ← migration runner (used by Docker)
        ├── drizzle.config.ts
        └── package.json
```

---

## Request lifecycle (finance app example)

```
Browser → Caddy (TLS termination)
       → finance:3000 (SvelteKit Node server)
          → hooks.server.ts
             → authClient.getSession() → HTTP call to auth:3000
             → session valid: attach user to event.locals, continue
             → session missing: redirect to auth:3000/login
          → +layout.server.ts
             → db query: user_settings for locals.user.id
          → +page.server.ts
             → db queries: expenses, income, etc. scoped to user_id
          → +page.svelte renders
```

---

## Tech decisions

**Why one monorepo instead of separate repos?**
Shared Drizzle schema is the killer reason. When you rename a column in `finance.ts`, the TypeScript error shows up immediately in the app. With separate repos you'd need to publish an npm package, bump a version, and update a dependency — for a personal project that's pure friction.

**Why not one big SvelteKit app?**
Each PWA needs its own `manifest.json` with its own name, icon, and theme color so iOS treats them as distinct home screen apps. A single app at one domain can only have one manifest.

**Why Better Auth as an OIDC provider instead of Authentik/Keycloak?**
Authentik and Keycloak are enterprise SSO servers that run as separate heavyweight services. Better Auth runs inside your existing SvelteKit app, uses your existing database, and is configured in TypeScript. For 10 users it's the right level of complexity.

**Why Caddy instead of Nginx?**
Caddy provisions and renews Let's Encrypt certificates automatically. With Nginx you'd also need Certbot and cron jobs. The Caddyfile for this project is 10 lines.

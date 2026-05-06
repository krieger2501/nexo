# Buffer

> Plan your money before it moves.

Buffer is a mobile-first personal finance PWA. Track accounts, recurring expenses and income, debts, and get a rolling 90-day cashflow forecast — all backed by a private Supabase database and deployed to Cloudflare Pages.

---

## Features

- **Dashboard** — liquid-asset summary, account balances, upcoming cashflow events
- **Accounts** — checking, savings, crypto, investment, cash with per-account currency
- **Expenses** — recurring bills and subscriptions with category and due-date tracking
- **Income** — recurring income with expected-date and received-flag tracking
- **Debt** — owe / owed-to-me tracker with settlement status
- **Forecast** — 90-day forward cashflow projection with balance-dip alerts
- **PWA** — installable, offline-capable, Workbox service worker with `NetworkOnly` for all data routes

## Tech stack

| Concern    | Tool                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| Framework  | [SvelteKit 2](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev) (runes mode) |
| Styling    | [Tailwind CSS v4](https://tailwindcss.com) with `@theme` design tokens                   |
| Components | [shadcn-svelte](https://www.shadcn-svelte.com)                                           |
| Database   | [Supabase](https://supabase.com) (Postgres)                                              |
| Migrations | [Drizzle ORM](https://orm.drizzle.team) + `drizzle-kit`                                  |
| Hosting    | [Cloudflare Pages](https://pages.cloudflare.com)                                         |
| PWA        | [@vite-pwa/sveltekit](https://vite-pwa-org.netlify.app/frameworks/sveltekit)             |

---

## Prerequisites

| Tool    | Version | Notes                                                                                     |
| ------- | ------- | ----------------------------------------------------------------------------------------- |
| Node.js | `>=24`  | Use the version pinned in `.node-version`                                                 |
| pnpm    | `>=10`  | Enabled via [Corepack](https://nodejs.org/api/corepack.html) — no separate install needed |

Enable Corepack once (ships with Node ≥ 16.9):

```sh
corepack enable
```

---

## Setup

### 1. Clone and install

```sh
git clone https://github.com/krieger2501/buffer.git
cd buffer
pnpm install
```

### 2. Configure environment variables

Copy the example file and fill in your Supabase credentials:

```sh
cp .env.example .env.local
```

| Variable                          | Where to find it                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API → Project URL                                          |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → Project API keys → `publishable`                     |
| `DATABASE_URL`                    | Supabase → Project Settings → Database → Connection string (Transaction mode, port 6543) |

### 3. Create the database schema

Generate and apply the initial migration:

```sh
pnpm db:generate   # creates SQL files in ./drizzle
pnpm db:migrate    # applies them to your Supabase project
```

> You can inspect the live database at any time with `pnpm db:studio`.

### 4. Start the dev server

```sh
pnpm dev
```

App is available at `http://localhost:5173`.

---

## Scripts

| Script                 | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `pnpm dev`             | Start development server with HMR                    |
| `pnpm build`           | Production build (Cloudflare Pages output)           |
| `pnpm preview`         | Preview the production build locally                 |
| `pnpm type:check`      | Svelte + TypeScript type-check via `svelte-check`    |
| `pnpm code:lint`       | ESLint check                                         |
| `pnpm code:lint:fix`   | Auto-fix ESLint issues                               |
| `pnpm format`          | Reformat all files with Prettier                     |
| `pnpm format:check`    | Check formatting without writing                     |
| `pnpm package:check`   | Verify `package.json` key order                      |
| `pnpm package:format`  | Sort `package.json` keys                             |
| `pnpm commit:lint`     | Lint commits since the last version tag              |
| `pnpm knip`            | Dead code and unlisted dependency detection          |
| `pnpm test:unit`       | Run unit and integration tests (Vitest)              |
| `pnpm test:unit:watch` | Run Vitest in watch mode                             |
| `pnpm test:e2e`        | Run end-to-end tests (Playwright, headless Chromium) |
| `pnpm test:e2e:ui`     | Open Playwright UI mode                              |
| `pnpm qc`              | Full quality gate — mirrors CI exactly (see below)   |
| `pnpm db:generate`     | Generate Drizzle migration SQL from schema changes   |
| `pnpm db:migrate`      | Apply pending migrations to the database             |
| `pnpm db:studio`       | Open Drizzle Studio (visual database browser)        |

### Quality gate

`pnpm qc` runs every check in the same order as CI:

```text
package:check → format:check → commit:lint → code:lint → knip → type:check → build → test:unit → test:e2e → clean-tree check
```

If it passes locally it will pass in CI.

---

## Deployment

The app deploys automatically to **Cloudflare Pages** when a version tag is pushed (triggered by merging a Release Please PR).

For the first deployment, connect the GitHub repository in the Cloudflare Pages dashboard and set the following environment variables:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`DATABASE_URL` is only needed locally for running migrations — it is never used at runtime.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT

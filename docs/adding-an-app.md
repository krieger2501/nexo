# Adding a New App

This guide walks through adding a new PWA to the suite — for example, `gym`. Repeat for `time`, `pomodoro`, or anything else.

---

## 1. Create the app directory

```bash
cd apps
mkdir -p gym/src/routes/auth/callback
mkdir -p gym/src/lib/server
mkdir -p gym/src/lib/components
mkdir -p gym/static
```

Or copy the auth app as a starting point and gut the routes:

```bash
cp -r apps/auth apps/gym
```

---

## 2. Add the DB schema

Create `packages/db/schema/gym.ts`:

```typescript
import { pgSchema, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const gymSchema = pgSchema('gym');

export const workouts = gymSchema.table('workouts', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// add more tables as needed
```

Export it from `packages/db/src/index.ts`:

```typescript
import * as gymSchema from './schema/gym'; // add this line
export * from './schema/gym'; // add this line

export const db = drizzle(sql, {
	schema: { ...authSchema, ...financeSchema, ...gymSchema } // add gymSchema
});
```

Generate and apply the migration:

```bash
pnpm db:generate
pnpm db:migrate
```

---

## 3. Create package.json

`apps/gym/package.json`:

```json
{
	"name": "@nexo/gym",
	"version": "0.1.0",
	"private": true,
	"type": "module",
	"scripts": {
		"build": "vite build",
		"dev": "vite dev --port 3003",
		"preview": "vite preview",
		"type:check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"lint": "eslint ."
	},
	"dependencies": {
		"@nexo/db": "workspace:*",
		"better-auth": "^1.6.9"
	},
	"devDependencies": {
		"@sveltejs/adapter-node": "^5.5.4",
		"@sveltejs/kit": "^2.59.1",
		"@sveltejs/vite-plugin-svelte": "^7.1.0",
		"@tailwindcss/vite": "^4.2.4",
		"@vite-pwa/sveltekit": "^1.1.0",
		"svelte": "^5.55.5",
		"svelte-check": "^4.4.8",
		"tailwindcss": "^4.2.4",
		"typescript": "^6.0.3",
		"vite": "^8.0.10"
	}
}
```

Pick the next available port (finance is 3002, so gym gets 3003, time gets 3004, etc.).

---

## 4. Standard config files

These are identical across all apps — copy from `apps/finance` and adjust the app name:

**`svelte.config.js`** — change nothing, it's the same for all apps.

**`tsconfig.json`** — same as auth/finance.

**`vite.config.ts`** — update the PWA manifest name, `short_name`, `theme_color`, and `background_color`:

```typescript
manifest: {
  name: 'Gym Tracker — Nexo',
  short_name: 'Gym',
  theme_color: '#dc2626',       // pick a color distinct from other apps
  background_color: '#0a0a0a',
  // ... rest is identical
}
```

---

## 5. Create the auth guard (hooks.server.ts)

`apps/gym/src/hooks.server.ts` — identical to every other app:

```typescript
import { redirect, type Handle } from '@sveltejs/kit';
import { PUBLIC_AUTH_URL } from '$env/static/public';
import { createAuthClient } from 'better-auth/client';

const authClient = createAuthClient({ baseURL: PUBLIC_AUTH_URL });

export const handle: Handle = async ({ event, resolve }) => {
	const session = await authClient.getSession({ fetchOptions: { headers: event.request.headers } });
	event.locals.user = session?.data?.user ?? null;

	if (!event.locals.user && !event.url.pathname.startsWith('/auth')) {
		const redirectTo = encodeURIComponent(event.url.href);
		redirect(303, `${PUBLIC_AUTH_URL}/login?redirectTo=${redirectTo}`);
	}

	return resolve(event);
};
```

**`src/app.d.ts`** — same as finance:

```typescript
import type { User } from 'better-auth';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
		}
		interface PageData {
			user?: User | null;
		}
		interface Platform {}
		interface Error {
			message: string;
		}
	}
}
export {};
```

**`src/routes/auth/callback/+server.ts`** — same as finance:

```typescript
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	redirect(303, url.searchParams.get('next') ?? '/');
};
```

---

## 6. Create the app shell

**`src/app.html`** — standard SvelteKit shell, add the manifest link:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<link rel="manifest" href="/manifest.webmanifest" />
		<meta name="theme-color" content="#dc2626" />
		%sveltekit.head%
	</head>
	<body>
		%sveltekit.body%
	</body>
</html>
```

**`src/app.css`**:

```css
@import 'tailwindcss';
```

---

## 7. Add .env.local for local dev

`apps/gym/.env.local`:

```bash
DATABASE_URL=postgres://nexo:devpassword@localhost:5432/nexo
PUBLIC_AUTH_URL=http://localhost:3001
```

---

## 8. Add to Docker Compose

In `docker-compose.yml`, add two service blocks — production and preview:

```yaml
gym:
  profiles: [production]
  build:
    context: .
    dockerfile: apps/gym/Dockerfile
  restart: unless-stopped
  networks: [production]
  environment:
    DATABASE_URL: ${DATABASE_URL}
    BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
    PUBLIC_AUTH_URL: https://auth.krieger2501.de
    PUBLIC_GYM_URL: https://gym.krieger2501.de
    PROTOCOL_HEADER: x-forwarded-proto
    HOST_HEADER: x-forwarded-host
  depends_on:
    migrate:
      condition: service_completed_successfully

gym_preview:
  profiles: [preview]
  build:
    context: .
    dockerfile: apps/gym/Dockerfile
  restart: unless-stopped
  networks: [preview]
  environment:
    DATABASE_URL: ${DATABASE_URL}
    BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
    PUBLIC_AUTH_URL: https://auth.preview.krieger2501.de
    PUBLIC_GYM_URL: https://gym.preview.krieger2501.de
    PROTOCOL_HEADER: x-forwarded-proto
    HOST_HEADER: x-forwarded-host
  depends_on:
    migrate_preview:
      condition: service_completed_successfully
```

Add to the Caddyfile:

```
gym.krieger2501.de {
  reverse_proxy gym:3000
}

gym.preview.krieger2501.de {
  reverse_proxy gym_preview:3000
}
```

---

## 9. Add root scripts

In root `package.json`, add:

```json
"dev:gym":   "turbo dev --filter=@nexo/gym",
"build:gym": "turbo build --filter=@nexo/gym",
```

---

## 10. Add to knip.config.ts

In the root `knip.config.ts`, add a workspace entry:

```typescript
'apps/gym': {
  entry: ['src/routes/**/+*.{ts,js,svelte}'],
  project: ['src/**/*.{ts,js,svelte}'],
  ignoreDependencies: ['tailwindcss']
},
```

---

## 11. Update the landing page

In `apps/landing/src/routes/+page.svelte`, add the new app to the `apps` array:

```typescript
{
  name: 'Gym Tracker',
  description: 'Log workouts, track progress, build habits',
  url: 'https://gym.krieger2501.de',
  color: 'text-red-400',
  border: 'border-red-900',
  icon: '🏋️'
}
```

---

## 12. Add DNS

In your IONOS domain control panel, add A records for both production and preview:

```
gym.krieger2501.de          A  <VPS IP>
gym.preview.krieger2501.de  A  <VPS IP>
```

---

## Checklist

- [ ] `packages/db/schema/gym.ts` created
- [ ] `packages/db/src/index.ts` updated (import + export + drizzle schema)
- [ ] Migration generated and applied
- [ ] `apps/gym/package.json` with correct port
- [ ] `svelte.config.js`, `tsconfig.json`, `vite.config.ts` (with PWA manifest)
- [ ] `hooks.server.ts`, `app.d.ts`, `app.html`, `app.css`
- [ ] `routes/auth/callback/+server.ts`
- [ ] `apps/gym/.env.local`
- [ ] `apps/gym/Dockerfile`
- [ ] `docker-compose.yml` production + preview service blocks added
- [ ] `Caddyfile` production + preview entries added
- [ ] `knip.config.ts` workspace entry added
- [ ] Root `package.json` `dev:gym` / `build:gym` scripts added
- [ ] Landing page updated
- [ ] DNS A records added (production + preview)

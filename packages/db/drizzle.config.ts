import { defineConfig } from 'drizzle-kit';

// Load DATABASE_URL from the nearest .env file when running drizzle-kit directly.
// In Docker the variable is injected by Compose; locally it comes from .env at the repo root.
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');

export default defineConfig({
	dialect: 'postgresql',
	schema: './schema/**/*.ts',
	out: './migrations',
	dbCredentials: { url },
	verbose: true,
	strict: true
});

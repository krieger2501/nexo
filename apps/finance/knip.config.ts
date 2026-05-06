import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	$schema: 'https://unpkg.com/knip@latest/schema.json',
	entry: ['src/routes/**/+*.{ts,js,svelte}'],
	project: ['src/**/*.{ts,js,svelte}'],
	ignore: [
		// shadcn-svelte generated components — maintained by the CLI, not us
		'src/lib/components/ui/**',
		// empty SvelteKit placeholder
		'src/lib/index.ts',
		// cn() helper used exclusively by shadcn components (above ignored path)
		'src/lib/utils.ts'
	],
	ignoreDependencies: [
		// Used by Tailwind v4 via CSS @import, not explicit JS imports
		'@fontsource-variable/inter',
		// pnpm hoisting helpers
		'@internationalized/date',
		// Used by shadcn-svelte components (in ignored src/lib/components/ui/**)
		'bits-ui',
		'tailwind-variants',
		// Consumed by @tailwindcss/vite at build time, not imported in JS
		'tailwindcss',
		// Used in test files via @testing-library/svelte (peer of vitest)
		'@testing-library/svelte'
	]
};

export default config;

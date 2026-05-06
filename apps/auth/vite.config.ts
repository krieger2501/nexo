import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, mergeConfig } from 'vite';
import { sharedConfig } from '../../vite.shared';

export default mergeConfig(
	sharedConfig,
	defineConfig({
		plugins: [tailwindcss(), sveltekit()]
	})
);

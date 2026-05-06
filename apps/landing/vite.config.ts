import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, mergeConfig, type PluginOption } from 'vite';
import { sharedConfig } from '../../vite.shared';

export default mergeConfig(
	sharedConfig,
	defineConfig({
		plugins: [tailwindcss() as PluginOption, sveltekit() as PluginOption]
	})
);

import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/worker/index.ts',
	outDir: 'build/worker',
	platform: 'node',
	format: 'esm',
	target: 'node24',
	dts: false,
	clean: false,
	sourcemap: true,
	outExtensions: () => ({ js: '.js' })
});

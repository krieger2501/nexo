import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/index.ts',
	platform: 'node',
	format: 'esm',
	target: 'es2024',
	dts: true,
	clean: true,
	sourcemap: true,
	outExtensions: () => ({ js: '.js', dts: '.d.ts' })
});

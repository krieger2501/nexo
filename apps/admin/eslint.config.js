import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '../../.gitignore');

export default defineConfig(includeIgnoreFile(gitignorePath), svelte.configs.recommended, {
	files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
	languageOptions: {
		parserOptions: {
			extraFileExtensions: ['.svelte'],
			parser: ts.parser,
			svelteConfig
		}
	},
	rules: {
		'svelte/button-has-type': 'error',
		'svelte/no-unused-svelte-ignore': 'error',
		'svelte/prefer-destructured-store-props': 'warn',
		'svelte/no-navigation-without-resolve': 'off'
	}
});

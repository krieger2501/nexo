import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '../../.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node, ...globals.serviceworker },
			parserOptions: { tsconfigRootDir: import.meta.dirname }
		},
		rules: {
			'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
			eqeqeq: ['error', 'always', { null: 'ignore' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			],
			'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }]
		}
	}
);

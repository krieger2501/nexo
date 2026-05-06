import type { UserConfig } from 'vite';

// Vite 8 uses rolldown which requires explicit .js → .ts extension aliasing
// when consuming workspace packages as raw TypeScript source.
export const sharedConfig: UserConfig = {
	resolve: {
		extensionAlias: {
			'.js': ['.ts', '.js']
		}
	}
};

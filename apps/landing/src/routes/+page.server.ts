import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { PageServerLoad } from './$types';

function readVersion(appPath: string): string {
	try {
		const pkg = JSON.parse(readFileSync(resolve(appPath, 'package.json'), 'utf-8'));
		return pkg.version ?? '0.0.0';
	} catch {
		return '0.0.0';
	}
}

export const load: PageServerLoad = () => {
	return {
		versions: {
			finance: readVersion('apps/finance')
		}
	};
};

import { runAsync } from './proc.ts';

// `pnpm --filter <pkg> --prod deploy <out>` produces a self-contained directory
// (package.json, node_modules, build outputs, plus a dedicated lockfile and
// workspace marker) that can be docker-build'd standalone.
//
// `--config.inject-workspace-packages=true` is the v10+ replacement for the
// deprecated `--legacy` flag: it copies workspace `@nexo/*` packages into
// node_modules instead of symlinking them. Set per-invocation so dev-time
// installs keep their symlinks.
//
// `--config.confirmModulesPurge=false` because pnpm's pre-deploy
// `runDepsStatusCheck` invokes `pnpm install --production` which prompts on
// modules-dir purge unless we silence it (we also set CI=true for safety).
//
// Returns a Promise so callers can run several deploys concurrently. pnpm's
// content-addressed store is concurrency-safe; each deploy only writes to its
// own `out` directory.
export function pnpmDeployAsync(opts: { pkg: string; out: string; cwd?: string }): Promise<void> {
	return runAsync(
		'pnpm',
		[
			'--filter',
			opts.pkg,
			'--prod',
			'--config.inject-workspace-packages=true',
			'--config.confirmModulesPurge=false',
			'deploy',
			opts.out
		],
		{
			cwd: opts.cwd,
			env: { ...process.env, CI: 'true' }
		}
	).then(() => undefined);
}

// Shared helpers for VPS deploy scripts (deploy.mjs, unstable.mjs).
// All compose calls assume the cwd is the repo root on the VPS
// (typically /home/deploy/nexo) where docker-compose.yml lives.

import { spawnSync } from 'node:child_process';

const HEALTH_POLL_INTERVAL_MS = 2000;

export function run(cmd, args, opts = {}) {
	const result = spawnSync(cmd, args, {
		stdio: opts.silent ? 'pipe' : 'inherit',
		env: opts.env ?? process.env,
		encoding: 'utf8'
	});
	if (opts.throwOnError && result.status !== 0) {
		throw new Error(`${cmd} ${args.join(' ')} exited with status ${result.status}`);
	}
	return result;
}

export function compose(args, env) {
	run('docker', ['compose', '-f', 'docker-compose.yml', ...args], { env, throwOnError: true });
}

export function composeBest(args, env) {
	run('docker', ['compose', '-f', 'docker-compose.yml', ...args], { env, throwOnError: false });
}

/**
 * Returns one record per compose service: { Service, State, Health, ExitCode }.
 * `docker compose ps --format json` emits NDJSON in v2; we tolerate either
 * shape (NDJSON or a JSON array) for forward/backward compatibility.
 */
function readComposeStates(profileFlags = []) {
	const r = run(
		'docker',
		['compose', '-f', 'docker-compose.yml', ...profileFlags, 'ps', '-a', '--format', 'json'],
		{ silent: true }
	);
	if (r.status !== 0 || !r.stdout) return [];
	const text = r.stdout.trim();
	if (!text) return [];
	try {
		if (text.startsWith('{')) {
			return text
				.split('\n')
				.filter(Boolean)
				.map((line) => JSON.parse(line));
		}
		return JSON.parse(text);
	} catch (e) {
		console.warn(`⚠️  failed to parse compose ps output: ${String(e)}`);
		return [];
	}
}

/**
 * Evaluate a single service spec against its compose ps state.
 * spec = { service, kind: 'oneshot' | 'longrun', critical }
 *   - 'oneshot' succeeds on exit 0
 *   - 'longrun' succeeds when running and either healthy (if a healthcheck
 *     is defined) or simply running (if not)
 */
function readinessOf(spec, state) {
	if (!state) return { ready: false, reason: 'missing' };
	const { State, Health, ExitCode } = state;
	if (spec.kind === 'oneshot') {
		if (State === 'exited' && Number(ExitCode) === 0) return { ready: true };
		if (State === 'exited' && Number(ExitCode) !== 0) {
			return { ready: false, reason: `exited(${ExitCode})`, fatal: true };
		}
		return { ready: false, reason: State || 'pending' };
	}
	// longrun
	if (State !== 'running') return { ready: false, reason: State || 'pending' };
	if (!Health) return { ready: true };
	if (Health === 'healthy') return { ready: true };
	if (Health === 'unhealthy') return { ready: false, reason: 'unhealthy', fatal: true };
	return { ready: false, reason: Health };
}

/**
 * Poll compose ps until every spec reaches its terminal/healthy state, or
 * the budget elapses. Emits a single-line `[Xs] N/M ready — waiting: …`
 * status that updates only when something actually changes.
 *
 * Returns { ok: true } on success, or
 *         { ok: false, reason, failed: spec[] } on timeout / fatal state.
 */
export async function waitForServices(specs, profileFlags, budgetSeconds) {
	const deadline = Date.now() + budgetSeconds * 1000;
	const startTime = Date.now();
	let lastLine = '';

	while (Date.now() < deadline) {
		const states = readComposeStates(profileFlags);
		const byService = new Map(states.map((s) => [s.Service, s]));
		const evals = specs.map((spec) => {
			const r = readinessOf(spec, byService.get(spec.service));
			return { ...spec, state: byService.get(spec.service) ?? null, ...r };
		});

		const fatal = evals.find((e) => e.critical && e.fatal);
		if (fatal) {
			return {
				ok: false,
				reason: `${fatal.service} fatal: ${fatal.reason}`,
				failed: evals.filter((e) => !e.ready)
			};
		}

		const allReady = evals.every((e) => e.ready || !e.critical);
		if (allReady) return { ok: true };

		const elapsed = Math.round((Date.now() - startTime) / 1000);
		const pending = evals.filter((e) => !e.ready && e.critical);
		const readyCount = evals.filter((e) => e.ready).length;
		const waitList = pending.map((e) => `${e.service}(${e.reason ?? '?'})`).join(' ');
		const line = `  [${elapsed}s] ${readyCount}/${evals.length} ready — waiting: ${waitList}`;
		if (line !== lastLine) {
			console.log(line);
			lastLine = line;
		}

		await sleep(HEALTH_POLL_INTERVAL_MS);
	}

	const states = readComposeStates(profileFlags);
	const byService = new Map(states.map((s) => [s.Service, s]));
	const evals = specs.map((spec) => {
		const r = readinessOf(spec, byService.get(spec.service));
		return { ...spec, state: byService.get(spec.service) ?? null, ...r };
	});
	const failed = evals.filter((e) => e.critical && !e.ready);
	if (failed.length === 0) return { ok: true };
	return {
		ok: false,
		reason: `health budget (${budgetSeconds}s) exceeded`,
		failed
	};
}

export function logSection(title) {
	const bar = '─'.repeat(60);
	console.log(`\n${bar}`);
	console.log(`  ${title}`);
	console.log(bar);
}

export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

#!/usr/bin/env node
//
// Unstable instance orchestrator. Invoked over SSH on the VPS by the
// unstable.yml workflow (or directly by deploy.mjs for the post-release
// `down-all` sweep). Manages the `_unstable` peer services and the
// VPS-local `.env.unstable` file that pins each service to a `:pr-<n>`
// image tag.
//
// Actions:
//   up <service> <pr>          — pull + start <service>_unstable on :pr-<n>
//   down <service> <pr>        — stop + remove <service>_unstable
//   down-all-for-pr <pr>       — same as `down` for every service currently
//                                pinned to :pr-<n>
//   down-all                   — stop every _unstable container, truncate
//                                .env.unstable. Called after a successful
//                                production release deploy.
//
// `.env.unstable` lives at /home/deploy/nexo/.env.unstable (gitignored,
// bot-managed). One line per pinned service:
//   FINANCE_UNSTABLE_TAG=pr-123
//   AUTH_UNSTABLE_TAG=pr-127

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { compose, composeBest, logSection, waitForServices } from './lib/compose.mjs';

const ENV_FILE = '.env.unstable';
const PROFILE_FLAGS = ['--profile', 'unstable'];
const ENV_FILE_ARGS = ['--env-file', '.env', '--env-file', ENV_FILE];
const HEALTH_BUDGET_SECONDS = 60;

const UNSTABLE_APPS = new Set(['auth', 'admin', 'finance', 'flaschen', 'calorie', 'landing']);

// Always-three-positional-args invocation shape: action, service, pr.
// Variants that don't need a field (down-all-for-pr ignores service; down-all
// ignores both) just receive empty strings — the per-action branch validates
// only what it needs. This keeps the YAML caller a one-liner with no `case`.
const [, , action = '', service = '', pr = ''] = process.argv;

main().catch((err) => {
	console.error(`\n✗ ${err.message ?? err}`);
	process.exit(1);
});

async function main() {
	ensureEnvFile();

	switch (action) {
		case 'up': {
			assertService(service);
			assertPr(pr);
			await up(service, pr);
			break;
		}
		case 'down': {
			assertService(service);
			// pr is informational here (kept for symmetry / logging); we don't
			// gate on it because a "down" from any source should remove the
			// container regardless of which PR last brought it up.
			down(service, pr);
			break;
		}
		case 'down-all-for-pr': {
			assertPr(pr);
			downAllForPr(pr);
			break;
		}
		case 'down-all': {
			downAll();
			break;
		}
		default:
			throw new Error(`unknown action: ${action || '(none)'}`);
	}
}

async function up(service, pr) {
	const tag = `pr-${pr}`;
	const composeService = `${service}_unstable`;
	const previous = readEnv()[envKey(service)] ?? null;

	logSection(`1/3  Pin ${composeService} → ${tag}`);
	writeEnv({ ...readEnv(), [envKey(service)]: tag });
	console.log(`  ${envKey(service)}=${tag}`);

	logSection(`2/3  Pull + start ${composeService}`);
	compose([...PROFILE_FLAGS, ...ENV_FILE_ARGS, 'pull', '--quiet', composeService]);
	compose([...PROFILE_FLAGS, ...ENV_FILE_ARGS, 'up', '-d', composeService]);

	logSection(`3/3  Service health  (budget: ${HEALTH_BUDGET_SECONDS}s)`);
	const specs = [{ service: composeService, kind: 'longrun', critical: true }];
	const result = await waitForServices(specs, PROFILE_FLAGS, HEALTH_BUDGET_SECONDS);
	if (!result.ok) {
		console.error(`\n✗ ${composeService}: ${result.reason}`);
		composeBest([
			...PROFILE_FLAGS,
			...ENV_FILE_ARGS,
			'logs',
			'--tail',
			'30',
			'--no-color',
			composeService
		]);
		composeBest([...PROFILE_FLAGS, ...ENV_FILE_ARGS, 'rm', '-sf', composeService]);
		const env = readEnv();
		if (previous === null) delete env[envKey(service)];
		else env[envKey(service)] = previous;
		writeEnv(env);
		throw new Error(`${composeService} failed healthcheck`);
	}

	logSection(`✅ ${composeService} up on ${tag}`);
}

function down(service, pr) {
	const composeService = `${service}_unstable`;
	logSection(`Stopping ${composeService}${pr ? ` (was pinned to pr-${pr})` : ''}`);
	composeBest([...PROFILE_FLAGS, ...ENV_FILE_ARGS, 'rm', '-sf', composeService]);
	const env = readEnv();
	if (envKey(service) in env) {
		delete env[envKey(service)];
		writeEnv(env);
	}
	console.log(`  ✅ ${composeService} down`);
}

function downAllForPr(pr) {
	const tag = `pr-${pr}`;
	const env = readEnv();
	const services = [];
	for (const [key, value] of Object.entries(env)) {
		if (value !== tag) continue;
		const service = serviceFromKey(key);
		if (service) services.push(service);
	}
	if (!services.length) {
		console.log(`(no unstable containers pinned to ${tag})`);
		return;
	}
	logSection(`Tearing down ${services.length} container(s) pinned to ${tag}`);
	console.log(`  ${services.join(', ')}`);
	for (const service of services) down(service, pr);
}

function downAll() {
	logSection('Stopping every _unstable container');
	composeBest([...PROFILE_FLAGS, ...ENV_FILE_ARGS, 'down', '--remove-orphans']);
	writeFileSync(ENV_FILE, '');
	console.log('  ✅ All unstable instances cleared');
}

// ── env-file helpers ───────────────────────────────────────────────────────

function ensureEnvFile() {
	if (!existsSync(ENV_FILE)) writeFileSync(ENV_FILE, '');
}

function readEnv() {
	const text = readFileSync(ENV_FILE, 'utf8');
	const out = {};
	for (const line of text.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
	}
	return out;
}

function writeEnv(env) {
	const lines = Object.entries(env)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([k, v]) => `${k}=${v}`);
	writeFileSync(ENV_FILE, lines.length ? lines.join('\n') + '\n' : '');
}

function envKey(service) {
	return `${service.toUpperCase()}_UNSTABLE_TAG`;
}

function serviceFromKey(key) {
	const match = /^([A-Z]+)_UNSTABLE_TAG$/.exec(key);
	if (!match) return null;
	const service = match[1].toLowerCase();
	return UNSTABLE_APPS.has(service) ? service : null;
}

// ── validation ─────────────────────────────────────────────────────────────

function assertService(service) {
	if (!UNSTABLE_APPS.has(service)) {
		throw new Error(
			`unknown service "${service}"; expected one of: ${[...UNSTABLE_APPS].join(', ')}`
		);
	}
}

function assertPr(pr) {
	if (!/^\d+$/.test(pr)) throw new Error(`invalid pr number "${pr}"`);
}

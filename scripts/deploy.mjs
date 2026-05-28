#!/usr/bin/env node
//
// Production deploy orchestrator. Invoked over SSH on the VPS by the
// CI workflow's deploy-production job. Runs in the deploy directory
// (/home/deploy/nexo) which has already been git-reset to origin/main
// before this script starts.
//
// Steps:
//   1. Persist incoming APP_VERSION_* to .env.versions (version pinning)
//   2. Snapshot current :latest images as :previous (rollback safety net)
//   3. docker compose pull --quiet + up -d for production + server profiles
//   4. Reload Caddy
//   5. Poll Docker per-service health within a 60s budget. Fast-fail if
//      migrate exits non-zero. Roll back if any tracked service hasn't
//      reached its terminal/healthy state by the deadline.
//   6. Final external curl probe against public hostnames (Caddy/TLS sanity)
//   7. Tear down all unstable instances; bot resets sticky comments
//
// Reads from environment (set via appleboy/ssh-action `envs:`):
//   APP_VERSION_AUTH, APP_VERSION_ADMIN, APP_VERSION_FINANCE,
//   APP_VERSION_FLASCHEN, APP_VERSION_CALORIE, APP_VERSION_LANDING,
//   APP_VERSION_BOT, APP_VERSION_DB, APP_COMMIT, APP_BUILD_TIME

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { compose, composeBest, logSection, run, sleep, waitForServices } from './lib/compose.mjs';

const REGISTRY = 'ghcr.io/nexo-suite';
const PROD_SERVICES = [
	'nexo-auth',
	'nexo-admin',
	'nexo-finance',
	'nexo-flaschen',
	'nexo-calorie',
	'nexo-landing',
	'nexo-bot',
	'nexo-db'
];

// APP_VERSION_* keys that are persisted to .env.versions for version-pinned
// compose image tags. Must match the env vars set by the CI deploy job.
const VERSION_KEYS = [
	'APP_VERSION_AUTH',
	'APP_VERSION_ADMIN',
	'APP_VERSION_FINANCE',
	'APP_VERSION_FLASCHEN',
	'APP_VERSION_CALORIE',
	'APP_VERSION_LANDING',
	'APP_VERSION_BOT',
	'APP_VERSION_DB'
];

// Per-service health budget. `kind: 'oneshot'` succeeds on exit 0; `kind:
// 'longrun'` succeeds when running and either healthy (if a healthcheck is
// defined) or simply running (if not). Names match `docker compose` service
// names (not container names — compose adds a -1 suffix in production).
const TRACKED = [
	{ service: 'migrate', kind: 'oneshot', critical: true },
	{ service: 'postgres', kind: 'longrun', critical: true },
	{ service: 'pgbouncer', kind: 'longrun', critical: true },
	{ service: 'auth', kind: 'longrun', critical: true },
	{ service: 'admin', kind: 'longrun', critical: true },
	{ service: 'finance', kind: 'longrun', critical: true },
	{ service: 'flaschen', kind: 'longrun', critical: true },
	{ service: 'calorie', kind: 'longrun', critical: true },
	{ service: 'landing', kind: 'longrun', critical: true },
	{ service: 'flaschen-worker', kind: 'longrun', critical: true },
	{ service: 'bot', kind: 'longrun', critical: false },
	{ service: 'caddy', kind: 'longrun', critical: true }
];

const HEALTH_HOSTS = [
	'auth.krieger2501.de',
	'admin.krieger2501.de',
	'finance.krieger2501.de',
	'flaschen.krieger2501.de',
	'calorie.krieger2501.de',
	'krieger2501.de'
];
const HEALTH_BUDGET_SECONDS = 60;
const ROLLBACK_HEALTH_BUDGET_SECONDS = 45;
const EXTERNAL_TIMEOUT_SECONDS = 10;
const EXTERNAL_RETRIES = 3;
const EXTERNAL_RETRY_DELAY_MS = 5000;

// Compose reads --env-file files in order; later wins.
// .env.versions is written by persistVersions() before each deploy.
// .env.unstable is bot-managed and may be absent on a fresh VPS.
const ENV_FILES = [
	'--env-file',
	'.env',
	'--env-file',
	'.env.versions',
	'--env-file',
	'.env.unstable'
];
const PROFILE_FLAGS = ['--profile', 'production', '--profile', 'server'];

main().catch((err) => {
	console.error(`\n✗ ${err.message ?? err}`);
	process.exit(1);
});

async function main() {
	ensureUnstableEnvFile();
	ensureVersionsEnvFile();

	logSection('1/7  Persist versions + snapshot :previous');
	persistVersions();
	snapshotPreviousImages();

	const versionsJson = buildVersionsJson();
	// Strip APP_VERSION_* from composeEnv so compose reads them exclusively
	// from .env.versions. Without this, process.env empty-string values would
	// override the file and trigger the :-latest fallback for unrelated apps.
	const composeEnv = buildComposeEnv(versionsJson);

	logSection('2/7  Pull images');
	compose([...PROFILE_FLAGS, ...ENV_FILES, 'pull', '--quiet'], composeEnv);

	logSection('3/7  Start production stack');
	compose([...PROFILE_FLAGS, ...ENV_FILES, 'up', '-d'], composeEnv);

	logSection('4/7  Reload Caddy');
	composeBest(['exec', 'caddy', 'caddy', 'reload', '--config', '/etc/caddy/Caddyfile']);

	logSection(`5/7  Service health  (budget: ${HEALTH_BUDGET_SECONDS}s)`);
	const result = await waitForServices(TRACKED, PROFILE_FLAGS, HEALTH_BUDGET_SECONDS);
	if (!result.ok) {
		await performRollback(result.reason, result.failed, composeEnv);
	}
	console.log('  All services healthy');

	logSection('6/7  External probes');
	const externalOk = await runExternalHealthchecks();
	if (!externalOk) {
		await performRollback('External probe failed', [], composeEnv);
	}

	logSection('7/7  Tear down unstable instances');
	const unstable = run('node', ['scripts/unstable.mjs', 'down-all'], { throwOnError: false });
	if (unstable.status !== 0) {
		console.warn('  ⚠  unstable down-all returned non-zero; continuing');
	}

	logSection('Deploy complete ✅');
	console.log(`  Commit: ${process.env.APP_COMMIT ?? 'unknown'}`);
	console.log(`  Built:  ${process.env.APP_BUILD_TIME ?? 'unknown'}`);
}

// ── Version persistence ──────────────────────────────────────────────────────

function persistVersions() {
	const existing = readEnvFile('.env.versions');
	for (const key of VERSION_KEYS) {
		const val = process.env[key];
		if (val) existing[key] = val;
	}
	if (existsSync('.env.versions')) {
		renameSync('.env.versions', '.env.versions.previous');
	}
	writeEnvFile('.env.versions', existing);
	const written = Object.entries(existing)
		.filter(([, v]) => v)
		.map(([k]) => k.replace('APP_VERSION_', '').toLowerCase());
	if (written.length) console.log(`  Pinned: ${written.join(', ')}`);
}

function restoreVersions() {
	if (existsSync('.env.versions.previous')) {
		renameSync('.env.versions.previous', '.env.versions');
		console.log('  Restored .env.versions from .env.versions.previous');
	} else {
		writeFileSync('.env.versions', '');
		console.log('  Cleared .env.versions (no previous backup; will fall back to :latest)');
	}
}

function readEnvFile(path) {
	if (!existsSync(path)) return {};
	const lines = readFileSync(path, 'utf8').split('\n');
	const out = {};
	for (const line of lines) {
		const eq = line.indexOf('=');
		if (eq > 0) out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
	}
	return out;
}

function writeEnvFile(path, obj) {
	const content = Object.entries(obj)
		.map(([k, v]) => `${k}=${v}`)
		.join('\n');
	writeFileSync(path, content + '\n');
}

function buildComposeEnv(versionsJson) {
	const env = { ...process.env, APP_VERSIONS_JSON: versionsJson };
	for (const key of VERSION_KEYS) delete env[key];
	return env;
}

// ── Snapshot / rollback ──────────────────────────────────────────────────────

function ensureUnstableEnvFile() {
	if (!existsSync('.env.unstable')) writeFileSync('.env.unstable', '');
}

function ensureVersionsEnvFile() {
	if (!existsSync('.env.versions')) writeFileSync('.env.versions', '');
}

function snapshotPreviousImages() {
	const snapped = [];
	for (const svc of PROD_SERVICES) {
		const latest = `${REGISTRY}/${svc}:latest`;
		const previous = `${REGISTRY}/${svc}:previous`;
		if (run('docker', ['image', 'inspect', latest], { silent: true }).status === 0) {
			run('docker', ['tag', latest, previous], { silent: true });
			snapped.push(svc.replace('nexo-', ''));
		}
	}
	if (snapped.length) console.log(`  Snapshotted: ${snapped.join(', ')}`);
}

function rollback() {
	for (const svc of PROD_SERVICES) {
		const previous = `${REGISTRY}/${svc}:previous`;
		const latest = `${REGISTRY}/${svc}:latest`;
		if (run('docker', ['image', 'inspect', previous], { silent: true }).status === 0) {
			run('docker', ['tag', previous, latest], { silent: true });
			console.log(`  ↩  ${svc}: :previous → :latest`);
		} else {
			console.warn(`  ⚠  ${svc}: no :previous image — skipped`);
		}
	}
}

async function performRollback(reason, failed, composeEnv) {
	const bar = '═'.repeat(60);
	console.error(`\n${bar}`);
	console.error(`  ROLLBACK: ${reason}`);
	console.error(bar);

	if (failed.length > 0) {
		dumpLogsForFailures(failed);
	}

	restoreVersions();
	rollback();

	console.log('\n  Restarting stack from :previous images');
	compose([...PROFILE_FLAGS, ...ENV_FILES, 'up', '-d'], composeEnv);
	composeBest(['exec', 'caddy', 'caddy', 'reload', '--config', '/etc/caddy/Caddyfile']);

	console.log(`\n  Waiting up to ${ROLLBACK_HEALTH_BUDGET_SECONDS}s for rollback to stabilize`);
	const rbResult = await waitForServices(TRACKED, PROFILE_FLAGS, ROLLBACK_HEALTH_BUDGET_SECONDS);
	if (rbResult.ok) {
		console.log('  ✅ Rollback stack is healthy');
	} else {
		console.error(`  ❌ Rollback health check failed: ${rbResult.reason}`);
	}

	throw new Error('Rollback complete — failing the workflow');
}

function buildVersionsJson() {
	const versions = {
		finance: process.env.APP_VERSION_FINANCE ?? '',
		auth: process.env.APP_VERSION_AUTH ?? '',
		admin: process.env.APP_VERSION_ADMIN ?? '',
		flaschen: process.env.APP_VERSION_FLASCHEN ?? '',
		calorie: process.env.APP_VERSION_CALORIE ?? '',
		landing: process.env.APP_VERSION_LANDING ?? '',
		bot: process.env.APP_VERSION_BOT ?? '',
		db: process.env.APP_VERSION_DB ?? ''
	};
	return JSON.stringify(versions);
}

// ── Health polling ───────────────────────────────────────────────────────────

function dumpLogsForFailures(failed) {
	const names = failed.map((f) => f.service).join(', ');
	console.error(`\n  Failed services: ${names}`);
	const sep = '─'.repeat(60);
	for (const f of failed) {
		console.error(`\n${sep}`);
		console.error(`  ${f.service}: ${f.reason ?? 'not ready'}`);
		console.error(sep);
		composeBest([...PROFILE_FLAGS, ...ENV_FILES, 'logs', '--tail', '20', '--no-color', f.service]);
	}
}

async function runExternalHealthchecks() {
	let allHealthy = true;
	for (const host of HEALTH_HOSTS) {
		let ok = false;
		for (let attempt = 1; attempt <= EXTERNAL_RETRIES; attempt++) {
			const result = run(
				'curl',
				['-fsS', '--max-time', String(EXTERNAL_TIMEOUT_SECONDS), `https://${host}/healthz`],
				{ silent: true }
			);
			if (result.status === 0) {
				ok = true;
				break;
			}
			if (attempt < EXTERNAL_RETRIES) {
				console.log(
					`  ⏳ ${host} probe attempt ${attempt}/${EXTERNAL_RETRIES} failed — retrying in ${EXTERNAL_RETRY_DELAY_MS / 1000}s`
				);
				await sleep(EXTERNAL_RETRY_DELAY_MS);
			}
		}
		if (ok) {
			console.log(`  ✅ ${host} healthy`);
		} else {
			console.log(`  ❌ ${host} healthcheck failed after ${EXTERNAL_RETRIES} attempts`);
			allHealthy = false;
		}
	}
	return allHealthy;
}

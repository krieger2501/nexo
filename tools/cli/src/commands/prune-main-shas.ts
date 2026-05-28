import { APPS } from '../apps.ts';
import { runAsync } from '../lib/proc.ts';
import { fail, section, success } from '../lib/log.ts';
import { appendSummary, summarySection, summaryTable } from '../lib/summary.ts';

export type PruneMainShasOpts = {
	owner?: string;
	keep?: number;
	dryRun?: boolean;
};

type PackageVersion = {
	id: number;
	created_at: string;
	metadata?: { container?: { tags?: string[] } };
};

type AppResult = {
	logLines: string[];
	rows: string[][];
};

const SHA_TAG = /^main-[a-f0-9]+$/;

// Per-commit pushes to main publish a `:main-<sha>` tag. Without bounds,
// storage grows monotonically. Keep the newest N versions whose tags are
// ONLY `:main-<sha>` patterns (preserving anything also tagged :main,
// :latest, or v* — the rolling pointers and released versions); delete the
// rest.
//
// Per-package work is fanned out with Promise.all; deletions within a
// package are also parallel. Logs are buffered per-app and flushed in APPS
// order at the end so the output stays readable.
export async function pruneMainShas(opts: PruneMainShasOpts): Promise<void> {
	const owner = opts.owner ?? process.env.GITHUB_REPOSITORY_OWNER;
	if (!owner) {
		fail('prune-main-shas: --owner <org> required (or set $GITHUB_REPOSITORY_OWNER).');
	}
	const keep = opts.keep ?? 20;
	if (!Number.isInteger(keep) || keep < 0) {
		fail(`prune-main-shas: --keep must be a non-negative integer, got ${keep}`);
	}
	const dryRun = opts.dryRun ?? false;

	section(`Prune :main-<sha> tags in ${owner}/* (keep ${keep} newest per package)`);

	const results = await Promise.all(APPS.map((app) => processApp(owner, app.image, keep, dryRun)));

	// Flush per-app logs in canonical APPS order.
	for (let i = 0; i < APPS.length; i++) {
		const r = results[i];
		console.log(`\n› ${APPS[i].image}`);
		for (const line of r.logLines) console.log(`  ${line}`);
	}

	const rows = results.flatMap((r) => r.rows);
	appendSummary(
		summarySection(
			`🧹 :main-<sha> prune (keep ${keep})`,
			rows.length === 0
				? 'Nothing to prune.'
				: summaryTable(['Package', 'Version', 'Created', 'Action'], rows)
		)
	);

	const verb = dryRun ? 'would delete' : 'deleted';
	console.log('');
	success(`${verb} ${rows.length} version(s)`);
}

async function processApp(
	owner: string,
	image: string,
	keep: number,
	dryRun: boolean
): Promise<AppResult> {
	const logLines: string[] = [];
	const rows: string[][] = [];

	const versions = await listVersions(owner, image);
	const shaOnly = versions.filter((v) => {
		const tags = v.metadata?.container?.tags ?? [];
		return tags.length > 0 && tags.every((t) => SHA_TAG.test(t));
	});
	if (shaOnly.length <= keep) {
		logLines.push(`${shaOnly.length} :main-<sha> version(s); nothing to prune`);
		return { logLines, rows };
	}

	// Newest first; drop the first `keep`, delete the rest.
	shaOnly.sort((a, b) => b.created_at.localeCompare(a.created_at));
	const toDelete = shaOnly.slice(keep);

	await Promise.all(
		toDelete.map(async (v) => {
			if (dryRun) {
				logLines.push(`would delete version ${v.id} (${v.created_at})`);
				rows.push([`\`${image}\``, String(v.id), v.created_at, 'would delete']);
				return;
			}
			await deleteVersion(owner, image, v.id);
			logLines.push(`deleted version ${v.id} (${v.created_at})`);
			rows.push([`\`${image}\``, String(v.id), v.created_at, 'deleted']);
		})
	);

	return { logLines, rows };
}

async function listVersions(owner: string, image: string): Promise<PackageVersion[]> {
	const { stdout } = await runAsync(
		'gh',
		['api', '--paginate', `/orgs/${owner}/packages/container/${image}/versions?per_page=100`],
		{ capture: true, quiet: true }
	);
	if (!stdout.trim()) return [];
	return JSON.parse(stdout) as PackageVersion[];
}

async function deleteVersion(owner: string, image: string, versionId: number): Promise<void> {
	await runAsync(
		'gh',
		[
			'api',
			'--method',
			'DELETE',
			`/orgs/${owner}/packages/container/${image}/versions/${versionId}`
		],
		{ quiet: true }
	);
}

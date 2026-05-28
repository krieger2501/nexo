import { APPS } from '../apps.ts';
import { runAsync } from '../lib/proc.ts';
import { fail, info, section, success } from '../lib/log.ts';
import { appendSummary, summarySection, summaryTable } from '../lib/summary.ts';

export type PrunePrImagesOpts = {
	repo?: string;
	pr: number;
	dryRun?: boolean;
};

type PackageVersion = {
	id: number;
	metadata?: { container?: { tags?: string[] } };
};

type PrState = 'OPEN' | 'CLOSED' | 'MERGED';

type AppResult = {
	logLines: string[];
	rows: string[][];
};

// Delete `:pr-<n>` GHCR tags for one specific PR across every package, on
// `pull_request.closed` for unmerged PRs (the workflow gates on
// `merged == false`). Merged PRs are kept because their `:pr-<n>` is the
// retag source for `:main` / `:main-<sha>`.
//
// Per-package work is fanned out with Promise.all; deletions within a
// package are also parallel. Logs are buffered per-app and flushed in APPS
// order at the end so the output stays readable.
export async function prunePrImages(opts: PrunePrImagesOpts): Promise<void> {
	const slug = opts.repo ?? process.env.GITHUB_REPOSITORY;
	if (!slug || !slug.includes('/')) {
		fail('prune-pr-images: --repo <owner/name> required (or set $GITHUB_REPOSITORY).');
	}
	const [owner, repo] = slug.split('/');
	if (!owner || !repo) fail(`prune-pr-images: invalid --repo "${slug}"`);
	if (!Number.isInteger(opts.pr) || opts.pr <= 0) {
		fail(`prune-pr-images: --pr must be a positive integer, got ${opts.pr}`);
	}

	section(`Prune :pr-${opts.pr} tags in ${owner}/${repo}`);

	const state = await lookupPrState(owner, repo, opts.pr);
	if (state !== 'CLOSED' && state !== 'MERGED') {
		const note = state ? `state is ${state}` : 'state lookup failed';
		info(`refusing to delete — PR #${opts.pr}: ${note}`);
		appendSummary(
			summarySection('🧹 PR image cleanup', `Skipped: PR #${opts.pr} is not closed (${note}).`)
		);
		return;
	}

	const dryRun = opts.dryRun ?? false;
	const results = await Promise.all(
		APPS.map((app) => processApp(owner, app.image, opts.pr, dryRun))
	);

	// Flush per-app logs in canonical APPS order.
	for (let i = 0; i < APPS.length; i++) {
		const r = results[i];
		console.log(`\n› ${APPS[i].image}`);
		for (const line of r.logLines) console.log(`  ${line}`);
	}

	const rows = results.flatMap((r) => r.rows);
	appendSummary(
		summarySection(
			`🧹 PR image cleanup — #${opts.pr} (${state})`,
			rows.length === 0
				? `No \`:pr-${opts.pr}\` tags found across ${APPS.length} packages.`
				: summaryTable(['Package', 'Version', 'Action'], rows)
		)
	);

	const verb = dryRun ? 'would delete' : 'deleted';
	console.log('');
	success(`${verb} ${rows.length} version(s) for PR #${opts.pr}`);
}

async function processApp(
	owner: string,
	image: string,
	pr: number,
	dryRun: boolean
): Promise<AppResult> {
	const logLines: string[] = [];
	const rows: string[][] = [];

	const versions = await listVersions(owner, image);
	const matching = versions.filter((v) => (v.metadata?.container?.tags ?? []).includes(`pr-${pr}`));

	if (matching.length === 0) {
		logLines.push(`no :pr-${pr} tag`);
		return { logLines, rows };
	}

	await Promise.all(
		matching.map(async (v) => {
			if (dryRun) {
				logLines.push(`would delete version ${v.id} (pr-${pr})`);
				rows.push([`\`${image}\``, String(v.id), 'would delete']);
				return;
			}
			await deleteVersion(owner, image, v.id);
			logLines.push(`deleted version ${v.id} (pr-${pr})`);
			rows.push([`\`${image}\``, String(v.id), 'deleted']);
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

async function lookupPrState(
	owner: string,
	repo: string,
	prNumber: number
): Promise<PrState | null> {
	// `gh pr view` exits non-zero on unknown PRs; treat that as "leave alone"
	// rather than guessing — better to leak an oddball image than delete the
	// wrong one.
	try {
		const { stdout } = await runAsync(
			'gh',
			['pr', 'view', String(prNumber), '--repo', `${owner}/${repo}`, '--json', 'state'],
			{ capture: true, quiet: true }
		);
		const data = JSON.parse(stdout) as { state: PrState };
		return data.state;
	} catch {
		return null;
	}
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

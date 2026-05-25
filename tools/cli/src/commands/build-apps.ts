import { run } from '../lib/proc.ts';
import { readContext } from '../lib/context.ts';
import { info, section, success } from '../lib/log.ts';
import { appendSummary, summarySection } from '../lib/summary.ts';

// Wraps `pnpm build`. No-op on the retag fast-path so the workflow can call
// it unconditionally — the CI YAML stays a flat list of named steps.
export function buildApps(opts: { cwd?: string } = {}): void {
	const ctx = readContext();
	section('Build apps');
	if (ctx.strategy === 'retag') {
		info(`skipped — strategy=retag (will reuse :${ctx.fromTag})`);
		appendSummary(
			summarySection('🔨 Build apps', `⏭ Skipped — retag fast-path (reusing \`:${ctx.fromTag}\`)`)
		);
		return;
	}
	const t0 = Date.now();
	run('pnpm', ['build'], { cwd: opts.cwd });
	const seconds = ((Date.now() - t0) / 1000).toFixed(1);
	success('apps built');
	appendSummary(summarySection('🔨 Build apps', `✓ \`pnpm build\` completed in ${seconds}s`));
}

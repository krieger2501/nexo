// Append markdown to $GITHUB_STEP_SUMMARY. Renders as a single panel on the
// run page (`https://github.com/<repo>/actions/runs/<id>`). No-op locally.
//
// Each CLI command writes a section when it runs (or when it self-skips), so
// reading the panel top-to-bottom tells you what the build did. Sections are
// short, table-shaped, and use sparing emoji as visual anchors so a quick
// scroll lands on the right one.

import { appendFileSync } from 'node:fs';

export function appendSummary(markdown: string): void {
	const target = process.env.GITHUB_STEP_SUMMARY;
	if (!target) return;
	const trimmed = markdown.endsWith('\n') ? markdown : markdown + '\n';
	try {
		appendFileSync(target, trimmed);
	} catch {
		// Don't fail the build over a summary write — local runs without
		// $GITHUB_STEP_SUMMARY shouldn't see this, but be defensive about
		// permission / disk issues on the runner.
	}
}

// Helpers for the three table shapes we use across commands.
export function summaryTable(headers: readonly string[], rows: readonly string[][]): string {
	const head = `| ${headers.join(' | ')} |`;
	const sep = `| ${headers.map(() => '---').join(' | ')} |`;
	const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
	return [head, sep, body].join('\n');
}

export function summarySection(title: string, body: string): string {
	return `## ${title}\n\n${body}\n`;
}

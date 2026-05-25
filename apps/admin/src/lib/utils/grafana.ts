// Build deep-link URLs into the provisioned Grafana dashboards. Used by the
// admin app's "Open in Grafana" buttons and the header correlation-ID search.
//
// Dashboard UIDs are pinned at provisioning time
// (`grafana/provisioning/dashboards/json/*.json`):
//   • `nexo-logs`     — Logs Explorer (template vars: service, level, search)
//   • `nexo-app`      — Per-App Deep Dive (template var: app)
//
// The Logs Explorer's `search` template variable is injected directly into
// Loki's `|~ "${search}"` regex match, so user-provided values (especially
// correlation IDs containing `.`) need regex escaping before we hand them off.

import { env } from '$env/dynamic/public';

function base(): string {
	const url = env.PUBLIC_GRAFANA_URL;
	if (!url) return '';
	return url.replace(/\/$/, '');
}

// Loki regex escape — covers everything that has special meaning in RE2.
// Correlation IDs are typically `[0-9a-f]{8}` so this is overkill in practice,
// but cheap insurance against future format changes.
function escapeRegex(value: string): string {
	return value.replace(/[\\.+*?()[\]{}|^$]/g, '\\$&');
}

export type LogsLinkOpts = {
	service?: string;
	correlationId?: string;
	fromMinutes?: number;
};

export function grafanaLogsUrl(opts: LogsLinkOpts = {}): string {
	const root = base();
	if (!root) return '';
	const params = new URLSearchParams();
	if (opts.service) params.set('var-service', opts.service);
	params.set('var-level', 'All');
	if (opts.correlationId) params.set('var-search', escapeRegex(opts.correlationId));
	const fromMinutes = opts.fromMinutes ?? 60;
	params.set('from', `now-${fromMinutes}m`);
	params.set('to', 'now');
	return `${root}/d/nexo-logs/nexo-logs-explorer?${params.toString()}`;
}

export function grafanaContainerUrl(service: string): string {
	const root = base();
	if (!root) return '';
	const params = new URLSearchParams({
		'var-app': service,
		from: 'now-1h',
		to: 'now'
	});
	return `${root}/d/nexo-app/per-app-deep-dive?${params.toString()}`;
}

export function grafanaConfigured(): boolean {
	return base() !== '';
}

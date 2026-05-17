import { SvelteSet } from 'svelte/reactivity';
import { settings } from '$lib/settings.svelte';

export interface LogEntry {
	ts: string;
	level: string;
	service: string;
	msg: string;
	meta: Record<string, unknown>;
	raw: string;
	structured: boolean;
}

export type LogsState = ReturnType<typeof createLogsState>;
export const LOGS_CTX = Symbol('logs');

export function createLogsState(serviceName: string) {
	let lines = $state<LogEntry[]>([]);
	let autoScroll = $state(true);
	let paused = $state(false);
	let rawMode = $state(false);
	let newSinceScroll = $state(0);
	let logFilter = $state<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
	let logSearch = $state('');
	let expandedIdx = $state<number | null>(null);
	let copiedIdx = $state<number | null>(null);
	let allMetaKeys = new SvelteSet<string>();
	let displayFields = $state<string[]>(['correlationId', 'error', 'path']);
	let fieldSheetOpen = $state(false);

	// Set by LogsViewer via setSentinel() — not reactive, just a DOM ref for scroll
	let _sentinel: HTMLElement | null = null;
	function setSentinel(el: HTMLElement | null) {
		_sentinel = el;
	}

	const availableMetaKeys = $derived([...allMetaKeys]);

	const levelCounts = $derived({
		all: lines.length,
		debug: lines.filter((l) => l.level === 'debug').length,
		info: lines.filter((l) => l.level === 'info').length,
		warn: lines.filter((l) => l.level === 'warn').length,
		error: lines.filter((l) => l.level === 'error').length
	});

	const filteredLines = $derived(
		lines.filter(
			(l) =>
				(logFilter === 'all' || l.level === logFilter) &&
				(!logSearch || l.raw.toLowerCase().includes(logSearch.toLowerCase()))
		)
	);

	function parseStructured(
		obj: Record<string, unknown>,
		raw: string,
		fallbackTs?: string
	): LogEntry | null {
		if (!obj.level || !obj.msg) return null;
		const { level, ts, time, service, msg, ...rest } = obj as {
			level: string;
			ts?: string;
			time?: string;
			service?: string;
			msg: string;
			[k: string]: unknown;
		};
		return {
			ts: ts ?? time ?? fallbackTs ?? '',
			level: level ?? 'info',
			service: service ?? '',
			msg: msg ?? '',
			meta: rest,
			raw,
			structured: true
		};
	}

	const DOCKER_TS_RE = /^(\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2}))\s+(.*)$/;

	function parseLine(raw: string): LogEntry {
		try {
			const obj = JSON.parse(raw) as Record<string, unknown>;
			const entry = parseStructured(obj, raw);
			if (entry) return entry;
		} catch {
			/* not JSON */
		}

		const tsMatch = DOCKER_TS_RE.exec(raw);
		if (tsMatch) {
			const dockerTs = tsMatch[1];
			const remainder = tsMatch[2];
			try {
				const obj = JSON.parse(remainder) as Record<string, unknown>;
				const entry = parseStructured(obj, raw, dockerTs);
				if (entry) return entry;
			} catch {
				/* not JSON after stripping ts */
			}
		}

		return {
			ts: tsMatch?.[1] ?? '',
			level: raw.toLowerCase().includes('error')
				? 'error'
				: raw.toLowerCase().includes('warn')
					? 'warn'
					: 'info',
			service: '',
			msg: tsMatch?.[2] ?? raw,
			meta: {},
			raw,
			structured: false
		};
	}

	// Returns cleanup function — call from LogsViewer onMount/onDestroy
	function connect(): () => void {
		const es = new EventSource(`/services/${serviceName}/logs`);
		es.onmessage = (e: MessageEvent) => {
			if (paused) return;
			const entry = parseLine(JSON.parse(e.data as string) as string);
			lines.push(entry);
			for (const k of Object.keys(entry.meta)) allMetaKeys.add(k);
			if (lines.length > 2000) {
				lines = lines.slice(-2000);
				const rebuilt = new SvelteSet<string>();
				for (const l of lines) for (const k of Object.keys(l.meta)) rebuilt.add(k);
				allMetaKeys = rebuilt;
			}
			if (autoScroll) {
				requestAnimationFrame(() => _sentinel?.scrollIntoView({ block: 'end' }));
			} else {
				newSinceScroll += 1;
			}
		};
		es.onerror = () => es.close();
		return () => es.close();
	}

	function toggleDisplayField(key: string) {
		if (displayFields.includes(key)) {
			displayFields = displayFields.filter((k) => k !== key);
		} else {
			displayFields = [...displayFields, key];
		}
	}

	async function copyRaw(idx: number, raw: string) {
		await navigator.clipboard.writeText(raw);
		copiedIdx = idx;
		setTimeout(() => (copiedIdx = null), 2000);
	}

	function copyAllLogs() {
		const text = filteredLines.map((e) => e.raw).join('\n');
		navigator.clipboard?.writeText(text);
	}

	function filterByField(val: string) {
		logSearch = val;
		expandedIdx = null;
	}

	function fmtTs(iso: string): string {
		if (!iso) return '';
		try {
			if (settings.timeMode === 'abs') {
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				const d = new Date(iso);
				return (
					d.toLocaleTimeString('en-GB', {
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit'
					}) +
					'.' +
					String(d.getMilliseconds()).padStart(3, '0')
				);
			}
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const diff = Date.now() - new Date(iso).getTime();
			const s = Math.floor(diff / 1000);
			if (s < 60) return `${s}s ago`;
			const m = Math.floor(s / 60);
			if (m < 60) return `${m}m ago`;
			const h = Math.floor(m / 60);
			if (h < 24) return `${h}h ago`;
			return `${Math.floor(h / 24)}d ago`;
		} catch {
			return iso.slice(11, 19);
		}
	}

	return {
		get lines() {
			return lines;
		},
		get autoScroll() {
			return autoScroll;
		},
		set autoScroll(v: boolean) {
			autoScroll = v;
		},
		get paused() {
			return paused;
		},
		set paused(v: boolean) {
			paused = v;
		},
		get rawMode() {
			return rawMode;
		},
		set rawMode(v: boolean) {
			rawMode = v;
		},
		get newSinceScroll() {
			return newSinceScroll;
		},
		set newSinceScroll(v: number) {
			newSinceScroll = v;
		},
		get logFilter() {
			return logFilter;
		},
		set logFilter(v: 'all' | 'info' | 'warn' | 'error' | 'debug') {
			logFilter = v;
		},
		get logSearch() {
			return logSearch;
		},
		set logSearch(v: string) {
			logSearch = v;
		},
		get expandedIdx() {
			return expandedIdx;
		},
		set expandedIdx(v: number | null) {
			expandedIdx = v;
		},
		get copiedIdx() {
			return copiedIdx;
		},
		get displayFields() {
			return displayFields;
		},
		get fieldSheetOpen() {
			return fieldSheetOpen;
		},
		set fieldSheetOpen(v: boolean) {
			fieldSheetOpen = v;
		},
		get availableMetaKeys() {
			return availableMetaKeys;
		},
		get levelCounts() {
			return levelCounts;
		},
		get filteredLines() {
			return filteredLines;
		},
		setSentinel,
		connect,
		toggleDisplayField,
		copyRaw,
		copyAllLogs,
		filterByField,
		fmtTs
	};
}

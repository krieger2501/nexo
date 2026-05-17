<script lang="ts">
	import { getContext } from 'svelte';
	import { settings } from '$lib/settings.svelte';
	import type { LogEntry, LogsState } from './logsState.svelte';
	import { LOGS_CTX } from './logsState.svelte';

	interface Props {
		entry: LogEntry;
		index: number;
	}

	let { entry, index }: Props = $props();
	const logs = getContext<LogsState>(LOGS_CTX);

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			logs.expandedIdx = logs.expandedIdx === index ? null : index;
		}
	}

	function escHtml(s: string): string {
		return s
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function highlightJSONHtml(e: LogEntry): string {
		if (!e.structured) return escHtml(e.raw);
		const obj: Record<string, unknown> = {
			ts: e.ts,
			level: e.level,
			...(e.service ? { service: e.service } : {}),
			msg: e.msg,
			...e.meta
		};
		const parts: string[] = ['{'];
		const entries = Object.entries(obj);
		entries.forEach(([k, v], i) => {
			parts.push(` "<span class="jk">${escHtml(k)}</span>": `);
			if (typeof v === 'string') parts.push(`<span class="js">"${escHtml(v)}"</span>`);
			else if (typeof v === 'number') parts.push(`<span class="jn">${escHtml(String(v))}</span>`);
			else parts.push(escHtml(JSON.stringify(v)));
			if (i < entries.length - 1) parts.push(',');
		});
		parts.push(' }');
		return parts.join('');
	}
</script>

<div
	class="log-row"
	class:raw={logs.rawMode}
	class:wrap={settings.logWrap}
	class:truncate={!settings.logWrap}
	class:expanded={logs.expandedIdx === index}
	data-lv={entry.level}
	onclick={() => (logs.expandedIdx = logs.expandedIdx === index ? null : index)}
	onkeydown={handleKey}
	role="button"
	tabindex="0"
>
	<div class="log-head">
		<span class="log-ts">{logs.fmtTs(entry.ts)}</span>
		<span class="log-lv" data-lv={entry.level}>{entry.level}</span>
		{#if entry.service}<span class="log-svc">{entry.service}</span>{/if}
	</div>

	{#if logs.rawMode}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- all values are escaped via escHtml() -->
		<div class="log-raw">{@html highlightJSONHtml(entry)}</div>
	{:else}
		<div class="log-msg">{entry.msg || entry.raw}</div>
		{#if logs.displayFields.some((f) => entry.meta[f] !== undefined)}
			<div class="log-fields">
				{#each logs.displayFields as f (f)}
					{#if entry.meta[f] !== undefined}
						<span><span class="k">{f}=</span><span class="v">{String(entry.meta[f])}</span></span>
					{/if}
				{/each}
			</div>
		{/if}
	{/if}

	{#if logs.expandedIdx === index}
		<div class="log-expand" onclick={(e) => e.stopPropagation()} role="none">
			<div class="log-kv">
				<span class="k">timestamp</span>
				<span class="v">{entry.ts}</span>
			</div>
			{#if entry.structured}
				<div class="log-kv">
					<span class="k">level</span>
					<span class="v">{entry.level}</span>
				</div>
				{#if entry.service}
					<div class="log-kv">
						<span class="k">service</span>
						<span class="v">{entry.service}</span>
					</div>
				{/if}
				<div class="log-kv">
					<span class="k">msg</span>
					<span class="v">{entry.msg}</span>
				</div>
				{#each Object.entries(entry.meta) as [k, v] (k)}
					<div class="log-kv">
						<span class="k">{k}</span>
						<span
							class="v clickable"
							role="button"
							tabindex="0"
							onclick={(e) => {
								e.stopPropagation();
								logs.filterByField(String(v));
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									e.stopPropagation();
									logs.filterByField(String(v));
								}
							}}
						>
							{typeof v === 'object' ? JSON.stringify(v) : String(v)}
						</span>
					</div>
				{/each}
			{:else}
				<div class="log-kv">
					<span class="k">raw</span>
					<span class="v">{entry.raw}</span>
				</div>
			{/if}
			<div class="log-actions">
				<button
					type="button"
					class="log-action-btn"
					onclick={(e) => {
						e.stopPropagation();
						logs.copyRaw(index, entry.raw);
					}}
				>
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
						><rect x="5" y="5" width="8" height="9" rx="1.5" /><path
							d="M3 11V3a1 1 0 011-1h7"
						/></svg
					>
					{logs.copiedIdx === index ? 'Copied!' : 'Copy JSON'}
				</button>
				{#if entry.meta.correlationId}
					<button
						type="button"
						class="log-action-btn"
						onclick={(e) => {
							e.stopPropagation();
							logs.filterByField(String(entry.meta.correlationId));
						}}
					>
						<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
							><path d="M2 3h12l-4 6v4l-4 2V9z" stroke-linejoin="round" /></svg
						>
						Filter corr-id
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<script lang="ts">
	import type { ContainerInspect, HealthzResult } from '$lib/server/docker';
	import { enhance } from '$app/forms';
	import UptimeSparkline from './UptimeSparkline.svelte';

	interface HistoryRow {
		checkedAt: Date | string;
		ok: boolean;
		latencyMs: number | null;
	}

	interface Props {
		container: ContainerInspect;
		healthz: HealthzResult | null;
		history?: HistoryRow[];
		fmtRelative: (iso: string | number | null) => string;
	}

	let { container, healthz: initialHealthz, history = [], fmtRelative }: Props = $props();

	// svelte-ignore state_referenced_locally
	let healthz = $state<HealthzResult | null>(initialHealthz ?? null);
	let lastChecked = $state<number>(Date.now());
	let busy = $state(false);

	const dockerLog = $derived(container.State.Health?.Log?.slice() ?? []);
	const checks = $derived(healthz?.body?.checks ?? {});
	const checkEntries = $derived(Object.entries(checks));
	const passing = $derived(checkEntries.filter(([, v]) => v.ok).length);
	const total = $derived(checkEntries.length);
	const summaryTone = $derived(
		!healthz
			? 'mute'
			: !healthz.ok
				? 'err'
				: passing === total
					? 'ok'
					: passing > 0
						? 'warn'
						: 'err'
	);

	const dockerStats = $derived.by(() => {
		const entries = dockerLog.slice(-20);
		const pass = entries.filter((e) => e.ExitCode === 0).length;
		const fail = entries.length - pass;
		const oldest = entries[0]?.Start ? new Date(entries[0]!.Start) : null;
		const newest = entries[entries.length - 1]?.Start
			? new Date(entries[entries.length - 1]!.Start)
			: null;
		return { entries, pass, fail, oldest, newest };
	});
</script>

<div class="fade-in">
	<div class="health-summary">
		<div class="health-summary-main">
			{#if healthz?.body}
				<div class="health-count {summaryTone}">{passing} / {total} passing</div>
				<div class="health-meta-line">
					{fmtRelative(lastChecked)} · {healthz.latency_ms}ms
				</div>
				<div class="health-meta-line mono">
					v{healthz.body.version ?? '?'}{#if healthz.body.commit}
						· {healthz.body.commit}{/if}
				</div>
				{#if healthz.body.buildTime}
					<div class="health-meta-line mono faint">
						built {healthz.body.buildTime.slice(0, 16).replace('T', ' ')}
					</div>
				{/if}
			{:else if healthz?.error}
				<div class="health-count err">unreachable</div>
				<div class="health-meta-line">{healthz.error}</div>
			{:else}
				<div class="health-count mute">—</div>
				<div class="health-meta-line">No /healthz response</div>
			{/if}
		</div>
		<form
			method="POST"
			action="?/recheck"
			use:enhance={() => {
				busy = true;
				return async ({ result, update }) => {
					if (result.type === 'success' && result.data) {
						const data = result.data as { healthz?: HealthzResult };
						if (data.healthz) {
							healthz = data.healthz;
							lastChecked = Date.now();
						}
					}
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<button
				type="submit"
				class="recheck"
				disabled={busy}
				class:busy
				aria-label="Recheck health"
				title="Recheck health"
			>
				{#if busy}
					<span class="spinner"></span>
				{:else}
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
						><path d="M3 8a5 5 0 018-3.5M13 8a5 5 0 01-8 3.5" /><path
							d="M11 2v3h-3M5 14v-3h3"
							stroke-linecap="round"
						/></svg
					>
				{/if}
			</button>
		</form>
	</div>

	{#if checkEntries.length > 0}
		<div class="row-stack" style="margin-top:10px">
			{#each checkEntries as [name, c] (name)}
				<div class="hc">
					<div class="hc-icon {c.ok ? 'ok' : 'err'}">
						{#if c.ok}
							<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"
								><path d="M3 8l3.5 3.5L13 5" stroke-linecap="round" stroke-linejoin="round" /></svg
							>
						{:else}
							<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"
								><circle cx="8" cy="8" r="6" /><path
									d="M5 5l6 6M11 5l-6 6"
									stroke-linecap="round"
								/></svg
							>
						{/if}
					</div>
					<div class="hc-body">
						<div class="hc-title">{name}</div>
						<div class="hc-out">
							{#if c.ok}
								{c.latency_ms ?? 0}ms
							{:else}
								{c.error ?? 'failed'}
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if healthz?.body}
		<div class="empty">
			<div class="em">○</div>
			<div>This app's /healthz returned no checks.</div>
		</div>
	{/if}

	{#if dockerStats.entries.length > 0}
		<div class="docker-log">
			<div class="docker-log-head">
				<div class="docker-log-h">Docker healthchecks</div>
				<div class="docker-log-counts">
					<span class="ct"><span class="ct-dot ok"></span>{dockerStats.pass} pass</span>
					{#if dockerStats.fail > 0}
						<span class="ct"><span class="ct-dot err"></span>{dockerStats.fail} fail</span>
					{/if}
				</div>
			</div>
			<div class="docker-pips">
				{#each dockerStats.entries as entry, i (i)}
					<span
						class="pip {entry.ExitCode === 0 ? 'ok' : 'err'}"
						title={`${new Date(entry.Start).toLocaleString()} · ${entry.ExitCode === 0 ? 'pass' : `fail (exit ${entry.ExitCode})`}`}
					></span>
				{/each}
			</div>
			<div class="docker-axis">
				<span>{dockerStats.oldest ? fmtRelative(dockerStats.oldest.toISOString()) : ''}</span>
				<span>newest →</span>
			</div>
		</div>
	{/if}

	<UptimeSparkline {history} />
</div>

<style>
	.health-summary {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding: 14px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-lg);
	}

	.health-summary-main {
		flex: 1;
		min-width: 0;
	}

	.health-count {
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}
	.health-count.ok {
		color: var(--accent-ink);
	}
	.health-count.warn {
		color: var(--warn-ink);
	}
	.health-count.err {
		color: var(--err-ink);
	}
	.health-count.mute {
		color: var(--color-text-faint);
	}

	.health-meta-line {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-text-subtle);
		margin-top: 4px;
		overflow-wrap: anywhere;
	}
	.health-meta-line.faint {
		color: var(--color-text-faint);
	}

	.recheck {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border-radius: 999px;
		border: 1px solid var(--color-border-default);
		background: var(--color-surface-1);
		color: var(--color-text-subtle);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			background var(--duration-fast) var(--ease-out),
			color var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
	}
	.recheck:hover:not(:disabled) {
		background: var(--color-bg-2);
		color: var(--color-text-primary);
	}
	.recheck:active:not(:disabled) {
		transform: rotate(-30deg);
	}
	.recheck:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.recheck svg {
		width: 14px;
		height: 14px;
	}

	.spinner {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid currentColor;
		border-right-color: transparent;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.empty {
		text-align: center;
		padding: 24px;
		color: var(--color-text-subtle);
		font-size: 13px;
	}
	.empty .em {
		font-size: 26px;
		opacity: 0.4;
		margin-bottom: 6px;
	}

	.docker-log {
		margin-top: 14px;
		padding: 12px 14px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-md);
	}
	.docker-log-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 8px;
		margin-bottom: 10px;
	}
	.docker-log-h {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-subtle);
	}
	.docker-log-counts {
		display: flex;
		gap: 10px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-text-subtle);
	}
	.ct {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.ct-dot {
		width: 7px;
		height: 7px;
		border-radius: 999px;
		display: inline-block;
	}
	.ct-dot.ok {
		background: var(--accent-ink);
		opacity: 0.85;
	}
	.ct-dot.err {
		background: var(--err-ink);
	}
	.docker-pips {
		display: flex;
		gap: 3px;
		flex-wrap: wrap;
	}
	.pip {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 2px;
	}
	.pip.ok {
		background: var(--accent-ink);
		opacity: 0.85;
	}
	.pip.err {
		background: var(--err-ink);
	}
	.docker-axis {
		display: flex;
		justify-content: space-between;
		margin-top: 8px;
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--color-text-faint);
	}
	.mono {
		font-family: var(--font-mono);
	}
</style>

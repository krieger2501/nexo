<script lang="ts">
	import { page } from '$app/state';
	import InfoTab from './InfoTab.svelte';
	import HealthTab from './HealthTab.svelte';
	import LogsViewer from './LogsViewer.svelte';
	import { fmtRelative } from '$lib/utils';

	let { data } = $props();
	const container = $derived(data.container);
	const name = $derived(page.params.name ?? '');

	function formatDate(iso: string) {
		if (!iso || iso.startsWith('0001')) return '—';
		return new Date(iso).toLocaleString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function uptime(startedAt: string) {
		if (!startedAt || startedAt.startsWith('0001')) return '—';
		const ms = Date.now() - new Date(startedAt).getTime();
		const s = Math.floor(ms / 1000);
		if (s < 60) return `${s}s`;
		const m = Math.floor(s / 60);
		if (m < 60) return `${m}m`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ${m % 60}m`;
		return `${Math.floor(h / 24)}d ${h % 24}h`;
	}

	const healthStatus = $derived(container.State.Health?.Status ?? null);
	const networks = $derived(Object.keys(container.NetworkSettings.Networks));
	const imageShort = $derived(container.Config.Image.split('/').pop() ?? container.Config.Image);
	const restartPolicy = $derived(container.HostConfig.RestartPolicy.Name);
	const tone = $derived(
		container.State.Status.toLowerCase() === 'restarting'
			? 'err'
			: container.State.Running
				? healthStatus === 'unhealthy'
					? 'err'
					: healthStatus === 'starting'
						? 'warn'
						: 'ok'
				: 'mute'
	);
	const statusLabel = $derived(
		container.State.Status === 'restarting'
			? 'Restarting'
			: container.State.Running
				? healthStatus
					? healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)
					: 'Running'
				: 'Stopped'
	);

	let activeTab = $state<'info' | 'health' | 'logs'>('info');
</script>

<div class="screen">
	<!-- Status card -->
	<div class="status-card">
		<div class="status-card-head">
			<span class="ctn-dot {tone}"></span>
			<span class="pill {tone}">{statusLabel}</span>
			<span class="uptime-label">up {uptime(container.State.StartedAt)}</span>
		</div>
		<div class="status-card-name">{imageShort}</div>
		<div class="status-card-actions">
			{#if container.State.Running}
				<button type="button" class="btn btn-secondary btn-small">
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
						><path d="M3 8a5 5 0 018-3.5M13 8a5 5 0 01-8 3.5" /><path
							d="M11 2v3h-3M5 14v-3h3"
							stroke-linecap="round"
						/></svg
					>
					Restart
				</button>
				<button type="button" class="btn btn-ghost btn-small">
					<svg viewBox="0 0 16 16" fill="currentColor"
						><rect x="4" y="3" width="3" height="10" rx="1" /><rect
							x="9"
							y="3"
							width="3"
							height="10"
							rx="1"
						/></svg
					>
					Stop
				</button>
			{:else}
				<button type="button" class="btn btn-primary btn-small">
					<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 3l9 5-9 5z" /></svg>
					Start
				</button>
			{/if}
			<button type="button" class="btn btn-ghost btn-small" onclick={() => (activeTab = 'logs')}>
				Logs →
			</button>
		</div>
	</div>

	<!-- Segmented tabs -->
	<div class="segmented">
		<button
			type="button"
			class="seg"
			class:active={activeTab === 'info'}
			onclick={() => (activeTab = 'info')}>Info</button
		>
		<button
			type="button"
			class="seg"
			class:active={activeTab === 'health'}
			onclick={() => (activeTab = 'health')}
		>
			Health
			{#if healthStatus === 'unhealthy' || healthStatus === 'starting'}
				<span class="seg-dot {healthStatus === 'unhealthy' ? 'err' : 'warn'}"></span>
			{/if}
		</button>
		<button
			type="button"
			class="seg"
			class:active={activeTab === 'logs'}
			onclick={() => (activeTab = 'logs')}>Logs</button
		>
	</div>

	{#if activeTab === 'info'}
		<InfoTab {container} {formatDate} {restartPolicy} {networks} />
	{/if}

	{#if activeTab === 'health'}
		<HealthTab {container} {fmtRelative} />
	{/if}

	{#if activeTab === 'logs'}
		<LogsViewer serviceName={name} />
	{/if}
</div>

<style>
	.screen {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* ── Status card ── */
	.status-card {
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-lg);
		padding: 14px;
	}

	.status-card-head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.uptime-label {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-subtle);
	}

	.status-card-name {
		font-size: 17px;
		font-weight: 600;
		letter-spacing: -0.015em;
		color: var(--color-text-primary);
		font-family: var(--font-mono);
		margin-bottom: 10px;
	}

	.status-card-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	/* ── Buttons ── */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 36px;
		padding: 0 12px;
		font-size: 13px;
		font-weight: 500;
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			background var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
		background: transparent;
		color: var(--color-text-primary);
	}

	.btn svg {
		width: 14px;
		height: 14px;
	}

	.btn-primary {
		background: var(--color-accent);
		color: #fff;
		font-weight: 600;
	}

	.btn-secondary {
		border-color: var(--color-border-strong);
		background: var(--color-surface-1);
	}

	.btn-ghost {
		background: var(--color-bg-2);
	}

	.btn-small {
		min-height: 32px;
		padding: 0 10px;
		font-size: 12px;
	}

	/* ── Segmented ── */
	.segmented {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		background: var(--color-bg-2);
		padding: 3px;
		border-radius: 10px;
		position: sticky;
		top: calc(var(--topbar-h) + var(--safe-top));
		z-index: 4;
	}

	.seg {
		padding: 8px 10px;
		border-radius: 8px;
		background: transparent;
		border: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-muted);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: all var(--duration-fast) var(--ease-out);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
	}

	.seg.active {
		background: var(--color-surface-1);
		color: var(--color-text-primary);
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.06),
			0 1px 0 rgb(0 0 0 / 0.04);
	}

	.seg-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.seg-dot.err {
		background: var(--err);
	}
	.seg-dot.warn {
		background: var(--warn);
	}
</style>

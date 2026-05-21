<script lang="ts">
	import type { ContainerInfo } from '$lib/server/docker';
	import {
		ctnDisplayName,
		ctnTone,
		ctnStatusLabel,
		ctnUptimeLabel,
		ctnImageTag,
		ctnHealthzFailing,
		type HealthzSnapshot
	} from '$lib/utils/containers';

	interface Props {
		container: ContainerInfo & {
			RestartCount?: number;
			Profile?: string;
			Healthz?: HealthzSnapshot;
		};
	}

	let { container: c }: Props = $props();
	const tone = $derived(ctnTone(c));
	const href = $derived(`/services/${(c.Names[0] ?? c.Id).replace(/^\//, '')}`);
	const restarts = $derived(c.RestartCount ?? 0);
	const profile = $derived(c.Profile ?? 'unknown');
	const healthzFailing = $derived(ctnHealthzFailing(c));
</script>

<a {href} class="ctn-row">
	<span class="ctn-dot {tone}"></span>
	<div class="ctn-body">
		<div class="ctn-name ellipsis">{ctnDisplayName(c)}</div>
		<div class="ctn-meta">
			<span>{ctnImageTag(c)}</span>
			<span class="sep"></span>
			<span>{ctnUptimeLabel(c)}</span>
			{#if restarts > 0}
				<span class="sep"></span>
				<span class="warn-text" title="Restart count">↻ {restarts}</span>
			{/if}
		</div>
	</div>
	<div class="ctn-right">
		{#if healthzFailing}
			<span class="healthz-chip" title={c.Healthz?.error ?? 'health check failing'}>healthz ✕</span>
		{/if}
		{#if profile !== 'unknown'}
			<span class="profile-chip" data-p={profile}>{profile === 'production' ? 'prod' : 'pre'}</span>
		{/if}
		<span class="pill {tone}">{ctnStatusLabel(c)}</span>
		<svg class="ctn-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
			><path d="M6 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" /></svg
		>
	</div>
</a>

<style>
	.ctn-row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 12px;
		align-items: center;
		padding: 14px;
		border-bottom: 1px solid var(--color-border-subtle);
		cursor: pointer;
		background: var(--color-surface-1);
		-webkit-tap-highlight-color: transparent;
		transition: background var(--duration-fast) var(--ease-out);
	}

	.ctn-row:last-child {
		border-bottom: 0;
	}

	.ctn-row:hover,
	.ctn-row:active {
		background: var(--color-bg-1);
	}

	.ctn-body {
		min-width: 0;
	}

	.ctn-name {
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-text-primary);
		text-transform: capitalize;
	}

	.ctn-meta {
		display: flex;
		gap: 6px;
		align-items: center;
		margin-top: 2px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-text-subtle);
	}

	.warn-text {
		color: var(--warn-ink);
		font-weight: 600;
	}

	.sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--color-text-faint);
		flex-shrink: 0;
	}

	.ctn-right {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.profile-chip {
		font-family: var(--font-mono);
		font-size: 9px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--color-bg-2);
		color: var(--color-text-subtle);
		border: 1px solid var(--color-border-subtle);
	}
	.profile-chip[data-p='production'] {
		color: var(--accent-ink);
		background: color-mix(in oklab, var(--accent-ink) 8%, transparent);
		border-color: color-mix(in oklab, var(--accent-ink) 25%, transparent);
	}

	.healthz-chip {
		font-family: var(--font-mono);
		font-size: 9px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 2px 6px;
		border-radius: 4px;
		color: var(--err-ink);
		background: color-mix(in oklab, var(--err-ink) 10%, transparent);
		border: 1px solid color-mix(in oklab, var(--err-ink) 35%, transparent);
		font-weight: 600;
	}

	.ctn-chev {
		width: 18px;
		height: 18px;
		color: var(--color-text-faint);
	}
</style>

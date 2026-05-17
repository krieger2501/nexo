<script lang="ts">
	import type { ContainerInfo } from '$lib/server/docker';
	import {
		ctnDisplayName,
		ctnTone,
		ctnStatusLabel,
		ctnUptimeLabel,
		ctnImageTag
	} from '$lib/utils/containers';

	interface Props {
		container: ContainerInfo;
	}

	let { container: c }: Props = $props();
	const tone = $derived(ctnTone(c));
	const href = $derived(`/services/${(c.Names[0] ?? c.Id).replace(/^\//, '')}`);
</script>

<a {href} class="ctn-row">
	<span class="ctn-dot {tone}"></span>
	<div class="ctn-body">
		<div class="ctn-name ellipsis">{ctnDisplayName(c)}</div>
		<div class="ctn-meta">
			<span>{ctnImageTag(c)}</span>
			<span class="sep"></span>
			<span>{ctnUptimeLabel(c)}</span>
		</div>
	</div>
	<div class="ctn-right">
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

	.ctn-chev {
		width: 18px;
		height: 18px;
		color: var(--color-text-faint);
	}
</style>

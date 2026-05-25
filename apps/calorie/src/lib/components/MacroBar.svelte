<script lang="ts">
	let {
		label,
		consumed,
		target,
		unit = 'g',
		colorVar
	}: {
		label: string;
		consumed: number;
		target: number;
		unit?: string;
		colorVar: string; // CSS var name without `var()`, e.g. '--color-protein'
	} = $props();

	const pct = $derived(Math.min(100, Math.max(0, (consumed / target) * 100)));
	const isOver = $derived(consumed > target);
	const consumedRound = $derived(Math.round(consumed));
	const targetRound = $derived(Math.round(target));
</script>

<div class="bar" class:over={isOver} style:--bar-color="var({colorVar})">
	<div class="row top">
		<span class="dot" aria-hidden="true"></span>
		<span class="label">{label}</span>
		<span class="numbers tnum">
			<span class="now">{consumedRound}</span>
			<span class="sep">/</span>
			<span class="target">{targetRound}{unit}</span>
		</span>
	</div>
	<div class="track" aria-hidden="true">
		<div class="fill" style:width="{pct}%"></div>
		{#if isOver}
			<span class="cap" aria-hidden="true"></span>
		{/if}
	</div>
</div>

<style>
	.bar {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: var(--bar-color);
		flex-shrink: 0;
	}

	.label {
		font-family: var(--font-mono);
		font-size: 9.5px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		font-weight: 500;
		color: var(--color-text-subtle);
		flex: 1;
	}

	.numbers {
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1, 'lnum' 1;
		font-variant-numeric: tabular-nums lining-nums;
		font-variation-settings: 'opsz' 24, 'SOFT' 70, 'wght' 460;
		font-size: 12.5px;
		letter-spacing: -0.005em;
		color: var(--color-text-primary);
	}

	.now {
		color: var(--color-text-primary);
	}
	.sep {
		opacity: 0.32;
		margin: 0 2px;
	}
	.target {
		color: var(--color-text-subtle);
		font-size: 11px;
		font-variation-settings: 'opsz' 24, 'wght' 420;
	}

	.track {
		position: relative;
		height: 4px;
		border-radius: 999px;
		background: color-mix(in oklab, var(--bar-color) 14%, var(--color-bg-1));
		overflow: visible;
	}

	.fill {
		height: 100%;
		border-radius: 999px;
		background: var(--bar-color);
		transition: width 640ms cubic-bezier(0.32, 0.72, 0, 1);
	}

	.bar.over .track {
		background: color-mix(in oklab, var(--color-overtarget) 18%, var(--color-bg-1));
	}

	/* Over-target cap dot — small terracotta marker at the right edge.
	   Reads as "you crossed it" without rendering the whole bar in alarm hues. */
	.cap {
		position: absolute;
		right: -2px;
		top: 50%;
		width: 7px;
		height: 7px;
		border-radius: 999px;
		background: var(--color-overtarget);
		transform: translateY(-50%);
		box-shadow: 0 0 0 2px var(--color-bg-0);
	}

	.bar.over .now {
		color: var(--color-overtarget);
	}
</style>

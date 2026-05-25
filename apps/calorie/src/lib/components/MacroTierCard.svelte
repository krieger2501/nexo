<script lang="ts">
	import { Check } from '@lucide/svelte';
	import type { MacroTier } from '$lib/types';

	let {
		tier: _tier,
		title,
		tagline,
		bestFor,
		shows,
		number,
		selected = false,
		onSelect
	}: {
		tier: MacroTier | 'none';
		title: string;
		tagline: string;
		bestFor: string;
		shows: Array<{ key: string; label: string; colorVar: string }>;
		number: string;
		selected?: boolean;
		onSelect?: () => void;
	} = $props();
</script>

<button class="card" class:on={selected} type="button" onclick={onSelect} aria-pressed={selected}>
	<header class="hd">
		<span class="num eyebrow-num">{number} —</span>
		<span class="title serif-display">{title}</span>
		{#if selected}
			<span class="check" aria-hidden="true">
				<Check size={11} strokeWidth={2.4} />
			</span>
		{/if}
	</header>

	<p class="tagline">{tagline}</p>

	{#if shows.length > 0}
		<div class="chips">
			{#each shows as chip (chip.key)}
				<span class="chip" style:--c="var({chip.colorVar})">
					<span class="chip-dot" aria-hidden="true"></span>
					{chip.label}
				</span>
			{/each}
		</div>
	{/if}

	<div class="best">{bestFor}</div>
</button>

<style>
	.card {
		all: unset;
		cursor: pointer;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 14px 16px 14px 18px;
		border: 1px solid var(--color-border-default);
		border-radius: 14px;
		background: var(--color-surface-1);
		transition:
			background 200ms,
			border-color 200ms;
	}

	.card.on {
		background: var(--ember-tint-bg);
		border-color: color-mix(in oklab, var(--color-ember) 22%, var(--color-border-default));
	}

	.card.on::before {
		content: '';
		position: absolute;
		left: 0;
		top: 12px;
		bottom: 12px;
		width: 3px;
		border-radius: 0 2px 2px 0;
		background: var(--color-ember);
	}

	.hd {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.num {
		opacity: 0.7;
	}

	.title {
		font-size: 16px;
		font-variation-settings: 'opsz' 36, 'SOFT' 100, 'wght' 470;
		color: var(--color-text-primary);
		flex: 1;
		min-width: 0;
	}

	.check {
		width: 18px;
		height: 18px;
		border-radius: 999px;
		background: var(--color-ember);
		color: oklch(98% 0.008 70);
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}

	.tagline {
		font-size: 12.5px;
		color: var(--color-text-subtle);
		margin: 0;
		line-height: 1.4;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 9.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: color-mix(in oklab, var(--c) 70%, var(--color-text-primary));
		background: color-mix(in oklab, var(--c) 10%, var(--color-bg-0));
		border: 1px solid color-mix(in oklab, var(--c) 22%, var(--color-border-default));
	}

	.chip-dot {
		width: 5px;
		height: 5px;
		border-radius: 999px;
		background: var(--c);
	}

	.best {
		font-family: var(--font-display);
		font-style: italic;
		font-variation-settings: 'opsz' 18, 'SOFT' 100, 'wght' 400, 'ital' 1;
		font-size: 11.5px;
		color: var(--color-text-faint);
		margin-top: 2px;
	}
</style>

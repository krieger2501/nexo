<script lang="ts">
	import type { Entry } from '$lib/types';
	import MealSlotChip from './MealSlotChip.svelte';

	let { entry, onclick }: { entry: Entry; onclick?: (e: Entry) => void } = $props();

	const time = $derived(
		new Date(entry.loggedAt).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		})
	);

	const kcal = $derived(Math.round(entry.kcal));
</script>

<button class="row" type="button" onclick={() => onclick?.(entry)}>
	<span class="time eyebrow-num">{time}</span>
	<span class="connector" aria-hidden="true">
		<span class="dot"></span>
		<span class="rule"></span>
	</span>
	<span class="body">
		<span class="name">{entry.foodName}</span>
		<span class="meta">
			<span class="grams tnum">{Math.round(entry.grams)}g</span>
			{#if entry.protein_g}
				<span class="micro p" title="protein">{Math.round(entry.protein_g)}P</span>
			{/if}
			{#if entry.carbs_g}
				<span class="micro c" title="carbs">{Math.round(entry.carbs_g)}C</span>
			{/if}
			{#if entry.fat_g}
				<span class="micro f" title="fat">{Math.round(entry.fat_g)}F</span>
			{/if}
			{#if entry.mealSlot}
				<MealSlotChip slot={entry.mealSlot} size="sm" />
			{/if}
		</span>
	</span>
	<span class="kcal tnum">{kcal}</span>
</button>

<style>
	.row {
		all: unset;
		cursor: pointer;
		display: grid;
		grid-template-columns: 36px 18px 1fr auto;
		align-items: center;
		gap: 8px;
		padding: 9px 4px;
		min-width: 0;
		transition: background 160ms;
		border-radius: 6px;
	}

	.row:hover {
		background: var(--color-bg-1);
	}

	.row:active {
		background: color-mix(in oklab, var(--color-ember) 6%, var(--color-bg-1));
	}

	.time {
		opacity: 0.85;
		text-align: right;
	}

	.connector {
		position: relative;
		height: 100%;
		display: grid;
		place-items: center;
	}

	.dot {
		width: 5px;
		height: 5px;
		border-radius: 999px;
		background: var(--color-ember);
		opacity: 0.55;
	}

	.rule {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--color-border-subtle);
		transform: translateX(-50%);
		z-index: -1;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.name {
		font-size: 13.5px;
		color: var(--color-text-primary);
		font-weight: 460;
		letter-spacing: -0.005em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 10.5px;
		color: var(--color-text-faint);
	}

	.grams {
		font-family: var(--font-mono);
		letter-spacing: 0.02em;
	}

	.micro {
		font-family: var(--font-mono);
		font-feature-settings: 'tnum' 1;
		letter-spacing: 0.04em;
		opacity: 0.75;
	}

	.micro.p { color: var(--color-protein); }
	.micro.c { color: var(--color-carbs); }
	.micro.f { color: var(--color-fat); }

	.kcal {
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1, 'lnum' 1;
		font-variant-numeric: tabular-nums lining-nums;
		font-variation-settings: 'opsz' 36, 'SOFT' 70, 'wght' 470;
		font-size: 19px;
		letter-spacing: -0.025em;
		color: var(--color-text-primary);
	}
</style>

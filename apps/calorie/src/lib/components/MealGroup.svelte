<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import type { Entry } from '$lib/types';
	import MealSlotChip from './MealSlotChip.svelte';

	let {
		entries,
		mealId,
		onEntryTap
	}: {
		entries: Entry[];
		mealId?: string;
		onEntryTap?: (entry: Entry) => void;
	} = $props();

	let expanded = $state(false);

	const time = $derived(
		new Date(entries[0]?.loggedAt ?? Date.now()).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		})
	);

	const totalKcal = $derived(Math.round(entries.reduce((s, e) => s + e.kcal, 0)));
	const slot = $derived(entries.find((e) => e.mealSlot)?.mealSlot ?? null);

	const summary = $derived(
		entries
			.slice(0, 3)
			.map((e) => e.foodName)
			.join(', ') + (entries.length > 3 ? `, +${entries.length - 3}` : '')
	);
</script>

<div class="group" class:expanded>
	<button
		class="row"
		type="button"
		onclick={() => (expanded = !expanded)}
		aria-expanded={expanded}
		aria-controls={mealId ? `meal-${mealId}-items` : undefined}
	>
		<span class="time eyebrow-num">{time}</span>
		<span class="connector" aria-hidden="true">
			<span class="dot stack"></span>
			<span class="rule"></span>
		</span>
		<span class="body">
			<span class="name">
				<span class="serif-display">A meal</span>
				<span class="count">· {entries.length} items</span>
			</span>
			<span class="meta">
				<span class="summary">{summary}</span>
				{#if slot}
					<MealSlotChip {slot} size="sm" />
				{/if}
			</span>
		</span>
		<span class="kcal-block">
			<span class="kcal tnum">{totalKcal}</span>
			<span class="chev" class:flipped={expanded} aria-hidden="true">
				<ChevronDown size={14} strokeWidth={1.7} />
			</span>
		</span>
	</button>

	{#if expanded}
		<div class="inner" id={mealId ? `meal-${mealId}-items` : undefined}>
			{#each entries as entry (entry.id)}
				<button class="inner-row" type="button" onclick={() => onEntryTap?.(entry)}>
					<span class="ir-name">{entry.foodName}</span>
					<span class="ir-grams tnum">{Math.round(entry.grams)}g</span>
					<span class="ir-kcal tnum">{Math.round(entry.kcal)}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.group {
		display: flex;
		flex-direction: column;
	}

	.row {
		all: unset;
		cursor: pointer;
		display: grid;
		grid-template-columns: 36px 18px 1fr auto;
		align-items: center;
		gap: 8px;
		padding: 9px 4px;
		border-radius: 6px;
		transition: background 160ms;
	}

	.row:hover {
		background: var(--color-bg-1);
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

	/* Stacked dot — three concentric rings to hint "multi-item" */
	.dot.stack {
		box-shadow:
			0 0 0 2px color-mix(in oklab, var(--color-ember) 18%, transparent),
			0 0 0 4px color-mix(in oklab, var(--color-ember) 8%, transparent);
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
		display: flex;
		align-items: baseline;
		gap: 6px;
		font-size: 14px;
		color: var(--color-text-primary);
	}

	.name .count {
		font-family: var(--font-mono);
		font-feature-settings: 'tnum' 1;
		font-size: 10px;
		color: var(--color-text-faint);
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 10.5px;
		color: var(--color-text-faint);
		min-width: 0;
	}

	.summary {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-style: italic;
		opacity: 0.85;
	}

	.kcal-block {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.kcal {
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1, 'lnum' 1;
		font-variant-numeric: tabular-nums lining-nums;
		font-variation-settings: 'opsz' 36, 'SOFT' 70, 'wght' 470;
		font-size: 19px;
		letter-spacing: -0.025em;
		color: var(--color-text-primary);
	}

	.chev {
		display: grid;
		place-items: center;
		color: var(--color-text-faint);
		transition: transform 200ms;
	}

	.chev.flipped {
		transform: rotate(180deg);
	}

	.inner {
		margin-left: 56px;
		margin-bottom: 6px;
		padding: 4px 0 4px 12px;
		border-left: 1px solid var(--color-border-subtle);
		display: flex;
		flex-direction: column;
		gap: 1px;
		animation: inner-down 200ms cubic-bezier(0.32, 0.72, 0, 1);
	}

	@keyframes inner-down {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.inner-row {
		all: unset;
		cursor: pointer;
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 10px;
		align-items: baseline;
		padding: 6px 8px;
		border-radius: 4px;
		font-size: 12.5px;
		transition: background 160ms;
	}

	.inner-row:hover {
		background: var(--color-bg-1);
	}

	.ir-name {
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ir-grams {
		color: var(--color-text-faint);
		font-family: var(--font-mono);
		font-size: 10.5px;
	}

	.ir-kcal {
		font-family: var(--font-display);
		font-variation-settings: 'opsz' 24, 'wght' 460;
		font-size: 13.5px;
		color: var(--color-text-subtle);
	}
</style>

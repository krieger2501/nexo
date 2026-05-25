<script lang="ts">
	import { Minus, Plus, ChevronsUpDown } from '@lucide/svelte';
	import { onDestroy, untrack } from 'svelte';
	import type { FoodUnit, UnitId } from '$lib/types';

	let {
		grams = $bindable(100),
		units = [{ id: 'g' as UnitId, gramsPerUnit: 1, default: true }],
		ariaLabel
	}: {
		grams?: number;
		units?: FoodUnit[];
		ariaLabel?: string;
	} = $props();

	const initialUnitIdx = untrack(() => units.findIndex((u) => u.default));
	let unitIdx = $state(initialUnitIdx >= 0 ? initialUnitIdx : 0);
	const currentUnit = $derived(units[unitIdx] ?? units[0]);
	const hasMultiple = $derived(units.length > 1);

	const stepFor: Record<UnitId, number> = {
		g: 5,
		ml: 5,
		tsp: 0.5,
		tbsp: 0.5,
		cup: 0.25,
		piece: 1,
		shot: 1
	};
	const decimalsFor: Record<UnitId, number> = {
		g: 0,
		ml: 0,
		tsp: 1,
		tbsp: 1,
		cup: 2,
		piece: 0,
		shot: 0
	};

	const step = $derived(stepFor[currentUnit.id] ?? 1);
	const decimals = $derived(decimalsFor[currentUnit.id] ?? 0);

	let editing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let editVal = $state('');
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let repeatTimer: ReturnType<typeof setInterval> | null = null;

	function roundTo(n: number, d: number) {
		const f = Math.pow(10, d);
		return Math.round(n * f) / f;
	}

	function clamp(g: number) {
		return Math.max(1, Math.min(5000, g));
	}

	const display = $derived(roundTo(grams / currentUnit.gramsPerUnit, decimals));

	function bump(direction: 1 | -1) {
		const cur = grams / currentUnit.gramsPerUnit;
		const next = roundTo(cur + step * direction, decimals);
		grams = clamp(Math.round(next * currentUnit.gramsPerUnit));
	}

	function startHold(direction: 1 | -1) {
		bump(direction);
		pressTimer = setTimeout(() => {
			repeatTimer = setInterval(() => bump(direction), 80);
		}, 360);
	}

	function endHold() {
		if (pressTimer) clearTimeout(pressTimer);
		if (repeatTimer) clearInterval(repeatTimer);
		pressTimer = null;
		repeatTimer = null;
	}

	onDestroy(endHold);

	function cycleUnit() {
		if (units.length < 2) return;
		unitIdx = (unitIdx + 1) % units.length;
	}

	function startEdit() {
		editing = true;
		editVal = display.toFixed(decimals);
		queueMicrotask(() => {
			inputEl?.focus();
			inputEl?.select();
		});
	}

	function commitEdit() {
		const n = Number(editVal);
		if (Number.isFinite(n)) {
			grams = clamp(Math.round(n * currentUnit.gramsPerUnit));
		}
		editing = false;
	}

	function unitLabel(unit: FoodUnit, val: number): string {
		if (unit.label) return unit.label;
		if (unit.id === 'piece') return val === 1 ? 'piece' : 'pieces';
		if (unit.id === 'shot') return val === 1 ? 'shot' : 'shots';
		return unit.id;
	}
</script>

<div class="ustep" role="group" aria-label={ariaLabel}>
	<button
		class="btn"
		type="button"
		aria-label="Decrease"
		onpointerdown={() => startHold(-1)}
		onpointerup={endHold}
		onpointerleave={endHold}
	>
		<Minus size={14} strokeWidth={2} />
	</button>

	<div class="middle">
		{#if editing}
			<input
				bind:this={inputEl}
				class="edit-input tnum"
				type="text"
				inputmode="decimal"
				bind:value={editVal}
				onblur={commitEdit}
				onkeydown={(e) => {
					if (e.key === 'Enter') commitEdit();
					if (e.key === 'Escape') editing = false;
				}}
			/>
		{:else}
			<button class="num-btn tnum" type="button" onclick={startEdit}>
				{display.toFixed(decimals)}
			</button>
		{/if}

		<button
			class="unit-btn"
			class:inert={!hasMultiple}
			type="button"
			onclick={cycleUnit}
			disabled={!hasMultiple}
			aria-label={hasMultiple ? 'Cycle unit' : `Unit: ${unitLabel(currentUnit, display)}`}
		>
			<span class="unit-text">{unitLabel(currentUnit, display)}</span>
			{#if hasMultiple}
				<ChevronsUpDown size={11} strokeWidth={1.6} />
			{/if}
		</button>
	</div>

	<button
		class="btn"
		type="button"
		aria-label="Increase"
		onpointerdown={() => startHold(1)}
		onpointerup={endHold}
		onpointerleave={endHold}
	>
		<Plus size={14} strokeWidth={2} />
	</button>
</div>

<style>
	.ustep {
		display: inline-grid;
		grid-template-columns: auto 1fr auto;
		align-items: stretch;
		background: var(--ember-tint-bg);
		border-radius: 999px;
		padding: 5px;
		gap: 6px;
		min-width: 200px;
	}

	.btn {
		all: unset;
		cursor: pointer;
		width: 34px;
		height: 34px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		color: var(--color-ember-deep);
		background: var(--color-bg-0);
		transition:
			background 140ms,
			transform 100ms;
		user-select: none;
		-webkit-user-select: none;
	}

	.btn:active {
		background: color-mix(in oklab, var(--color-ember) 14%, var(--color-bg-0));
		transform: scale(0.93);
	}

	.middle {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 8px;
		padding: 0 8px;
		min-width: 0;
	}

	.num-btn {
		all: unset;
		cursor: text;
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1, 'lnum' 1;
		font-variant-numeric: tabular-nums lining-nums;
		font-variation-settings: 'opsz' 36, 'SOFT' 70, 'wght' 470;
		font-size: 19px;
		letter-spacing: -0.025em;
		color: var(--color-text-primary);
		text-align: right;
		min-width: 1ch;
	}

	.edit-input {
		all: unset;
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1;
		font-variation-settings: 'opsz' 36, 'wght' 470;
		font-size: 19px;
		letter-spacing: -0.025em;
		color: var(--color-text-primary);
		text-align: right;
		width: 4ch;
		caret-color: var(--color-ember);
	}

	.unit-btn {
		all: unset;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 3px;
		padding: 3px 8px;
		border-radius: 999px;
		background: color-mix(in oklab, var(--color-ember) 14%, var(--color-bg-0));
		color: var(--color-ember-deep);
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.06em;
		text-transform: lowercase;
		transition: background 140ms;
	}

	.unit-btn.inert {
		cursor: default;
		background: transparent;
		color: var(--color-text-faint);
		padding-left: 0;
	}

	.unit-btn:not(.inert):active {
		background: color-mix(in oklab, var(--color-ember) 24%, var(--color-bg-0));
	}
</style>

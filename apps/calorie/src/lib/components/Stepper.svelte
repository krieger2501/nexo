<script lang="ts">
	import { Minus, Plus } from '@lucide/svelte';
	import { onDestroy } from 'svelte';

	let {
		value = $bindable(0),
		step = 1,
		min = 0,
		max = 9999,
		decimals = 0,
		ariaLabel = 'Value',
		size = 'md'
	}: {
		value?: number;
		step?: number;
		min?: number;
		max?: number;
		decimals?: number;
		ariaLabel?: string;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	let editing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let editVal = $state('');
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let repeatTimer: ReturnType<typeof setInterval> | null = null;

	function clamp(n: number) {
		const factor = Math.pow(10, decimals);
		return Math.max(min, Math.min(max, Math.round(n * factor) / factor));
	}

	function bump(direction: 1 | -1) {
		value = clamp(value + step * direction);
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

	function startEdit() {
		editing = true;
		editVal = value.toFixed(decimals);
		// Defer focus until the input mounts
		queueMicrotask(() => {
			inputEl?.focus();
			inputEl?.select();
		});
	}

	function commitEdit() {
		const n = Number(editVal);
		if (Number.isFinite(n)) value = clamp(n);
		editing = false;
	}

	function cancelEdit() {
		editing = false;
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Enter') commitEdit();
		if (e.key === 'Escape') cancelEdit();
	}

	const display = $derived(value.toFixed(decimals));
</script>

<div class="stepper" data-size={size} role="group" aria-label={ariaLabel}>
	<button
		class="btn"
		type="button"
		aria-label="Decrease"
		onpointerdown={() => startHold(-1)}
		onpointerup={endHold}
		onpointerleave={endHold}
		onpointercancel={endHold}
	>
		<Minus size={size === 'lg' ? 18 : 14} strokeWidth={2} />
	</button>

	<div class="value-slot">
		{#if editing}
			<input
				bind:this={inputEl}
				class="edit-input tnum"
				type="text"
				inputmode="decimal"
				bind:value={editVal}
				onblur={commitEdit}
				onkeydown={handleKey}
			/>
		{:else}
			<button class="value-btn tnum" type="button" onclick={startEdit} aria-label="Edit value">
				{display}
			</button>
		{/if}
	</div>

	<button
		class="btn"
		type="button"
		aria-label="Increase"
		onpointerdown={() => startHold(1)}
		onpointerup={endHold}
		onpointerleave={endHold}
		onpointercancel={endHold}
	>
		<Plus size={size === 'lg' ? 18 : 14} strokeWidth={2} />
	</button>
</div>

<style>
	.stepper {
		display: inline-grid;
		grid-template-columns: auto 1fr auto;
		align-items: stretch;
		background: var(--ember-tint-bg);
		border-radius: 999px;
		padding: 4px;
		gap: 4px;
		min-width: 120px;
	}

	.stepper[data-size='sm'] {
		min-width: 96px;
		padding: 3px;
	}

	.stepper[data-size='lg'] {
		min-width: 180px;
		padding: 6px;
	}

	.btn {
		all: unset;
		cursor: pointer;
		width: 32px;
		height: 32px;
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

	.stepper[data-size='sm'] .btn {
		width: 26px;
		height: 26px;
	}

	.stepper[data-size='lg'] .btn {
		width: 40px;
		height: 40px;
	}

	.btn:active {
		background: color-mix(in oklab, var(--color-ember) 14%, var(--color-bg-0));
		transform: scale(0.93);
	}

	.value-slot {
		display: grid;
		place-items: center;
		min-width: 0;
		padding: 0 8px;
	}

	.value-btn {
		all: unset;
		cursor: text;
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1, 'lnum' 1;
		font-variant-numeric: tabular-nums lining-nums;
		font-variation-settings: 'opsz' 36, 'SOFT' 70, 'wght' 470;
		font-size: 18px;
		letter-spacing: -0.02em;
		color: var(--color-text-primary);
		text-align: center;
		min-width: 1ch;
	}

	.stepper[data-size='lg'] .value-btn {
		font-size: 26px;
	}

	.edit-input {
		all: unset;
		font-family: var(--font-display);
		font-feature-settings: 'tnum' 1;
		font-variation-settings: 'opsz' 36, 'wght' 470;
		font-size: 18px;
		letter-spacing: -0.02em;
		color: var(--color-text-primary);
		text-align: center;
		width: 4ch;
		caret-color: var(--color-ember);
	}

	.stepper[data-size='lg'] .edit-input {
		font-size: 26px;
		width: 5ch;
	}
</style>

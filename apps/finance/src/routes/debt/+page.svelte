<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import DebtCard from '$lib/components/debt/DebtCard.svelte';
	import BottomSheet from '$lib/components/layout/BottomSheet.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { Plus, ChevronDown } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	import type { Debt } from '$lib/types';

	let { data } = $props();

	let showForm = $state(false);
	let editing = $state<Debt | null>(null);
	let confirmDelete = $state(false);
	let form = $state({
		direction: 'owe',
		counterparty: '',
		amount: '',
		due_date: '',
		paid: false,
		notes: ''
	});

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(n);

	const totalOwe = $derived(
		data.debts
			.filter((d: Debt) => d.direction === 'owe' && !d.paid)
			.reduce((s: number, d: Debt) => s + d.amount, 0)
	);
	const totalOwed = $derived(
		data.debts
			.filter((d: Debt) => d.direction === 'owed' && !d.paid)
			.reduce((s: number, d: Debt) => s + d.amount, 0)
	);
	const oweDebts = $derived(data.debts.filter((d: Debt) => d.direction === 'owe' && !d.paid));
	const owedDebts = $derived(data.debts.filter((d: Debt) => d.direction === 'owed' && !d.paid));
	const settledDebts = $derived(data.debts.filter((d: Debt) => d.paid));

	let showSettled = $state(false);
	let confirmClearSettled = $state(false);

	function openNew() {
		editing = null;
		confirmDelete = false;
		form = { direction: 'owe', counterparty: '', amount: '', due_date: '', paid: false, notes: '' };
		showForm = true;
	}

	function openEdit(debt: Debt) {
		editing = debt;
		confirmDelete = false;
		form = {
			direction: debt.direction,
			counterparty: debt.counterparty,
			amount: String(debt.amount),
			due_date: debt.dueDate ?? '',
			paid: debt.paid,
			notes: debt.notes ?? ''
		};
		showForm = true;
	}
</script>

<div class="pb-6">
	<div class="px-4 pt-4">
		<PageHeader title="Debt Tracker" user={data.user} displayName={data.settings.displayName}>
			{#snippet actions()}
				<button
					type="button"
					onclick={openNew}
					class="bg-debt flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white"
				>
					<Plus size={14} /> Add
				</button>
			{/snippet}
		</PageHeader>
	</div>

	<div class="mx-4 mb-4 grid grid-cols-2 gap-3">
		<div class="border-border bg-surface rounded-lg border px-4 py-3">
			<p class="text-neutral text-xs">I owe</p>
			<p class="text-expense mt-0.5 text-sm font-semibold tabular-nums">
				{fmt(totalOwe)}
			</p>
		</div>
		<div class="border-border bg-surface rounded-lg border px-4 py-3">
			<p class="text-neutral text-xs">Owed to me</p>
			<p class="text-income mt-0.5 text-sm font-semibold tabular-nums">
				{fmt(totalOwed)}
			</p>
		</div>
	</div>

	{#if oweDebts.length > 0}
		<p class="text-neutral mb-2 px-4 text-xs font-semibold tracking-widest uppercase">I Owe</p>
		<div class="mb-4 space-y-2 px-4">
			{#each oweDebts as debt (debt.id)}
				<DebtCard {debt} onEdit={openEdit} />
			{/each}
		</div>
	{/if}

	{#if owedDebts.length > 0}
		<p class="text-neutral mb-2 px-4 text-xs font-semibold tracking-widest uppercase">Owed to Me</p>
		<div class="mb-4 space-y-2 px-4">
			{#each owedDebts as debt (debt.id)}
				<DebtCard {debt} onEdit={openEdit} />
			{/each}
		</div>
	{/if}

	{#if data.debts.length === 0}
		<div class="border-border mx-4 rounded-xl border border-dashed p-8 text-center">
			<p class="text-neutral text-sm">No debts tracked. Tap "Add" to create one.</p>
		</div>
	{/if}

	{#if settledDebts.length > 0}
		<div class="px-4">
			<div class="flex items-center justify-between py-2">
				<button
					type="button"
					onclick={() => (showSettled = !showSettled)}
					class="text-neutral flex items-center gap-1 text-xs font-semibold tracking-widest uppercase"
				>
					Settled ({settledDebts.length})
					<ChevronDown
						size={14}
						class="transition-transform duration-200 {showSettled ? 'rotate-180' : ''}"
					/>
				</button>
				{#if !confirmClearSettled}
					<button
						type="button"
						onclick={() => (confirmClearSettled = true)}
						class="text-neutral hover:text-expense text-xs transition-colors"
					>
						Clear all
					</button>
				{:else}
					<div class="flex items-center gap-2">
						<span class="text-neutral text-xs">Remove {settledDebts.length} settled?</span>
						<form
							method="POST"
							action="?/clearSettled"
							use:enhance={() => {
								return async ({ update }) => {
									confirmClearSettled = false;
									showSettled = false;
									await update();
								};
							}}
						>
							<button type="submit" class="text-expense text-xs font-semibold hover:underline">
								Yes
							</button>
						</form>
						<button
							type="button"
							onclick={() => (confirmClearSettled = false)}
							class="text-neutral text-xs hover:underline"
						>
							Cancel
						</button>
					</div>
				{/if}
			</div>
			{#if showSettled}
				<div class="mt-2 space-y-2">
					{#each settledDebts as debt (debt.id)}
						<DebtCard {debt} onEdit={openEdit} />
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if showForm}
	<BottomSheet bind:open={showForm} title={editing ? 'Edit Debt' : 'New Debt'}>
		{#if confirmDelete}
			<div class="space-y-4 py-2">
				<div class="bg-surface-muted rounded-xl px-4 py-4 text-center">
					<p class="text-sm font-medium">Delete debt with "{editing?.counterparty}"?</p>
					<p class="text-neutral mt-1 text-xs">This can't be undone.</p>
				</div>
				<form
					method="POST"
					action="?/remove"
					use:enhance={() => {
						return async ({ update }) => {
							showForm = false;
							await update();
						};
					}}
				>
					<input type="hidden" name="id" value={editing?.id} />
					<button
						type="submit"
						class="bg-debt w-full rounded-lg py-3 text-sm font-semibold text-white"
					>
						Yes, delete
					</button>
				</form>
				<button
					type="button"
					onclick={() => (confirmDelete = false)}
					class="text-neutral w-full rounded-lg py-3 text-sm font-semibold"
				>
					Cancel
				</button>
			</div>
		{:else}
			<form
				method="POST"
				action="?/save"
				use:enhance={() => {
					return async ({ update }) => {
						showForm = false;
						await update();
					};
				}}
			>
				{#if editing}
					<input type="hidden" name="id" value={editing.id} />
				{/if}
				<input type="hidden" name="paid" value={String(form.paid)} />
				<div class="space-y-3">
					<div>
						<label for="dbt-direction" class="text-neutral mb-1 block text-xs font-medium"
							>Direction</label
						>
						<select id="dbt-direction" name="direction" bind:value={form.direction} class="input">
							<option value="owe">I owe them</option>
							<option value="owed">They owe me</option>
						</select>
					</div>
					<div>
						<label for="dbt-counterparty" class="text-neutral mb-1 block text-xs font-medium"
							>Person / entity</label
						>
						<input
							id="dbt-counterparty"
							name="counterparty"
							bind:value={form.counterparty}
							class="input"
							placeholder="e.g. Alex"
						/>
					</div>
					<div>
						<label for="dbt-amount" class="text-neutral mb-1 block text-xs font-medium"
							>Amount</label
						>
						<input
							id="dbt-amount"
							name="amount"
							bind:value={form.amount}
							type="number"
							step="0.01"
							class="input"
							placeholder="0.00"
						/>
					</div>
					<div>
						<label for="dbt-due" class="text-neutral mb-1 block text-xs font-medium"
							>Due date (optional)</label
						>
						<input
							id="dbt-due"
							name="due_date"
							bind:value={form.due_date}
							type="date"
							class="input"
						/>
					</div>
					<div>
						<label for="dbt-notes" class="text-neutral mb-1 block text-xs font-medium"
							>Notes (optional)</label
						>
						<input
							id="dbt-notes"
							name="notes"
							bind:value={form.notes}
							class="input"
							placeholder="e.g. dinner split"
						/>
					</div>
					<Toggle
						bind:checked={form.paid}
						label="Settled / paid"
						id="dbt-paid"
						color="var(--color-income)"
					/>
				</div>
				<button
					type="submit"
					class="bg-debt mt-5 w-full rounded-lg py-3 text-sm font-semibold text-white"
				>
					{editing ? 'Save Changes' : 'Create Debt'}
				</button>
				{#if editing}
					<button
						type="button"
						onclick={() => (confirmDelete = true)}
						class="text-debt mt-2 w-full rounded-lg py-3 text-sm font-semibold"
					>
						Delete Debt
					</button>
				{/if}
			</form>
		{/if}
	</BottomSheet>
{/if}

<style>
	.input {
		width: 100%;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		outline: none;
	}
	.input:focus {
		border-color: var(--color-debt);
	}
</style>

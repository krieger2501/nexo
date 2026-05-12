<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import BottomSheet from '$lib/components/layout/BottomSheet.svelte';
	import { Plus, Wallet, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { formatCurrency } from '$lib/utils';
	import type { Account, Expense, Debt } from '$lib/types';

	let { data } = $props();

	const fmt = formatCurrency;

	// ── Expense form ──────────────────────────────────────────────────────────
	let showExpenseForm = $state(false);
	let editingExpense = $state<Expense | null>(null);
	let confirmDeleteExpense = $state(false);
	let expenseForm = $state({
		name: '',
		amount: '',
		due_date: '',
		account_id: '',
		notes: ''
	});

	function openNewExpense() {
		editingExpense = null;
		confirmDeleteExpense = false;
		expenseForm = { name: '', amount: '', due_date: '', account_id: '', notes: '' };
		showExpenseForm = true;
	}

	function openEditExpense(expense: Expense) {
		editingExpense = expense;
		confirmDeleteExpense = false;
		expenseForm = {
			name: expense.name,
			amount: String(expense.amount),
			due_date: expense.dueDate ?? '',
			account_id: expense.accountId ?? '',
			notes: expense.notes ?? ''
		};
		showExpenseForm = true;
	}

	// ── Debt form ─────────────────────────────────────────────────────────────
	let showDebtForm = $state(false);
	let editingDebt = $state<Debt | null>(null);
	let confirmDeleteDebt = $state(false);
	let debtForm = $state({
		direction: 'owe',
		counterparty: '',
		amount: '',
		due_date: '',
		account_id: '',
		notes: ''
	});

	function openNewDebt() {
		editingDebt = null;
		confirmDeleteDebt = false;
		debtForm = {
			direction: 'owe',
			counterparty: '',
			amount: '',
			due_date: '',
			account_id: '',
			notes: ''
		};
		showDebtForm = true;
	}

	function openEditDebt(debt: Debt) {
		editingDebt = debt;
		confirmDeleteDebt = false;
		debtForm = {
			direction: debt.direction,
			counterparty: debt.counterparty,
			amount: String(debt.amount),
			due_date: debt.dueDate ?? '',
			account_id: (debt as Debt & { accountId?: string | null }).accountId ?? '',
			notes: debt.notes ?? ''
		};
		showDebtForm = true;
	}

	// ── Derived ───────────────────────────────────────────────────────────────
	const accountMap = $derived(new Map(data.accounts.map((a: Account) => [a.id, a])));

	const totalCommitted = $derived(
		data.expenses.reduce((s: number, e: Expense) => s + e.amount, 0) +
			data.debts
				.filter((d: Debt) => d.direction === 'owe')
				.reduce((s: number, d: Debt) => s + d.amount, 0)
	);

	const unallocatedExpenses = $derived(data.expenses.filter((e: Expense) => !e.accountId));
	const unallocatedDebts = $derived(
		data.debts.filter((d: Debt) => !(d as Debt & { accountId?: string | null }).accountId)
	);
</script>

<div class="pb-6">
	<div class="px-4 pt-4">
		<PageHeader title="Commitments" user={data.user} displayName={data.settings.displayName} />
	</div>

	<!-- Account allocation summary -->
	{#if data.accounts.length > 0}
		<div class="mb-4 px-4">
			<p class="text-neutral mb-2 text-xs font-semibold tracking-widest uppercase">
				Fund Allocation
			</p>
			<div class="space-y-2">
				{#each data.accounts as account (account.id)}
					{@const em = data.earmarks[account.id] ?? { earmarked: 0, available: account.balance }}
					<div class="border-border bg-surface rounded-lg border px-4 py-3">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								{#if account.color}
									<span class="h-2.5 w-2.5 rounded-full" style="background-color: {account.color};"
									></span>
								{:else}
									<Wallet size={14} class="text-neutral" />
								{/if}
								<p class="text-sm font-medium">{account.name}</p>
							</div>
							<p class="text-neutral text-xs">{fmt(account.balance)}</p>
						</div>
						{#if em.earmarked > 0}
							<div class="mt-2 space-y-1">
								<div class="flex justify-between text-xs">
									<span class="text-neutral">Earmarked</span>
									<span class="text-expense font-medium tabular-nums">{fmt(em.earmarked)}</span>
								</div>
								<div class="flex justify-between text-xs">
									<span class="text-neutral">Available</span>
									<span
										class="font-semibold tabular-nums {em.available < 0
											? 'text-expense'
											: 'text-income'}"
									>
										{fmt(em.available)}
									</span>
								</div>
								<div class="bg-surface-muted mt-1.5 h-1.5 overflow-hidden rounded-full">
									<div
										class="h-full rounded-full transition-all {em.available < 0
											? 'bg-expense'
											: 'bg-accent'}"
										style="width: {Math.min(100, (em.earmarked / account.balance) * 100)}%"
									></div>
								</div>
							</div>
						{:else}
							<p class="text-neutral mt-1 text-xs">Nothing earmarked</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- One-time expenses -->
	<div class="px-4">
		<div class="mb-2 flex items-center justify-between">
			<p class="text-neutral text-xs font-semibold tracking-widest uppercase">Upcoming Expenses</p>
			<button
				type="button"
				onclick={openNewExpense}
				class="bg-expense flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white"
			>
				<Plus size={12} /> Add
			</button>
		</div>

		{#if data.expenses.length === 0}
			<div class="border-border rounded-xl border border-dashed p-6 text-center">
				<p class="text-neutral text-sm">No upcoming one-time expenses.</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each data.expenses as expense (expense.id)}
					{@const acc = expense.accountId ? accountMap.get(expense.accountId) : null}
					<button
						type="button"
						onclick={() => openEditExpense(expense)}
						class="border-border bg-surface hover:border-expense/30 flex w-full items-center gap-3 rounded-lg border p-4 text-left shadow-sm transition-colors"
					>
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
							style="background-color: color-mix(in oklab, var(--color-expense) 12%, transparent); color: var(--color-expense);"
						>
							{expense.category.slice(0, 3).toUpperCase()}
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{expense.name}</p>
							<p class="text-neutral text-xs">
								{#if expense.dueDate}
									Due {new Date(expense.dueDate).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'short'
									})}
								{:else}
									No due date
								{/if}
								{#if acc}
									·
									<span class="font-medium" style="color: {acc.color ?? 'var(--color-accent)'}"
										>{acc.name}</span
									>
								{/if}
							</p>
						</div>
						<div class="flex items-center gap-1">
							<p class="text-expense text-sm font-semibold tabular-nums">{fmt(expense.amount)}</p>
							<ChevronRight size={14} class="text-neutral" />
						</div>
					</button>
				{/each}
			</div>
		{/if}

		{#if unallocatedExpenses.length > 0}
			<p class="text-neutral mt-2 text-xs">
				{unallocatedExpenses.length} expense{unallocatedExpenses.length === 1 ? '' : 's'} not linked to
				an account
			</p>
		{/if}
	</div>

	<!-- Debts -->
	<div class="mt-5 px-4">
		<div class="mb-2 flex items-center justify-between">
			<p class="text-neutral text-xs font-semibold tracking-widest uppercase">Open Debts</p>
			<button
				type="button"
				onclick={openNewDebt}
				class="bg-debt flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white"
			>
				<Plus size={12} /> Add
			</button>
		</div>

		{#if data.debts.length === 0}
			<div class="border-border rounded-xl border border-dashed p-6 text-center">
				<p class="text-neutral text-sm">No open debts.</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each data.debts as debt (debt.id)}
					{@const debtWithAcc = debt as Debt & { accountId?: string | null }}
					{@const acc = debtWithAcc.accountId ? accountMap.get(debtWithAcc.accountId) : null}
					<button
						type="button"
						onclick={() => openEditDebt(debt)}
						class="border-border bg-surface hover:border-debt/30 flex w-full items-center gap-3 rounded-lg border p-4 text-left shadow-sm transition-colors"
					>
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
							style="background-color: color-mix(in oklab, var(--color-debt) 12%, transparent); color: var(--color-debt);"
						>
							{#if debt.direction === 'owe'}
								<ArrowUpRight size={18} stroke-width={2} />
							{:else}
								<ArrowDownLeft size={18} stroke-width={2} />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{debt.counterparty}</p>
							<p class="text-neutral text-xs">
								{debt.direction === 'owe' ? 'I owe' : 'Owed to me'}
								{#if debt.dueDate}
									· due {new Date(debt.dueDate).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'short'
									})}
								{/if}
								{#if acc}
									·
									<span class="font-medium" style="color: {acc.color ?? 'var(--color-accent)'}"
										>{acc.name}</span
									>
								{/if}
							</p>
						</div>
						<div class="flex items-center gap-1">
							<p class="text-sm font-semibold tabular-nums" style="color: var(--color-debt);">
								{fmt(debt.amount)}
							</p>
							<ChevronRight size={14} class="text-neutral" />
						</div>
					</button>
				{/each}
			</div>
		{/if}

		{#if unallocatedDebts.length > 0}
			<p class="text-neutral mt-2 text-xs">
				{unallocatedDebts.length} debt{unallocatedDebts.length === 1 ? '' : 's'} not linked to an account
			</p>
		{/if}
	</div>

	<!-- Total -->
	{#if totalCommitted > 0}
		<div class="border-border bg-surface mx-4 mt-5 rounded-lg border px-4 py-3">
			<div class="flex items-center justify-between">
				<p class="text-neutral text-sm">Total committed</p>
				<p class="text-expense text-sm font-semibold tabular-nums">{fmt(totalCommitted)}</p>
			</div>
		</div>
	{/if}
</div>

<!-- Expense form sheet -->
{#if showExpenseForm}
	<BottomSheet bind:open={showExpenseForm} title={editingExpense ? 'Edit Expense' : 'New Expense'}>
		{#if confirmDeleteExpense}
			<div class="space-y-4 py-2">
				<div class="bg-surface-muted rounded-xl px-4 py-4 text-center">
					<p class="text-sm font-medium">Delete "{editingExpense?.name}"?</p>
					<p class="text-neutral mt-1 text-xs">This can't be undone.</p>
				</div>
				<form
					method="POST"
					action="?/removeExpense"
					use:enhance={() => {
						return async ({ update }) => {
							showExpenseForm = false;
							await update();
						};
					}}
				>
					<input type="hidden" name="id" value={editingExpense?.id} />
					<button
						type="submit"
						class="bg-expense w-full rounded-lg py-3 text-sm font-semibold text-white"
					>
						Yes, delete
					</button>
				</form>
				<button
					type="button"
					onclick={() => (confirmDeleteExpense = false)}
					class="text-neutral w-full rounded-lg py-3 text-sm font-semibold"
				>
					Cancel
				</button>
			</div>
		{:else}
			<form
				method="POST"
				action="?/saveExpense"
				use:enhance={() => {
					return async ({ update }) => {
						showExpenseForm = false;
						await update();
					};
				}}
			>
				{#if editingExpense}
					<input type="hidden" name="id" value={editingExpense.id} />
				{/if}
				<div class="space-y-3">
					<div>
						<label for="exp-name" class="text-neutral mb-1 block text-xs font-medium">Name</label>
						<input
							id="exp-name"
							name="name"
							bind:value={expenseForm.name}
							class="input"
							placeholder="e.g. New laptop"
						/>
					</div>
					<div>
						<label for="exp-amount" class="text-neutral mb-1 block text-xs font-medium"
							>Amount</label
						>
						<input
							id="exp-amount"
							name="amount"
							bind:value={expenseForm.amount}
							type="number"
							step="0.01"
							class="input"
							placeholder="0.00"
						/>
					</div>
					<div>
						<label for="exp-due" class="text-neutral mb-1 block text-xs font-medium">
							Due date (optional)
						</label>
						<input
							id="exp-due"
							name="due_date"
							bind:value={expenseForm.due_date}
							type="date"
							class="input"
						/>
					</div>
					<div>
						<label for="exp-account" class="text-neutral mb-1 block text-xs font-medium">
							Account (optional)
						</label>
						<select
							id="exp-account"
							name="account_id"
							bind:value={expenseForm.account_id}
							class="input"
						>
							<option value="">— unallocated —</option>
							{#each data.accounts as acc (acc.id)}
								<option value={acc.id}>{acc.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="exp-notes" class="text-neutral mb-1 block text-xs font-medium">
							Notes (optional)
						</label>
						<input
							id="exp-notes"
							name="notes"
							bind:value={expenseForm.notes}
							class="input"
							placeholder="e.g. birthday gift"
						/>
					</div>
				</div>
				<button
					type="submit"
					class="bg-expense mt-5 w-full rounded-lg py-3 text-sm font-semibold text-white"
				>
					{editingExpense ? 'Save Changes' : 'Create Expense'}
				</button>
				{#if editingExpense}
					<button
						type="button"
						onclick={() => (confirmDeleteExpense = true)}
						class="text-expense mt-2 w-full rounded-lg py-3 text-sm font-semibold"
					>
						Delete Expense
					</button>
				{/if}
			</form>
		{/if}
	</BottomSheet>
{/if}

<!-- Debt form sheet -->
{#if showDebtForm}
	<BottomSheet bind:open={showDebtForm} title={editingDebt ? 'Edit Debt' : 'New Debt'}>
		{#if confirmDeleteDebt}
			<div class="space-y-4 py-2">
				<div class="bg-surface-muted rounded-xl px-4 py-4 text-center">
					<p class="text-sm font-medium">Delete debt with "{editingDebt?.counterparty}"?</p>
					<p class="text-neutral mt-1 text-xs">This can't be undone.</p>
				</div>
				<form
					method="POST"
					action="?/removeDebt"
					use:enhance={() => {
						return async ({ update }) => {
							showDebtForm = false;
							await update();
						};
					}}
				>
					<input type="hidden" name="id" value={editingDebt?.id} />
					<button
						type="submit"
						class="bg-debt w-full rounded-lg py-3 text-sm font-semibold text-white"
					>
						Yes, delete
					</button>
				</form>
				<button
					type="button"
					onclick={() => (confirmDeleteDebt = false)}
					class="text-neutral w-full rounded-lg py-3 text-sm font-semibold"
				>
					Cancel
				</button>
			</div>
		{:else}
			<form
				method="POST"
				action="?/saveDebt"
				use:enhance={() => {
					return async ({ update }) => {
						showDebtForm = false;
						await update();
					};
				}}
			>
				{#if editingDebt}
					<input type="hidden" name="id" value={editingDebt.id} />
				{/if}
				<div class="space-y-3">
					<div>
						<label for="dbt-direction" class="text-neutral mb-1 block text-xs font-medium"
							>Direction</label
						>
						<select
							id="dbt-direction"
							name="direction"
							bind:value={debtForm.direction}
							class="input"
						>
							<option value="owe">I owe them</option>
							<option value="owed">They owe me</option>
						</select>
					</div>
					<div>
						<label for="dbt-counterparty" class="text-neutral mb-1 block text-xs font-medium">
							Person / entity
						</label>
						<input
							id="dbt-counterparty"
							name="counterparty"
							bind:value={debtForm.counterparty}
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
							bind:value={debtForm.amount}
							type="number"
							step="0.01"
							class="input"
							placeholder="0.00"
						/>
					</div>
					<div>
						<label for="dbt-due" class="text-neutral mb-1 block text-xs font-medium">
							Due date (optional)
						</label>
						<input
							id="dbt-due"
							name="due_date"
							bind:value={debtForm.due_date}
							type="date"
							class="input"
						/>
					</div>
					<div>
						<label for="dbt-account" class="text-neutral mb-1 block text-xs font-medium">
							Account (optional)
						</label>
						<select
							id="dbt-account"
							name="account_id"
							bind:value={debtForm.account_id}
							class="input"
						>
							<option value="">— unallocated —</option>
							{#each data.accounts as acc (acc.id)}
								<option value={acc.id}>{acc.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="dbt-notes" class="text-neutral mb-1 block text-xs font-medium">
							Notes (optional)
						</label>
						<input
							id="dbt-notes"
							name="notes"
							bind:value={debtForm.notes}
							class="input"
							placeholder="e.g. dinner split"
						/>
					</div>
				</div>
				<button
					type="submit"
					class="bg-debt mt-5 w-full rounded-lg py-3 text-sm font-semibold text-white"
				>
					{editingDebt ? 'Save Changes' : 'Create Debt'}
				</button>
				{#if editingDebt}
					<div class="mt-2 grid grid-cols-2 gap-2">
						<button
							type="submit"
							form="mark-debt-paid-form"
							class="bg-income rounded-lg py-3 text-sm font-semibold text-white"
						>
							Mark Paid
						</button>
						<button
							type="button"
							onclick={() => (confirmDeleteDebt = true)}
							class="text-debt rounded-lg py-3 text-sm font-semibold"
						>
							Delete
						</button>
					</div>
				{/if}
			</form>
		{/if}
	</BottomSheet>
{/if}

<!-- Hidden form for markDebtPaid — must live outside BottomSheet to avoid nested <form> -->
<form
	id="mark-debt-paid-form"
	method="POST"
	action="?/markDebtPaid"
	class="hidden"
	use:enhance={() => {
		return async ({ update }) => {
			showDebtForm = false;
			await update();
		};
	}}
>
	<input type="hidden" name="id" value={editingDebt?.id} />
</form>

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
		border-color: var(--color-accent);
	}
</style>

<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import { formatCurrency, normalizeToMonthly } from '$lib/utils';

	const CATEGORY_ICONS: Record<string, string> = {
		housing: '🏠',
		utilities: '⚡',
		subscription: '🔄',
		insurance: '🛡️',
		food: '🍽️',
		transport: '🚌',
		other: '📌'
	};

	const BREAKDOWN_LABEL: Record<string, string> = {
		weekly: '× 52 weeks ÷ 12',
		biweekly: '× 26 fortnights ÷ 12',
		quarterly: '÷ 3 months',
		'half-yearly': '÷ 6 months',
		yearly: '÷ 12 months'
	};

	type Expense = {
		id: string;
		name: string;
		category: string;
		amount: number;
		recurrence: string;
		due_date: string | null;
		active: boolean;
	};
	let {
		expense,
		once = false,
		onEdit
	}: { expense: Expense; once?: boolean; onEdit?: (e: Expense) => void } = $props();

	const isPaid = $derived(once && !expense.active);
	const fmt = (n: number) => formatCurrency(n);

	const showMonthly = $derived(
		!once && !['monthly', 'once'].includes(expense.recurrence)
	);
	const monthlyEquiv = $derived(normalizeToMonthly(expense.amount, expense.recurrence));

	let breakdownOpen = $state(false);
</script>

<button
	type="button"
	onclick={() => onEdit?.(expense)}
	class="flex w-full items-center gap-3 rounded-lg border bg-surface p-4 text-left shadow-sm transition-colors
	       {once
		? 'border-dashed border-border hover:border-expense/40'
		: 'border-border hover:border-expense/30'}
	       {isPaid ? 'opacity-60' : ''}"
>
	<div
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg"
		style="background-color: var(--color-expense)18;"
	>
		{once ? (isPaid ? '✅' : '🗓️') : (CATEGORY_ICONS[expense.category] ?? '📌')}
	</div>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium {isPaid ? 'line-through' : ''}">{expense.name}</p>
		<p class="text-xs text-neutral capitalize">
			{#if once}
				{#if expense.due_date}
					due {new Date(expense.due_date).toLocaleDateString('en-GB', {
						day: 'numeric',
						month: 'short'
					})}
				{:else}
					one-time
				{/if}
				{#if isPaid}<span class="text-income"> · paid</span>{/if}
			{:else}
				{expense.category} · {expense.recurrence}
				{#if !expense.active}<span> · paused</span>{/if}
			{/if}
		</p>
	</div>
	<div class="flex items-center gap-1">
		<div class="text-right">
			<p class="text-sm font-semibold text-expense tabular-nums">
				{fmt(expense.amount)}
			</p>
			{#if showMonthly}
				<button
					type="button"
					onclick={(e) => { e.stopPropagation(); breakdownOpen = !breakdownOpen; }}
					class="text-[10px] tabular-nums text-neutral hover:text-expense transition-colors"
				>
					{fmt(monthlyEquiv)}/mo
				</button>
			{/if}
		</div>
		<ChevronRight size={14} class="text-neutral" />
	</div>
</button>

{#if breakdownOpen}
	<div class="mx-1 -mt-1 rounded-b-lg border border-t-0 border-border bg-surface-muted px-4 py-3">
		<p class="text-[11px] font-semibold tracking-wider text-neutral uppercase mb-2">Monthly breakdown</p>
		<div class="flex items-center justify-between text-xs">
			<span class="text-neutral">{fmt(expense.amount)} {BREAKDOWN_LABEL[expense.recurrence]}</span>
			<span class="font-semibold tabular-nums text-expense">= {fmt(monthlyEquiv)}/mo</span>
		</div>
	</div>
{/if}

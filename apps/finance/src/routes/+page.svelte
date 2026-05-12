<script lang="ts">
	import LiquidSummaryCard from '$lib/components/dashboard/LiquidSummaryCard.svelte';
	import AccountCard from '$lib/components/dashboard/AccountCard.svelte';
	import UpcomingEvents from '$lib/components/dashboard/UpcomingEvents.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';

	let { data } = $props();
</script>

<div class="space-y-4 px-4 pt-4 pb-6">
	<PageHeader
		title="Overview"
		subtitle="Buffer"
		user={data.user}
		displayName={data.settings.displayName}
	/>

	<LiquidSummaryCard
		accounts={data.accounts}
		monthlyExpenses={data.monthlyExpenses}
		monthlyIncome={data.monthlyIncome}
		currency={data.settings.currency}
	/>

	{#if data.accounts.length > 0}
		<section>
			<p class="text-neutral mb-2 text-xs font-semibold tracking-widest uppercase">Accounts</p>
			<div class="space-y-2">
				{#each data.accounts as account (account.id)}
					<a href="/accounts" class="block">
						<AccountCard {account} currency={data.settings.currency} />
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<UpcomingEvents events={data.upcoming} />

	{#if data.accounts.length === 0}
		<div class="border-border rounded-xl border border-dashed p-8 text-center">
			<p class="text-neutral text-sm font-medium">No accounts yet</p>
			<p class="text-neutral mt-1 text-xs">
				<a href="/accounts" class="text-primary-500 underline-offset-2 hover:underline">
					Add your first account
				</a>
				to get started.
			</p>
		</div>
	{/if}
</div>

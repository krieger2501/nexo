<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { data, form } = $props();

	const currencies = [
		{ code: 'EUR', label: '€ Euro' },
		{ code: 'USD', label: '$ US Dollar' },
		{ code: 'GBP', label: '£ British Pound' },
		{ code: 'CHF', label: 'Fr. Swiss Franc' },
		{ code: 'JPY', label: '¥ Japanese Yen' },
		{ code: 'CAD', label: '$ Canadian Dollar' },
		{ code: 'AUD', label: '$ Australian Dollar' }
	];
</script>

<div class="px-4 pt-4 pb-6">
	<PageHeader title="Settings" user={data.user} displayName={data.settings.displayName} />

	<form method="POST" action="?/save" use:enhance class="flex flex-col gap-4">
		<Card>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="displayName" class="text-sm font-medium">Display name</label>
					<input
						id="displayName"
						name="displayName"
						type="text"
						value={data.displayName}
						placeholder="Your name"
						class="border-border bg-surface focus:ring-primary-500/40 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2"
					/>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Preferences</CardTitle>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="currency" class="text-sm font-medium">Currency</label>
					<select
						id="currency"
						name="currency"
						class="border-border bg-surface focus:ring-primary-500/40 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2"
					>
						{#each currencies as c (c.code)}
							<option value={c.code} selected={data.currency === c.code}>{c.label}</option>
						{/each}
					</select>
				</div>

				<div class="flex flex-col gap-1.5">
					<label for="weekStartDay" class="text-sm font-medium">Week starts on</label>
					<select
						id="weekStartDay"
						name="weekStartDay"
						class="border-border bg-surface focus:ring-primary-500/40 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2"
					>
						<option value="monday" selected={data.weekStartDay === 'monday'}>Monday</option>
						<option value="sunday" selected={data.weekStartDay === 'sunday'}>Sunday</option>
					</select>
				</div>
			</CardContent>
		</Card>

		{#if form?.error}
			<p class="text-expense text-sm">{form.error}</p>
		{/if}

		{#if form?.success}
			<p class="text-income text-sm">Settings saved.</p>
		{/if}

		<button
			type="submit"
			class="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 h-10 w-full rounded-xl text-sm font-semibold text-white transition-colors"
		>
			Save
		</button>
	</form>
</div>

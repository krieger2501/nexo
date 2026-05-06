<script lang="ts">
	type Tab = { id: string; label: string; count?: number };

	let {
		tabs,
		active,
		onchange
	}: {
		tabs: Tab[];
		active: string;
		onchange?: (id: string) => void;
	} = $props();
</script>

<div class="flex min-h-11 items-stretch rounded-full border border-border bg-surface-muted p-1">
	{#each tabs as tab (tab.id)}
		<button
			type="button"
			onclick={() => onchange?.(tab.id)}
			class="flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors
			       {active === tab.id
				? 'bg-surface font-semibold shadow-sm'
				: 'hover:text-foreground text-neutral'}"
		>
			{tab.label}
			{#if tab.count !== undefined}
				<span class="text-xs {active === tab.id ? 'opacity-70' : 'opacity-50'}">{tab.count}</span>
			{/if}
		</button>
	{/each}
</div>

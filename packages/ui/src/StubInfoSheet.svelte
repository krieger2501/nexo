<script lang="ts">
	import type { Snippet } from 'svelte';
	import BottomSheet from './BottomSheet.svelte';

	let {
		open = $bindable(false),
		title,
		subtitle,
		stubNotice,
		closeLabel = 'Close',
		children
	}: {
		open?: boolean;
		title: string;
		subtitle?: string;
		stubNotice?: string;
		closeLabel?: string;
		children?: Snippet;
	} = $props();
</script>

<BottomSheet
	bind:open
	{title}
	actions={[{ label: closeLabel, variant: 'secondary', onclick: () => (open = false) }]}
>
	{#if subtitle}
		<p class="sub">{subtitle}</p>
	{/if}
	{#if children}
		<div class="info">{@render children()}</div>
	{/if}
	{#if stubNotice}
		<div class="stub-notice">{stubNotice}</div>
	{/if}
</BottomSheet>

<style>
	.sub {
		font-size: 13.5px;
		color: var(--color-text-subtle);
		line-height: 1.5;
		margin: 0 0 4px;
	}

	.info {
		margin-top: 14px;
		padding: 12px 14px;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-md);
		font-size: 13px;
		line-height: 1.55;
		color: var(--color-text-primary);
	}

	.stub-notice {
		font-size: 12px;
		color: var(--color-text-subtle);
		background: var(--color-bg-1);
		padding: 10px 12px;
		border-radius: var(--radius-sm, 8px);
		margin-top: 12px;
		line-height: 1.4;
	}
</style>

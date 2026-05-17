<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="set-card">
	{@render children()}
</div>

<style>
	.set-card {
		background: var(--color-surface-1, #fff);
		border: 1px solid var(--color-border-default, #e5e5e5);
		border-radius: var(--radius-xl, 20px);
		overflow: hidden;
	}
</style>

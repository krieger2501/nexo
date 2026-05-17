<script lang="ts">
	let {
		title,
		description
	}: {
		title: string;
		description?: string;
	} = $props();
</script>

<div class="set-scope">
	<b>{title}</b>{#if description}
		· {description}{/if}
</div>

<style>
	.set-scope {
		padding: 14px 20px 6px;
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0.01em;
		color: var(--color-text-subtle, #71717a);
	}
	.set-scope b,
	.set-scope :global(b) {
		font-weight: 600;
		color: var(--color-text-primary, #18181b);
	}
</style>

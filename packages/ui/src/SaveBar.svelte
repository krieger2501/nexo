<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		visible,
		hint = 'Unsaved changes',
		label = 'Save',
		formId
	}: {
		visible: boolean;
		hint?: string;
		label?: string;
		formId?: string;
	} = $props();
</script>

<div class="save-bar" class:visible>
	<div class="save-bar-inner">
		<span class="save-bar-hint">{hint}</span>
		{#if formId}
			<button type="submit" form={formId} class="save-bar-btn">{label}</button>
		{:else}
			<button type="submit" class="save-bar-btn">{label}</button>
		{/if}
	</div>
</div>

<style>
	.save-bar {
		position: fixed;
		bottom: calc(var(--tab-h, 0px) + env(safe-area-inset-bottom, 0px) + 16px);
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: var(--max-w, 448px);
		padding: 0 16px;
		z-index: 30;
		pointer-events: none;
		opacity: 0;
		translate: 0 12px;
		transition:
			opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
			translate 240ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.save-bar.visible {
		opacity: 1;
		translate: 0 0;
		pointer-events: auto;
	}
	.save-bar-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px 10px 16px;
		background: var(--color-text-primary, #18181b);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-lg, 16px);
		box-shadow: 0 4px 24px -4px rgb(0 0 0 / 0.18);
	}
	.save-bar-hint {
		font-size: 13px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
	}
	.save-bar-btn {
		padding: 10px 20px;
		font: inherit;
		font-size: 14px;
		font-weight: 600;
		border-radius: var(--radius-md, 12px);
		border: none;
		background: #fff;
		color: var(--color-text-primary, #18181b);
		cursor: pointer;
		flex-shrink: 0;
		transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.save-bar-btn:active {
		opacity: 0.85;
	}
</style>

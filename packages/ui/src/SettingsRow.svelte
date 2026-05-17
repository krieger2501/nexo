<script lang="ts">
	let {
		icon,
		label,
		description,
		value,
		stub = false,
		danger = false,
		onclick
	}: {
		icon?: string;
		label: string;
		description?: string;
		value?: string;
		stub?: boolean;
		danger?: boolean;
		onclick?: () => void;
	} = $props();
</script>

<button type="button" class="set-row" class:stub-row={stub} class:danger-row={danger} {onclick}>
	{#if icon}
		<div class="sr-icon">{icon}</div>
	{/if}
	<div class="sr-text">
		<div class="sr-label">{label}</div>
		{#if description}
			<div class="sr-desc">{description}</div>
		{/if}
	</div>
	{#if value}
		<div class="sr-value" class:stub-value={stub}>{value}</div>
	{/if}
	<span class="sr-chev">
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-linecap="round"
			stroke-linejoin="round"><path d="m9 6 6 6-6 6" /></svg
		>
	</span>
</button>

<style>
	.set-row {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 14px 16px 14px 20px;
		background: none;
		border: none;
		border-top: 1px solid var(--color-border-subtle, #f0f0f0);
		cursor: pointer;
		text-align: left;
		font: inherit;
		color: var(--color-text-primary, #18181b);
		transition: background 150ms;
	}
	.set-row:first-child {
		border-top: none;
	}
	.set-row:active {
		background: var(--color-bg-1, #fafafa);
	}
	.set-row.stub-row {
		opacity: 0.55;
	}
	.set-row.danger-row {
		color: var(--color-expense, #dc2626);
	}
	.sr-icon {
		flex-shrink: 0;
		width: 24px;
		text-align: center;
		font-size: 16px;
	}
	.sr-text {
		flex: 1;
		min-width: 0;
	}
	.sr-label {
		font-size: 14px;
		font-weight: 500;
		line-height: 1.3;
	}
	.sr-desc {
		font-size: 12px;
		color: var(--color-text-muted, #a1a1aa);
		line-height: 1.4;
		margin-top: 1px;
	}
	.sr-value {
		flex-shrink: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-subtle, #71717a);
		max-width: 140px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sr-value.stub-value {
		opacity: 0.6;
	}
	.sr-chev {
		flex-shrink: 0;
		width: 16px;
		height: 16px;
		color: var(--color-text-faint, #d4d4d8);
	}
	.sr-chev svg {
		width: 100%;
		height: 100%;
		stroke-width: 1.8;
	}
</style>

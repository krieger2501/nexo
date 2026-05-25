<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import AuthShell from '$lib/components/AuthShell.svelte';
</script>

<svelte:head>
	<title>{m.not_authorized_title()}</title>
</svelte:head>

<AuthShell
	mood="denied"
	eyebrow="not on the list"
	heading={m.not_authorized_heading()}
	sub={m.not_authorized_sub()}
>
	<a href="/login" class="back-link">
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" class="back-icon">
			<path d="M10 3L5 8l5 5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
		<span>{m.not_authorized_back()}</span>
	</a>
</AuthShell>

<style>
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		align-self: flex-start;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-default);
		background: var(--color-bg-0);
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-primary);
		text-decoration: none;
		transition:
			background var(--duration-fast) var(--ease-out),
			border-color var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
	}

	.back-link:hover {
		background: var(--color-bg-1);
		border-color: var(--color-border-strong);
		transform: translateY(-1px);
	}

	.back-icon {
		width: 14px;
		height: 14px;
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.back-link:hover .back-icon {
		transform: translateX(-2px);
	}
</style>

<script lang="ts">
	import { page } from '$app/state';
	import { userMessage } from '@nexo/errors';

	const code = $derived(page.error?.code ?? null);
	const msg = $derived(code ? userMessage(code) : (page.error?.message ?? 'Something went wrong'));
	const correlationId = $derived(page.error?.correlationId ?? null);

	let copied = $state(false);
	async function copyId() {
		if (!correlationId) return;
		await navigator.clipboard.writeText(correlationId);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="error-page">
	<p class="error-status">{page.status}</p>
	<p class="error-msg">{msg}</p>

	{#if correlationId}
		<div class="error-ref">
			<span>Ref:</span>
			<code class="error-ref-id">{correlationId}</code>
			<button type="button" class="error-ref-copy" onclick={copyId}>
				{copied ? 'Copied!' : 'Copy'}
			</button>
		</div>
	{/if}

	<a href="/" class="error-home">Go home</a>
</div>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 24px;
		text-align: center;
	}

	.error-status {
		font-size: 48px;
		font-weight: 700;
		color: var(--color-text-subtle);
		margin: 0;
	}

	.error-msg {
		margin-top: 12px;
		font-size: 16px;
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.error-ref {
		margin-top: 16px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.error-ref-id {
		font-family: var(--font-mono);
		font-size: 12px;
		background: var(--color-surface-1);
		border-radius: var(--radius-sm);
		padding: 2px 8px;
	}

	.error-ref-copy {
		font-size: 12px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		border: 0;
		background: transparent;
		color: var(--accent-ink);
		cursor: pointer;
	}

	.error-ref-copy:hover {
		background: var(--color-surface-1);
	}

	.error-home {
		margin-top: 28px;
		padding: 10px 20px;
		font-size: 14px;
		font-weight: 500;
		border-radius: var(--radius-md);
		background: var(--color-accent);
		color: #fff;
		text-decoration: none;
	}
</style>

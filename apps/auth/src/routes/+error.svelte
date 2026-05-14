<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Error — Nexo</title>
</svelte:head>

<main class="error-root">
	<div class="error-card">
		<div class="error-code">{page.status}</div>
		<h1 class="error-heading">
			{#if page.status === 404}
				Page not found
			{:else}
				Something went wrong
			{/if}
		</h1>
		<p class="error-sub">
			{#if page.status === 404}
				Whatever you're looking for, it's not here.
			{:else}
				That wasn't supposed to happen. Try again or go back.
			{/if}
		</p>
		<a href="/login" class="error-link">Back to sign in</a>
	</div>
</main>

<style>
	.error-root {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px 16px;
		background: var(--color-bg-0);
	}

	.error-card {
		text-align: center;
		max-width: 320px;
	}

	.error-code {
		font-family: var(--font-mono);
		font-size: 48px;
		font-weight: 700;
		color: var(--color-text-faint);
		letter-spacing: -0.04em;
	}

	.error-heading {
		font-size: 18px;
		font-weight: 600;
		margin: 8px 0 6px;
		color: var(--color-text-primary);
	}

	.error-sub {
		font-size: 13px;
		color: var(--color-text-muted);
		line-height: 1.5;
		margin: 0 0 20px;
	}

	.error-link {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-accent);
		text-decoration: none;
	}

	.error-link:hover {
		text-decoration: underline;
	}
</style>

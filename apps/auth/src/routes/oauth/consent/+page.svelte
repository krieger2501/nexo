<script lang="ts">
	import { onMount } from 'svelte';

	// For this private suite there are no third-party clients, so we
	// auto-accept consent on mount and redirect back immediately.
	// Wire up a real consent UI here if you ever open the OAuth server
	// to external apps.
	onMount(async () => {
		const res = await fetch('/api/auth/oauth2/consent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ accept: true }),
			credentials: 'include'
		});

		if (res.ok) {
			const { redirectURI } = await res.json().catch(() => ({}));
			if (redirectURI) {
				window.location.href = redirectURI;
				return;
			}
		}

		// Fallback — shouldn't happen in normal flow
		window.location.href = '/';
	});
</script>

<svelte:head>
	<title>Authorizing — Nexo</title>
</svelte:head>

<main class="login-root">
	<div class="login-card">
		<div class="brand">
			<span class="brand-mark"></span>
			<span class="brand-name">Nexo</span>
		</div>
		<p class="sub">Authorizing…</p>
	</div>
</main>

<style>
	.login-root {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px 16px;
		background: var(--color-bg-0);
	}
	.login-card {
		width: 100%;
		max-width: 360px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-xl);
		padding: 36px 32px 28px;
		box-shadow: 0 8px 40px -12px rgb(0 0 0 / 0.08);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 20px;
	}
	.brand-mark {
		display: block;
		width: 22px;
		height: 22px;
		border-radius: 6px;
		background: linear-gradient(
			135deg,
			var(--color-accent),
			color-mix(in oklab, var(--color-accent) 50%, #000)
		);
		position: relative;
	}
	.brand-mark::after {
		content: '';
		position: absolute;
		inset: 4px;
		border-radius: 3px;
		background: linear-gradient(135deg, rgb(255 255 255 / 0.24), transparent 60%);
	}
	.brand-name {
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-text-primary);
	}
	.sub {
		font-size: 13px;
		color: var(--color-text-muted);
		margin: 0;
	}
</style>

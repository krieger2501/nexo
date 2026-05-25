<script lang="ts">
	import type { Snippet } from 'svelte';

	type Mood = 'welcome' | 'returning' | 'denied' | 'error';

	let {
		mood = 'welcome',
		eyebrow,
		heading,
		sub,
		children,
		footer
	}: {
		mood?: Mood;
		eyebrow: string;
		heading: string;
		sub: string;
		children: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<main class="auth-root" data-mood={mood}>
	<div class="auth-bg" aria-hidden="true"></div>

	<section class="auth-card">
		<div class="auth-brand">
			<img src="/favicon.svg" alt="" class="auth-brand-mark" />
			<span class="auth-brand-name">Nexo</span>
		</div>

		<div class="auth-eyebrow" data-mood={mood}>
			<span class="auth-eyebrow-dot" aria-hidden="true"></span>
			{eyebrow}
		</div>

		<h1 class="auth-heading">{heading}</h1>
		<p class="auth-sub">{sub}</p>

		<div class="auth-body">
			{@render children()}
		</div>

		{#if footer}
			<div class="auth-foot">{@render footer()}</div>
		{/if}
	</section>
</main>

<style>
	.auth-root {
		position: relative;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px 16px;
		background: var(--color-bg-0);
		isolation: isolate;
		overflow: hidden;
	}

	/* Soft dot-grid + radial accent wash, mirroring the landing hero */
	.auth-bg {
		position: absolute;
		inset: 0;
		z-index: -1;
		background:
			radial-gradient(
				ellipse 70% 55% at 50% -10%,
				color-mix(in oklab, var(--mood-accent, var(--color-accent)) 16%, transparent),
				transparent 60%
			),
			linear-gradient(to right, rgb(10 10 10 / 0.04) 1px, transparent 1px) 0 0 / 56px 56px,
			linear-gradient(to bottom, rgb(10 10 10 / 0.04) 1px, transparent 1px) 0 0 / 56px 56px,
			var(--color-bg-0);
		mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, #000 0%, #000 45%, transparent 100%);
	}

	/* Per-mood accent — drives both bg wash and eyebrow dot */
	.auth-root[data-mood='welcome'] {
		--mood-accent: var(--color-accent);
	}
	.auth-root[data-mood='returning'] {
		--mood-accent: var(--color-accent);
	}
	.auth-root[data-mood='denied'] {
		--mood-accent: #f59e0b;
	}
	.auth-root[data-mood='error'] {
		--mood-accent: #ef4444;
	}

	.auth-card {
		width: 100%;
		max-width: 380px;
		padding: 32px 32px 26px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-xl);
		box-shadow:
			0 1px 0 rgb(255 255 255 / 0.6) inset,
			0 12px 40px -16px rgb(10 10 10 / 0.12),
			0 4px 12px -6px rgb(10 10 10 / 0.06);
		animation: card-in 600ms var(--ease-out) both;
	}

	@keyframes card-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.auth-brand {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 24px;
	}

	.auth-brand-mark {
		width: 22px;
		height: 22px;
		display: block;
	}

	.auth-brand-name {
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-text-primary);
	}

	/* Pulsing-dot eyebrow pill — Nexo signature */
	.auth-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 5px 11px;
		margin-bottom: 14px;
		background: var(--color-bg-0);
		border: 1px solid var(--color-border-default);
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.auth-eyebrow-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--mood-accent, var(--color-accent));
		flex-shrink: 0;
		animation: dot-pulse 2.4s var(--ease-in-out) infinite;
	}

	@keyframes dot-pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.45;
			transform: scale(0.75);
		}
	}

	/* Gradient ink headline, same treatment as landing hero */
	.auth-heading {
		margin: 0 0 8px;
		font-size: clamp(28px, 4.6vw, 34px);
		line-height: 1.05;
		letter-spacing: -0.025em;
		font-weight: 600;
		background: linear-gradient(
			175deg,
			var(--color-text-primary) 0%,
			color-mix(in oklab, var(--color-text-primary) 55%, var(--color-bg-0)) 100%
		);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
	}

	.auth-sub {
		margin: 0 0 22px;
		font-size: 14px;
		line-height: 1.55;
		color: var(--color-text-muted);
	}

	.auth-body {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.auth-foot {
		margin-top: 18px;
		padding-top: 16px;
		border-top: 1px solid var(--color-border-subtle);
		font-size: 12px;
		line-height: 1.5;
		color: var(--color-text-faint);
		text-align: center;
	}

	/* Staggered reveal */
	.auth-eyebrow,
	.auth-heading,
	.auth-sub,
	.auth-body,
	.auth-foot {
		opacity: 0;
		animation: rise 600ms var(--ease-out) both;
	}
	.auth-eyebrow {
		animation-delay: 80ms;
	}
	.auth-heading {
		animation-delay: 160ms;
	}
	.auth-sub {
		animation-delay: 240ms;
	}
	.auth-body {
		animation-delay: 320ms;
	}
	.auth-foot {
		animation-delay: 400ms;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.auth-card,
		.auth-eyebrow,
		.auth-heading,
		.auth-sub,
		.auth-body,
		.auth-foot {
			animation: none;
		}
		.auth-eyebrow-dot {
			animation: none;
		}
	}
</style>

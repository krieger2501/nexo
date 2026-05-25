<script lang="ts">
	let {
		emoji = '🪺',
		title,
		sub = '',
		tone = 'default',
		cta = null
	}: {
		emoji?: string;
		title: string;
		sub?: string;
		tone?: 'default' | 'expense' | 'income' | 'debt';
		cta?: { href?: string; label: string; onclick?: () => void } | null;
	} = $props();

	const TONE_BG: Record<string, string> = {
		default: 'var(--color-text-primary)',
		expense: 'var(--color-expense)',
		income: 'var(--color-income)',
		debt: 'var(--color-debt)'
	};

	const TONE_GLOW: Record<string, string> = {
		default: 'var(--color-accent)',
		expense: 'var(--color-expense)',
		income: 'var(--color-income)',
		debt: 'var(--color-debt)'
	};
</script>

<div
	class="empty"
	style="--cta-bg: {TONE_BG[tone]}; --cta-text: {tone === 'default'
		? 'var(--color-bg-0)'
		: '#fff'}; --tone-glow: {TONE_GLOW[tone]};"
>
	<div class="empty-emoji" aria-hidden="true">{emoji}</div>
	<p class="empty-title">{title}</p>
	{#if sub}
		<p class="empty-sub">{sub}</p>
	{/if}
	{#if cta}
		{#if cta.href}
			<a class="empty-cta" href={cta.href}>{cta.label}</a>
		{:else}
			<button type="button" class="empty-cta" onclick={cta.onclick}>{cta.label}</button>
		{/if}
	{/if}
</div>

<style>
	.empty {
		text-align: center;
		padding: 32px 18px;
		border-radius: var(--radius-xl);
		border: 1px dashed var(--color-border-default);
		background:
			radial-gradient(
				ellipse at 50% 0%,
				color-mix(in oklab, var(--tone-glow) 7%, transparent),
				transparent 60%
			),
			var(--color-surface-1);
	}
	.empty-emoji {
		font-size: 32px;
		line-height: 1;
		margin-bottom: 10px;
		filter: saturate(1.05);
		animation: empty-bob 4s ease-in-out infinite;
	}
	.empty-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text-primary);
		letter-spacing: -0.005em;
	}
	.empty-sub {
		margin-top: 4px;
		font-size: 12px;
		color: var(--color-text-subtle);
		max-width: 280px;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.45;
	}
	.empty-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-top: 14px;
		padding: 8px 14px;
		border-radius: 999px;
		background: var(--cta-bg);
		color: var(--cta-text);
		font-size: 12.5px;
		font-weight: 600;
		text-decoration: none;
		border: 0;
		cursor: pointer;
	}

	@keyframes empty-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}
</style>

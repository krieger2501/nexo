<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import {
		Sparkles,
		Plug,
		SlidersHorizontal,
		Bell,
		PartyPopper,
		ArrowRight,
		ArrowLeft,
		X
	} from '@lucide/svelte';

	const STORAGE_KEY = 'flaschen.onboarded';
	const RESUME_KEY = 'flaschen.tour-resume';
	type Connection = 'connected' | 'never' | 'reconnect';
	let { connection }: { connection: Connection } = $props();

	let open = $state(false);
	let step = $state(0);
	const totalSteps = 5;

	onMount(() => {
		try {
			const seen = localStorage.getItem(STORAGE_KEY);
			if (!seen) open = true;
		} catch {
			// localStorage may be unavailable in some embedded contexts; don't auto-open then.
		}
		const handler = (e: Event) => {
			const detail = (e as CustomEvent<{ step?: number } | undefined>).detail;
			step = typeof detail?.step === 'number' ? detail.step : 0;
			open = true;
		};
		window.addEventListener('flaschen:replay-onboarding', handler);
		return () => window.removeEventListener('flaschen:replay-onboarding', handler);
	});

	function markSeen() {
		try {
			localStorage.setItem(STORAGE_KEY, '1');
			localStorage.removeItem(RESUME_KEY);
		} catch {
			// ignore
		}
	}

	function close() {
		markSeen();
		open = false;
	}

	function next() {
		if (step >= totalSteps - 1) {
			close();
		} else {
			step += 1;
		}
	}

	function back() {
		if (step > 0) step -= 1;
	}

	function jumpTo(href: string) {
		const nextStep = Math.min(step + 1, totalSteps - 1);
		try {
			localStorage.setItem(RESUME_KEY, JSON.stringify({ step: nextStep, ts: Date.now() }));
		} catch {
			// ignore
		}
		open = false;
		window.dispatchEvent(new CustomEvent('flaschen:tour-resume-set'));
		void goto(href);
	}
</script>

{#if open}
	<div class="onb" role="dialog" aria-modal="true" aria-labelledby="onb-title">
		<button type="button" class="onb-close" aria-label={m.onb_skip()} onclick={close}>
			<X size={18} strokeWidth={1.8} />
		</button>

		<div class="onb-progress" aria-hidden="true">
			{#each Array.from({ length: totalSteps }, (_, i) => i) as i (i)}
				<span class="onb-pip" class:active={i === step} class:done={i < step}></span>
			{/each}
		</div>

		<div class="onb-body">
			{#if step === 0}
				<div class="onb-illust onb-illust-accent">
					<Sparkles size={36} strokeWidth={1.4} />
				</div>
				<h2 id="onb-title" class="onb-title">{m.onb_step_1_title()}</h2>
				<p class="onb-desc">{m.onb_step_1_desc()}</p>
			{:else if step === 1}
				<div class="onb-illust onb-illust-accent">
					<Plug size={32} strokeWidth={1.5} />
				</div>
				<h2 id="onb-title" class="onb-title">{m.onb_step_2_title()}</h2>
				<p class="onb-desc">{m.onb_step_2_desc()}</p>
				<div class="onb-actions-stack">
					{#if connection === 'connected'}
						<button type="button" class="onb-cta" onclick={next}>
							{m.onb_next()}
							<ArrowRight size={16} strokeWidth={2} />
						</button>
					{:else}
						<button type="button" class="onb-cta" onclick={() => jumpTo('/settings?connect=1')}>
							{m.onb_step_2_cta()}
							<ArrowRight size={16} strokeWidth={2} />
						</button>
						<button type="button" class="onb-link" onclick={next}>
							{m.onb_step_2_skip()}
						</button>
					{/if}
				</div>
			{:else if step === 2}
				<div class="onb-illust onb-illust-accent">
					<SlidersHorizontal size={32} strokeWidth={1.5} />
				</div>
				<h2 id="onb-title" class="onb-title">{m.onb_step_3_title()}</h2>
				<p class="onb-desc">{m.onb_step_3_desc()}</p>
				<div class="onb-actions-stack">
					<button type="button" class="onb-cta" onclick={() => jumpTo('/filters')}>
						{m.onb_step_3_cta()}
						<ArrowRight size={16} strokeWidth={2} />
					</button>
					<button type="button" class="onb-link" onclick={next}>{m.onb_skip()}</button>
				</div>
			{:else if step === 3}
				<div class="onb-illust onb-illust-accent">
					<Bell size={32} strokeWidth={1.5} />
				</div>
				<h2 id="onb-title" class="onb-title">{m.onb_step_4_title()}</h2>
				<p class="onb-desc">{m.onb_step_4_desc()}</p>
				<div class="onb-actions-stack">
					<button type="button" class="onb-cta" onclick={() => jumpTo('/devices')}>
						{m.onb_step_4_cta()}
						<ArrowRight size={16} strokeWidth={2} />
					</button>
					<button type="button" class="onb-link" onclick={next}>{m.onb_skip()}</button>
				</div>
			{:else}
				<div class="onb-illust onb-illust-accent">
					<PartyPopper size={36} strokeWidth={1.4} />
				</div>
				<h2 id="onb-title" class="onb-title">{m.onb_step_5_title()}</h2>
				<p class="onb-desc">{m.onb_step_5_desc()}</p>
			{/if}
		</div>

		<div class="onb-nav">
			{#if step > 0}
				<button type="button" class="onb-back" onclick={back}>
					<ArrowLeft size={14} strokeWidth={2} />
					{m.onb_back()}
				</button>
			{:else}
				<span></span>
			{/if}

			{#if step === totalSteps - 1}
				<button type="button" class="onb-cta onb-cta-done" onclick={close}>{m.onb_done()}</button>
			{:else if step !== 1 && step !== 2 && step !== 3}
				<!-- Step 0 only — middle steps own their CTA via onb-actions-stack -->
				<button type="button" class="onb-cta" onclick={next}>
					{m.onb_next()}
					<ArrowRight size={16} strokeWidth={2} />
				</button>
			{:else}
				<span></span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.onb {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		flex-direction: column;
		padding: calc(var(--safe-top, 0px) + 18px) 22px calc(var(--safe-bot, 0px) + 24px);
		background:
			radial-gradient(
				120% 60% at 0% 0%,
				color-mix(in oklab, var(--color-wash-rose) 80%, transparent) 0%,
				transparent 60%
			),
			radial-gradient(
				100% 70% at 100% 18%,
				color-mix(in oklab, var(--color-wash-peach) 70%, transparent) 0%,
				transparent 65%
			),
			radial-gradient(
				120% 80% at 50% 110%,
				color-mix(in oklab, var(--color-wash-lilac) 60%, transparent) 0%,
				transparent 70%
			),
			color-mix(in oklab, var(--color-bg-0) 92%, var(--color-accent));
		backdrop-filter: blur(20px) saturate(160%);
		-webkit-backdrop-filter: blur(20px) saturate(160%);
		max-width: var(--app-max-w);
		margin-inline: auto;
		animation: onb-fade 360ms var(--ease-spring);
	}
	@keyframes onb-fade {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.onb-close {
		position: absolute;
		top: calc(var(--safe-top, 0px) + 14px);
		right: 18px;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.7);
		backdrop-filter: blur(14px) saturate(150%);
		-webkit-backdrop-filter: blur(14px) saturate(150%);
		border: 1px solid rgb(255 255 255 / 0.85);
		color: var(--color-text-muted);
		cursor: pointer;
		box-shadow: var(--shadow-glass-sm);
		transition: transform 320ms var(--ease-spring);
	}
	.onb-close:active {
		transform: scale(0.92);
	}

	.onb-progress {
		display: flex;
		gap: 6px;
		justify-content: center;
		margin-top: 6px;
	}
	.onb-pip {
		width: 22px;
		height: 4px;
		border-radius: 999px;
		background: rgb(124 18 64 / 0.18);
		transition: all 480ms var(--ease-spring);
	}
	.onb-pip.done {
		background: color-mix(in oklab, var(--color-accent) 50%, transparent);
	}
	.onb-pip.active {
		background: linear-gradient(90deg, var(--color-accent), var(--color-accent-deep));
		width: 44px;
	}

	.onb-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: stretch;
		padding: 16px 4px;
		gap: 16px;
	}
	.onb-illust {
		width: 96px;
		height: 96px;
		border-radius: 28px;
		display: grid;
		place-items: center;
		margin: 0 0 6px;
		background:
			radial-gradient(circle at 30% 25%, rgb(255 255 255 / 0.45) 0%, transparent 38%),
			linear-gradient(160deg, var(--color-accent) 0%, var(--color-accent-deep) 100%);
		color: #fff;
		box-shadow:
			0 14px 30px -14px rgb(124 18 64 / 0.55),
			inset 0 2px 0 rgb(255 255 255 / 0.3);
		animation: illust-bob 5s var(--ease-glide) infinite;
	}
	@keyframes illust-bob {
		0%,
		100% {
			transform: translateY(0) rotate(-3deg);
		}
		50% {
			transform: translateY(-4px) rotate(3deg);
		}
	}
	.onb-title {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 36px;
		font-weight: 400;
		letter-spacing: -0.02em;
		line-height: 1.1;
		margin: 0;
		color: var(--color-text-primary);
		text-wrap: balance;
	}
	.onb-desc {
		font-size: 15px;
		line-height: 1.55;
		color: var(--color-text-muted);
		margin: 0;
		text-wrap: pretty;
		max-width: 38ch;
	}
	.onb-actions-stack {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 8px;
	}

	.onb-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-top: 6px;
	}

	.onb-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 50px;
		padding: 0 22px;
		font: inherit;
		font-size: 15px;
		font-weight: 600;
		border-radius: 999px;
		background: linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-deep) 100%);
		color: #fff;
		border: none;
		cursor: pointer;
		text-decoration: none;
		box-shadow:
			0 10px 22px -8px rgb(124 18 64 / 0.5),
			inset 0 1px 0 rgb(255 255 255 / 0.25);
		transition: transform 320ms var(--ease-spring);
	}
	.onb-cta:active {
		transform: scale(0.96);
	}
	.onb-cta-done {
		width: 100%;
	}

	.onb-back {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font: inherit;
		font-size: 13.5px;
		font-weight: 500;
		color: var(--color-text-muted);
		background: rgb(255 255 255 / 0.55);
		border: 1px solid rgb(255 255 255 / 0.85);
		border-radius: 999px;
		cursor: pointer;
		padding: 10px 16px;
		box-shadow: var(--shadow-glass-sm);
		transition: transform 320ms var(--ease-spring);
	}
	.onb-back:active {
		transform: scale(0.96);
	}

	.onb-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 40px;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-muted);
		background: transparent;
		border: none;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 4px;
	}
</style>

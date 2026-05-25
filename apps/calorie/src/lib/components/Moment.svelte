<script lang="ts">
	import type { Moment } from '$lib/types';

	let { moment }: { moment: Moment } = $props();

	const time = $derived(
		moment.at
			? new Date(moment.at).toLocaleTimeString('en-US', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: false
				})
			: null
	);
</script>

<aside class="moment" role="note" aria-label={moment.headline}>
	<span class="rail" aria-hidden="true"></span>

	<span class="icon" aria-hidden="true">
		{#if moment.kind === 'first_of_day'}
			<!-- Sunrise — sun cresting a baseline -->
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
				<path d="M5 17h14" />
				<path d="M7.5 17a4.5 4.5 0 0 1 9 0" />
				<path d="M12 6v3" />
				<path d="M5.5 9 7 10.4" />
				<path d="M18.5 9 17 10.4" />
				<path d="M3 21h18" opacity="0.4" />
			</svg>
		{:else if moment.kind === 'welcome_back'}
			<!-- Circular return arrow -->
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 12a8 8 0 1 0 2.5-5.8" />
				<path d="M3.6 4v3.5h3.5" />
			</svg>
		{:else if moment.kind === 'new_friend'}
			<!-- Five-pointed star — outline only -->
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
				<path d="M12 4 14.4 9 20 9.8 16 13.7l1 5.6L12 16.7 7 19.3l1-5.6L4 9.8 9.6 9z" />
			</svg>
		{:else if moment.kind === 'variety'}
			<!-- Three overlapping dots in three opacity steps -->
			<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
				<circle cx="8" cy="14" r="4.2" opacity="0.35" />
				<circle cx="16" cy="14" r="4.2" opacity="0.55" />
				<circle cx="12" cy="9.4" r="4.2" opacity="0.95" />
			</svg>
		{:else}
			<!-- Family table — two heads above a bowl -->
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="9" cy="8" r="2.2" />
				<circle cx="15" cy="8" r="2.2" />
				<path d="M5 16c0-1.5 1.4-3 3-3h8c1.6 0 3 1.5 3 3" />
				<path d="M3.5 18c1.5 1.6 5 2.5 8.5 2.5s7-.9 8.5-2.5" />
			</svg>
		{/if}
	</span>

	<div class="body">
		<div class="headline serif-display">{moment.headline}</div>
		{#if moment.body}
			<div class="text serif-italic">{moment.body}</div>
		{/if}
	</div>

	{#if time}
		<span class="time eyebrow-num">{time}</span>
	{/if}

	<!-- Ember bloom in the top-right — quiet atmospheric flourish -->
	<span class="bloom" aria-hidden="true"></span>
</aside>

<style>
	.moment {
		position: relative;
		display: grid;
		grid-template-columns: 36px 1fr auto;
		align-items: center;
		gap: 12px;
		padding: 12px 14px 12px 16px;
		background: var(--ember-tint-bg);
		border: 1px solid color-mix(in oklab, var(--color-ember) 14%, var(--color-border-subtle));
		border-radius: 14px;
		overflow: hidden;
		animation: moment-rise 380ms cubic-bezier(0.32, 0.72, 0, 1) both;
	}

	@keyframes moment-rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.rail {
		position: absolute;
		left: 0;
		top: 8px;
		bottom: 8px;
		width: 3px;
		border-radius: 0 2px 2px 0;
		background: var(--color-ember);
	}

	.icon {
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		background: color-mix(in oklab, var(--color-ember) 12%, var(--color-bg-0));
		border-radius: 10px;
		color: var(--color-ember-deep);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.headline {
		font-size: 14px;
		font-variation-settings: 'opsz' 24, 'SOFT' 100, 'wght' 480;
		color: var(--color-text-primary);
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.text {
		font-size: 12px;
		color: var(--color-text-subtle);
		line-height: 1.35;
	}

	.time {
		opacity: 0.7;
	}

	.bloom {
		position: absolute;
		top: -20px;
		right: -20px;
		width: 90px;
		height: 90px;
		background: radial-gradient(
			circle at center,
			color-mix(in oklab, var(--color-ember) 30%, transparent),
			transparent 65%
		);
		pointer-events: none;
		opacity: 0.7;
	}
</style>

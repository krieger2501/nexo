<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	type App = {
		id: string;
		name: string;
		monogram: string;
		icon?: string;
		accent: string;
		status: 'live' | 'soon' | 'planned';
		desc: string;
		meta: string;
	};

	let { apps, firstName, authUrl }: { apps: App[]; firstName: string | null; authUrl: string } =
		$props();

	const liveApps = $derived(apps.filter((a) => a.status === 'live'));
	const comingApps = $derived(apps.filter((a) => a.status !== 'live'));
</script>

<section id="apps" class="scroll-mt-20 pt-4 pb-14">
	<div class="mx-auto max-w-[1100px] px-6">
		<div class="reveal section-head mb-7">
			<div class="t-label">{m.section_apps()}</div>
			<h2 class="mt-1 text-[clamp(28px,3vw,36px)] font-semibold tracking-tight">
				{m.apps_heading()}
			</h2>
			<p class="text-text-muted mt-2 max-w-[520px] text-[15px] leading-relaxed">{m.apps_sub()}</p>
		</div>

		<!-- Live apps — compact cards, mirror /apps style -->
		<div class="reveal app-stack" style="transition-delay: 60ms">
			{#each liveApps as app (app.id)}
				<div class="app-card" data-app={app.id} style="--app-accent: {app.accent}">
					<div class="ac-head">
						{#if app.icon}
							<img class="app-tile app-tile-img" src={app.icon} alt="" width="46" height="46" />
						{:else}
							<div class="app-tile">{app.monogram}</div>
						{/if}
						<span class="pill pill-live"
							><span class="pill-dot"></span>{m.status_live()}</span
						>
					</div>
					<div class="ac-name-row">
						<span class="ac-name">{app.name}</span>
						<span class="ac-version">{app.meta}</span>
					</div>
					<p class="ac-desc">{app.desc}</p>
				</div>
			{/each}
		</div>

		<!-- Coming up — single horizontal strip -->
		{#if comingApps.length > 0}
			<div class="reveal coming-row" style="transition-delay: 90ms">
				<span class="coming-label">{m.appgrid_coming_up()} ·</span>
				<div class="coming-strip">
					{#each comingApps as app (app.id)}
						<span class="coming-chip" class:coming-chip--idea={app.status === 'planned'}>
							<span class="coming-icon" style="color: {app.accent}">{app.monogram}</span>
							<span class="coming-name">{app.name}</span>
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<div class="reveal mt-8 flex flex-col items-center gap-2.5" style="transition-delay: 120ms">
			<a href={firstName ? '/apps' : `${authUrl}/login`} class="cta-btn">
				{firstName ? m.cta_open_apps() : m.cta_sign_in()}
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.7"
					class="cta-arrow"
				>
					<path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</a>
			<p class="text-text-faint font-mono text-[11px] tracking-wider">
				{firstName ? m.cta_invite_hint() : m.cta_invite_hint_unauth()}
			</p>
		</div>
	</div>
</section>

<style>
	.t-label {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-faint);
	}

	.app-stack {
		display: grid;
		gap: 10px;
	}
	.app-card {
		--app-soft: color-mix(in oklab, var(--app-accent) 10%, var(--color-surface-1));
		--app-line: color-mix(in oklab, var(--app-accent) 28%, var(--color-border-default));
		--app-ink: color-mix(in oklab, var(--app-accent) 80%, #000);
		position: relative;
		padding: 18px 20px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-xl);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.app-card::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(
			60% 70% at 100% 0%,
			color-mix(in oklab, var(--app-accent) 10%, transparent),
			transparent 70%
		);
		pointer-events: none;
	}
	.app-card > * {
		position: relative;
		z-index: 1;
	}
	.ac-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}
	.app-tile {
		width: 46px;
		height: 46px;
		border-radius: var(--radius-md);
		display: grid;
		place-items: center;
		background: color-mix(in oklab, var(--app-accent) 12%, var(--color-surface-1));
		border: 1px solid color-mix(in oklab, var(--app-accent) 30%, var(--color-border-default));
		color: var(--app-ink);
		font-family: var(--font-mono);
		font-weight: 500;
		font-size: 21px;
		letter-spacing: -0.02em;
	}
	.app-tile-img {
		background: transparent;
		border: 0;
		padding: 0;
		object-fit: contain;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 4px 9px;
		border-radius: 999px;
		border: 1px solid var(--color-border-default);
		color: var(--color-text-muted);
		background: var(--color-bg-2);
	}
	.pill-live {
		color: var(--app-ink);
		border-color: color-mix(in oklab, var(--app-accent) 30%, transparent);
		background: color-mix(in oklab, var(--app-accent) 10%, transparent);
	}
	.pill-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 0 0 6px currentColor;
		animation: pulse 2.4s var(--ease-in-out) infinite;
	}
	.ac-name-row {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.ac-name {
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.02em;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.ac-version {
		font-family: var(--font-mono);
		font-size: 9.5px;
		letter-spacing: 0.08em;
		color: var(--color-text-faint);
		flex-shrink: 0;
	}
	.ac-desc {
		color: var(--color-text-muted);
		margin: 4px 0 0;
		font-size: 13.5px;
		line-height: 1.5;
	}

	.coming-row {
		margin-top: 18px;
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}
	.coming-label {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-text-subtle);
		white-space: nowrap;
	}
	.coming-strip {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.coming-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px 6px 6px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: 999px;
		font-size: 13px;
		font-weight: 500;
		letter-spacing: -0.005em;
		color: var(--color-text-muted);
	}
	.coming-chip--idea {
		border-style: dashed;
		color: var(--color-text-faint);
	}
	.coming-icon {
		width: 22px;
		height: 22px;
		border-radius: 6px;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border-subtle);
		display: grid;
		place-items: center;
		font-family: var(--font-mono);
		font-size: 11px;
		flex-shrink: 0;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.4;
			transform: scale(0.75);
		}
	}

	.cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 24px;
		border-radius: 999px;
		background: var(--color-accent);
		color: #fff;
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		transition:
			transform var(--duration-base) var(--ease-out),
			box-shadow var(--duration-base) var(--ease-out);
		box-shadow: 0 4px 16px -4px color-mix(in oklab, var(--color-accent) 40%, transparent);
	}
	.cta-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 24px -6px color-mix(in oklab, var(--color-accent) 50%, transparent);
	}
	.cta-btn:active {
		transform: translateY(0);
	}
	.cta-arrow {
		width: 14px;
		height: 14px;
		transition: transform var(--duration-base) var(--ease-out);
	}
	.cta-btn:hover .cta-arrow {
		transform: translateX(3px);
	}
</style>

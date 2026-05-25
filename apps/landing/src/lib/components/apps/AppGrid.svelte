<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	type LiveApp = {
		id: string;
		name: string;
		monogram: string;
		icon?: string;
		accent: string;
		desc: string;
		href: string;
		meta: string;
	};

	type WorkshopApp = {
		id: string;
		name: string;
		monogram: string;
		icon?: string;
		accent: string;
		desc: string;
		meta: string;
	};

	type IdeaApp = {
		id: string;
		name: string;
		monogram: string;
		icon?: string;
		accent: string;
		sub: string;
	};

	type FinanceGlance = {
		liquid: number;
		monthExpenses: number;
		monthIncome: number;
		tightDay: string | null;
		tightAmount: number;
	};

	type FlaschenGlance =
		| { connected: false }
		| {
				connected: true;
				needsReconnect: boolean;
				available: number;
				matches: number;
				lastPollAt: Date | null;
				lastPollOk: boolean | null;
		  };

	type CalorieGlance =
		| { onboarded: false }
		| {
				onboarded: true;
				kcalToday: number;
				kcalTarget: number;
				remaining: number;
				overBy: number;
				entriesToday: number;
				daysLoggedThisWeek: number;
				latestWeightKg: number | null;
		  };

	type AdminGlance = {
		users: number;
		services: number;
		failing: number;
		healthPct: number | null;
		lastCheck: Date | null;
	};

	let {
		liveApps,
		workshopApps,
		ideaApps,
		financeGlance,
		flaschenGlance,
		calorieGlance,
		adminGlance
	}: {
		liveApps: LiveApp[];
		workshopApps: WorkshopApp[];
		ideaApps: IdeaApp[];
		financeGlance: FinanceGlance | null;
		flaschenGlance: FlaschenGlance | null;
		calorieGlance: CalorieGlance | null;
		adminGlance: AdminGlance | null;
	} = $props();

	const fmt = (n: number) =>
		n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
</script>

<!-- Your Apps -->
{#if liveApps.length > 0}
	<div class="sec">
		<span class="sec-title"><b>{m.appgrid_your_apps()}</b> · {liveApps.length}</span>
		<span class="sec-right">{m.appgrid_live()}</span>
	</div>

	<div class="app-stack">
		{#each liveApps as app (app.id)}
			<a class="app-card" href={app.href} style="--app-accent: {app.accent}" data-app={app.id}>
				<div class="ac-head">
					{#if app.icon}
						<img class="app-tile app-tile-img" src={app.icon} alt="" width="46" height="46" />
					{:else}
						<div class="app-tile">{app.monogram}</div>
					{/if}
					<span class="pill pill-live"
						><span class="pill-dot"></span>{m.appgrid_flaschen_live()}</span
					>
				</div>
				<div class="ac-name-row">
					<span class="ac-name">{app.name}</span>
					<span class="ac-version">{app.meta}</span>
				</div>

				{#if app.id === 'finance' && financeGlance}
					{@const g = financeGlance}
					{@const net = g.monthIncome - g.monthExpenses}
					<div class="ac-glance">
						<div class="stat">
							<div class="stat-k">{m.appgrid_finance_liquid()}</div>
							<div class="stat-v mono">{fmt(g.liquid)}</div>
						</div>
						<div class="stat">
							<div class="stat-k">{m.appgrid_finance_month()}</div>
							<div class="stat-v mono {net >= 0 ? 'up' : 'down'}">
								<span class="stat-arrow" aria-hidden="true">{net >= 0 ? '↑' : '↓'}</span>
								{net >= 0 ? '+' : ''}{fmt(net)}
							</div>
						</div>
						<div class="stat">
							<div class="stat-k">{m.appgrid_finance_tight_day()}</div>
							<div class="stat-v mono">{g.tightDay ?? '—'}</div>
						</div>
					</div>
				{/if}

				{#if app.id === 'flaschen' && flaschenGlance}
					<div class="ac-glance">
						<div class="stat">
							<div class="stat-k">{m.appgrid_flaschen_available()}</div>
							<div class="stat-v mono">
								{flaschenGlance.connected ? flaschenGlance.available : '—'}
							</div>
						</div>
						<div class="stat">
							<div class="stat-k">{m.appgrid_flaschen_match_rules()}</div>
							<div
								class="stat-v mono {flaschenGlance.connected && flaschenGlance.matches > 0
									? 'up'
									: ''}"
							>
								{flaschenGlance.connected ? flaschenGlance.matches : '—'}
							</div>
						</div>
						<div class="stat">
							<div class="stat-k">{m.appgrid_flaschen_status()}</div>
							<div
								class="stat-v stat-status {!flaschenGlance.connected
									? 'muted'
									: flaschenGlance.needsReconnect
										? 'down'
										: 'up'}"
							>
								<span class="status-dot" aria-hidden="true"></span>
								{!flaschenGlance.connected
									? m.appgrid_flaschen_not_connected()
									: flaschenGlance.needsReconnect
										? m.appgrid_flaschen_reauth()
										: m.appgrid_flaschen_live()}
							</div>
						</div>
					</div>
				{/if}

				{#if app.id === 'calorie' && calorieGlance}
					{@const c = calorieGlance}
					<div class="ac-glance">
						{#if !c.onboarded}
							<div class="stat">
								<div class="stat-k">{m.appgrid_calorie_status()}</div>
								<div class="stat-v stat-status muted">
									<span class="status-dot" aria-hidden="true"></span>
									{m.appgrid_calorie_not_set_up()}
								</div>
							</div>
						{:else}
							{@const tone = c.overBy > 0 ? 'down' : 'up'}
							<div class="stat">
								<div class="stat-k">{m.appgrid_calorie_today()}</div>
								<div class="stat-v mono">
									{c.kcalToday.toLocaleString()}<span class="of">/{c.kcalTarget.toLocaleString()}</span>
								</div>
							</div>
							<div class="stat">
								<div class="stat-k">
									{c.overBy > 0 ? m.appgrid_calorie_over() : m.appgrid_calorie_remaining()}
								</div>
								<div class="stat-v mono {tone}">
									<span class="stat-arrow" aria-hidden="true">{c.overBy > 0 ? '↑' : '↓'}</span>
									{(c.overBy > 0 ? c.overBy : c.remaining).toLocaleString()}
								</div>
							</div>
							<div class="stat">
								<div class="stat-k">{m.appgrid_calorie_week()}</div>
								<div class="stat-v mono">{c.daysLoggedThisWeek}/7</div>
							</div>
						{/if}
					</div>
				{/if}

				{#if app.id === 'admin' && adminGlance}
					{@const a = adminGlance}
					{@const tone = a.healthPct === null ? 'muted' : a.failing > 0 ? 'down' : 'up'}
					<div class="ac-glance">
						<div class="stat">
							<div class="stat-k">{m.appgrid_admin_users()}</div>
							<div class="stat-v mono">{a.users}</div>
						</div>
						<div class="stat">
							<div class="stat-k">{m.appgrid_admin_services()}</div>
							<div class="stat-v mono">{a.services > 0 ? a.services : '—'}</div>
						</div>
						<div class="stat">
							<div class="stat-k">{m.appgrid_admin_health()}</div>
							<div class="stat-v stat-status {tone}">
								<span class="status-dot" aria-hidden="true"></span>
								{a.healthPct === null
									? m.appgrid_admin_health_none()
									: a.failing > 0
										? m.appgrid_admin_failing({ count: a.failing })
										: m.appgrid_admin_all_ok()}
							</div>
						</div>
					</div>
				{/if}
			</a>
		{/each}
	</div>
{:else}
	<div class="sec">
		<span class="sec-title"><b>{m.appgrid_your_apps()}</b></span>
	</div>
	<div class="empty">
		<p>{m.appgrid_empty()}</p>
	</div>
{/if}

<!-- Coming up — workshop + ideas merged into one strip -->
{#if workshopApps.length + ideaApps.length > 0}
	{@const comingItems = [
		...workshopApps.map((a) => ({
			id: a.id,
			name: a.name,
			monogram: a.monogram,
			icon: a.icon,
			accent: a.accent,
			sub: a.meta,
			tone: 'soon' as const
		})),
		...ideaApps.map((a) => ({
			id: a.id,
			name: a.name,
			monogram: a.monogram,
			icon: a.icon,
			accent: a.accent,
			sub: a.sub,
			tone: 'idea' as const
		}))
	]}
	<div class="sec">
		<span class="sec-title"><b>{m.appgrid_coming_up()}</b> · {comingItems.length}</span>
		<span class="sec-right">{m.appgrid_soonish()}</span>
	</div>
	<div class="coming-strip">
		{#each comingItems as item (item.id)}
			<div class="coming-chip" class:coming-chip--idea={item.tone === 'idea'}>
				{#if item.icon}
					<img class="coming-icon coming-icon-img" src={item.icon} alt="" width="24" height="24" />
				{:else}
					<span class="coming-icon" style="color: {item.accent}">{item.monogram}</span>
				{/if}
				<span class="coming-text">
					<span class="coming-name">{item.name}</span>
					<span class="coming-sub">{item.sub}</span>
				</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	.sec {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: 28px 4px 12px;
		gap: 12px;
	}
	.sec-title {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-text-subtle);
		white-space: nowrap;
	}
	.sec-title b,
	.sec-title :global(b) {
		color: var(--color-text-primary);
		font-weight: 600;
		letter-spacing: 0.04em;
	}
	.sec-right {
		font-size: 12px;
		color: var(--color-text-faint);
		font-family: var(--font-mono);
		letter-spacing: 0.04em;
		white-space: nowrap;
		flex-shrink: 0;
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
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		transition:
			transform var(--duration-base) var(--ease-out),
			border-color var(--duration-base) var(--ease-out);
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
	.app-card:active {
		transform: scale(0.99);
		border-color: var(--app-line);
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
		animation: pulse 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(0.85);
		}
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

	.ac-glance {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 14px;
		align-items: start;
		margin-top: 14px;
		padding-top: 12px;
		position: relative;
	}
	.ac-glance::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in oklab, var(--app-accent) 28%, var(--color-border-default)) 18%,
			color-mix(in oklab, var(--app-accent) 28%, var(--color-border-default)) 82%,
			transparent
		);
		opacity: 0.7;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.stat:nth-child(2) {
		text-align: center;
		align-items: center;
	}
	.stat:nth-child(3) {
		text-align: right;
		align-items: flex-end;
	}
	.stat-k {
		font-family: var(--font-mono);
		font-size: 9.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-faint);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	.stat-v {
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.015em;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	.stat-v.up {
		color: var(--app-ink);
	}
	.stat-v.down {
		color: oklch(0.59 0.2 27);
	}
	.stat-v.muted {
		color: var(--color-text-faint);
	}
	.stat-v.mono {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
	}
	.stat-arrow {
		display: inline-block;
		margin-right: 2px;
		opacity: 0.85;
	}
	.stat-status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0;
		text-transform: lowercase;
	}
	.status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: currentColor;
		flex-shrink: 0;
		box-shadow: 0 0 0 3px color-mix(in oklab, currentColor 18%, transparent);
	}
	.stat-v.up .status-dot {
		animation: glance-pulse 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	@keyframes glance-pulse {
		0%,
		100% {
			box-shadow: 0 0 0 3px color-mix(in oklab, currentColor 18%, transparent);
		}
		50% {
			box-shadow: 0 0 0 5px color-mix(in oklab, currentColor 8%, transparent);
		}
	}

	.coming-strip {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		margin: 0 -16px;
		padding: 4px 16px 8px;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}
	.coming-strip::-webkit-scrollbar {
		display: none;
	}
	.coming-chip {
		flex-shrink: 0;
		scroll-snap-align: start;
		padding: 10px 12px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 160px;
	}
	.coming-chip--idea {
		border-style: dashed;
	}
	.coming-icon {
		width: 28px;
		height: 28px;
		border-radius: 7px;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border-subtle);
		display: grid;
		place-items: center;
		font-family: var(--font-mono);
		font-size: 13px;
		flex-shrink: 0;
	}
	.coming-icon-img {
		background: transparent;
		border: 0;
		padding: 0;
		object-fit: contain;
	}
	.coming-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.coming-name {
		font-size: 13.5px;
		font-weight: 500;
		letter-spacing: -0.005em;
		color: var(--color-text-primary);
	}
	.coming-sub {
		font-size: 10.5px;
		color: var(--color-text-faint);
		font-family: var(--font-mono);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.empty {
		padding: 32px 16px;
		text-align: center;
		background: var(--color-surface-1);
		border: 1px dashed var(--color-border-default);
		border-radius: var(--radius-xl);
		color: var(--color-text-muted);
		font-size: 13.5px;
	}
</style>

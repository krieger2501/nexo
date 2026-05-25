<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let platform = $state<'ios' | 'android'>('ios');
	let activeIdx = $state(0);
	let scroller: HTMLOListElement | null = $state(null);

	type Step = { title: string; body: string };
	const iosSteps = $derived<Step[]>([
		{ title: m.install_step1_title(), body: m.install_step1_body() },
		{ title: m.install_step2_title(), body: m.install_step2_body() },
		{ title: m.install_step3_title(), body: m.install_step3_body() },
		{ title: m.install_step4_title(), body: m.install_step4_body() }
	]);
	const androidSteps = $derived<Step[]>([
		{ title: m.install_android_step1_title(), body: m.install_android_step1_body() },
		{ title: m.install_android_step2_title(), body: m.install_android_step2_body() },
		{ title: m.install_android_step3_title(), body: m.install_android_step3_body() },
		{ title: m.install_android_step4_title(), body: m.install_android_step4_body() }
	]);
	const steps = $derived(platform === 'ios' ? iosSteps : androidSteps);

	function jumpTo(i: number) {
		if (!scroller) return;
		const card = scroller.children[i] as HTMLElement | undefined;
		card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
	}

	function onScroll() {
		if (!scroller) return;
		const cardWidth = scroller.scrollWidth / steps.length;
		const i = Math.round(scroller.scrollLeft / cardWidth);
		if (i !== activeIdx && i >= 0 && i < steps.length) activeIdx = i;
	}

	function setPlatform(p: 'ios' | 'android') {
		platform = p;
		activeIdx = 0;
		queueMicrotask(() => scroller?.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior }));
	}
</script>

<section id="install" class="bg-bg-1 scroll-mt-20 py-14">
	<div class="mx-auto max-w-[1100px] px-6">
		<div class="reveal section-head mb-7">
			<div class="t-label">{m.section_install()}</div>
			<h2 class="mt-1 text-[clamp(28px,3vw,36px)] font-semibold tracking-tight">
				{m.install_heading()}
			</h2>
			<p class="text-text-muted mt-2 max-w-[440px] text-[15px] leading-relaxed">
				{m.install_sub()}
			</p>
		</div>

		<!-- Platform toggle -->
		<div class="reveal platform-toggle" style="transition-delay: 40ms" role="tablist">
			<button
				type="button"
				role="tab"
				aria-selected={platform === 'ios'}
				class="platform-btn"
				class:active={platform === 'ios'}
				onclick={() => setPlatform('ios')}
			>
				<span class="platform-glyph" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="currentColor"
						><path
							d="M17.5 12.5c0-2.5 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 2.9 2.4 1.2 0 1.6-.7 3.1-.7 1.4 0 1.8.7 3.1.7 1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.4-.9-2.4-3.7zM15.4 5.2c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z"
						/></svg
					>
				</span>
				{m.install_platform_ios()}
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={platform === 'android'}
				class="platform-btn"
				class:active={platform === 'android'}
				onclick={() => setPlatform('android')}
			>
				<span class="platform-glyph" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="currentColor"
						><path
							d="M17.5 11h-11c-.3 0-.5.2-.5.5v7c0 .8.7 1.5 1.5 1.5H8v2.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V20h2v2.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V20h.5c.8 0 1.5-.7 1.5-1.5v-7c0-.3-.2-.5-.5-.5zM4.5 10c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5S6 18.3 6 17.5v-6c0-.8-.7-1.5-1.5-1.5zm15 0c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-6c0-.8-.7-1.5-1.5-1.5zm-3-7.4 1-1.7c.1-.2 0-.4-.1-.5-.2-.1-.4 0-.5.1l-1 1.7C15.1 1.7 13.6 1.3 12 1.3s-3.1.4-4.4 1l-1-1.7c-.1-.2-.3-.2-.5-.1-.2.1-.2.3-.1.5l1 1.7C4.7 3.7 3 6 3 8.7c0 .2.1.3.3.3h17.4c.2 0 .3-.1.3-.3 0-2.7-1.7-5-4.5-6.1zM9 6.5c-.4 0-.8-.4-.8-.8s.4-.7.8-.7.7.3.7.7-.3.8-.7.8zm6 0c-.4 0-.7-.4-.7-.8s.3-.7.7-.7.8.3.8.7-.4.8-.8.8z"
						/></svg
					>
				</span>
				{m.install_platform_android()}
			</button>
		</div>

		<!-- Horizontal carousel of step cards -->
		<ol
			class="reveal install-scroller"
			style="transition-delay: 80ms"
			bind:this={scroller}
			onscroll={onScroll}
		>
			{#each steps as step, i (platform + i)}
				<li class="install-card" data-step={i}>
					<div class="card-num">
						<span>{i + 1}</span>
					</div>
					<div class="card-text">
						<h3 class="step-title">{step.title}</h3>
						<p class="step-body">{step.body}</p>
					</div>
					<div class="phone-vignette">
						{#if platform === 'ios'}
							{#if i === 0}
								<!-- Step 1: Safari URL bar -->
								<div class="vignette-screen vignette-light">
									<div class="ios-status-bar"><span>9:41</span><span>•••</span></div>
									<div class="ios-url-bar">
										<span class="url-lock">🔒</span>
										<span class="url-text">krieger2501.de</span>
									</div>
									<div class="ios-content">
										<div class="ios-headline"></div>
										<div class="ios-line"></div>
										<div class="ios-line short"></div>
									</div>
									<div class="ios-tab-bar">
										<span>‹</span><span>›</span>
										<span class="share-highlight" aria-hidden="true">⎙</span>
										<span>▢</span><span>≡</span>
									</div>
								</div>
							{:else if i === 1}
								<!-- Step 2: Share sheet hint -->
								<div class="vignette-screen vignette-light">
									<div class="ios-status-bar"><span>9:41</span><span>•••</span></div>
									<div class="ios-content faded"></div>
									<div class="share-sheet">
										<div class="sheet-grab"></div>
										<div class="sheet-row">
											<span class="sheet-icon">✉</span>
											<span class="sheet-icon">⌬</span>
											<span class="sheet-icon">◎</span>
											<span class="sheet-icon">⤴</span>
										</div>
										<div class="sheet-divider"></div>
										<div class="sheet-list">
											<div class="sheet-list-row"><span>📋</span><span>Copy</span></div>
											<div class="sheet-list-row sheet-list-row--target">
												<span>＋</span><span>Add to Home Screen</span>
											</div>
											<div class="sheet-list-row"><span>★</span><span>Bookmark</span></div>
										</div>
									</div>
								</div>
							{:else if i === 2}
								<!-- Step 3: Add to Home Screen confirm -->
								<div class="vignette-screen vignette-light">
									<div class="ios-status-bar"><span>9:41</span><span>•••</span></div>
									<div class="confirm-sheet">
										<div class="confirm-cancel">Cancel</div>
										<div class="confirm-title">Add to Home Screen</div>
										<div class="confirm-add">Add</div>
									</div>
									<div class="confirm-card">
										<div class="confirm-app">
											<img src="/icon-finance.svg" alt="" class="confirm-icon" />
											<div class="confirm-meta">
												<div class="confirm-name">Finance</div>
												<div class="confirm-host">krieger2501.de</div>
											</div>
										</div>
									</div>
									<div class="confirm-hint">
										An icon will be added to your Home Screen so you can quickly access this
										website.
									</div>
								</div>
							{:else}
								<!-- Step 4: Home screen with icon -->
								<div class="vignette-screen vignette-dark">
									<div class="ios-status-bar dark"><span>9:41</span><span>•••</span></div>
									<div class="home-grid">
										<div class="home-tile"></div>
										<div class="home-tile"></div>
										<div class="home-tile"></div>
										<div class="home-tile home-tile--ours">
											<img src="/icon-finance.svg" alt="" />
										</div>
										<div class="home-tile"></div>
										<div class="home-tile"></div>
										<div class="home-tile"></div>
										<div class="home-tile"></div>
									</div>
									<div class="home-label">Finance</div>
								</div>
							{/if}
						{:else if i === 0}
							<!-- Android step 1: Chrome URL bar -->
							<div class="vignette-screen vignette-light">
								<div class="ios-status-bar"><span>9:41</span><span>📶 100%</span></div>
								<div class="android-url-bar">
									<span class="url-lock">🔒</span>
									<span class="url-text">krieger2501.de</span>
									<span class="kebab">⋮</span>
								</div>
								<div class="ios-content">
									<div class="ios-headline"></div>
									<div class="ios-line"></div>
									<div class="ios-line short"></div>
								</div>
							</div>
						{:else if i === 1}
							<!-- Android step 2: kebab menu open -->
							<div class="vignette-screen vignette-light">
								<div class="ios-status-bar"><span>9:41</span><span>📶 100%</span></div>
								<div class="android-url-bar">
									<span class="url-lock">🔒</span>
									<span class="url-text">krieger2501.de</span>
									<span class="kebab kebab--active">⋮</span>
								</div>
								<div class="ios-content faded"></div>
								<div class="kebab-menu">
									<div class="menu-row"><span>↻</span> Reload</div>
									<div class="menu-row"><span>★</span> Bookmark</div>
									<div class="menu-row menu-row--target"><span>＋</span> Install app</div>
									<div class="menu-row"><span>↗</span> Share</div>
								</div>
							</div>
						{:else if i === 2}
							<!-- Android step 3: install confirm dialog -->
							<div class="vignette-screen vignette-light">
								<div class="ios-status-bar"><span>9:41</span><span>📶 100%</span></div>
								<div class="ios-content faded"></div>
								<div class="install-dialog">
									<div class="install-dialog-app">
										<img src="/icon-finance.svg" alt="" class="confirm-icon" />
										<div class="confirm-meta">
											<div class="confirm-name">Install app</div>
											<div class="confirm-host">Finance · krieger2501.de</div>
										</div>
									</div>
									<div class="install-dialog-actions">
										<span class="dialog-btn dialog-btn--ghost">Cancel</span>
										<span class="dialog-btn dialog-btn--primary">Install</span>
									</div>
								</div>
							</div>
						{:else}
							<!-- Android step 4: home screen icon -->
							<div class="vignette-screen vignette-android-home">
								<div class="ios-status-bar dark"><span>9:41</span><span>📶 100%</span></div>
								<div class="home-grid home-grid--android">
									<div class="home-tile home-tile--circle"></div>
									<div class="home-tile home-tile--circle"></div>
									<div class="home-tile home-tile--circle home-tile--ours">
										<img src="/icon-finance.svg" alt="" />
									</div>
									<div class="home-tile home-tile--circle"></div>
									<div class="home-tile home-tile--circle"></div>
									<div class="home-tile home-tile--circle"></div>
									<div class="home-tile home-tile--circle"></div>
									<div class="home-tile home-tile--circle"></div>
								</div>
								<div class="home-label home-label--android">Finance</div>
							</div>
							{/if}
					</div>
					{#if platform === 'ios' && i === 2}
						<div class="step-callout" aria-hidden="false">
							<span class="callout-line"></span>
							<span class="callout-text">
								Opens fullscreen <span class="callout-dim">— URL bar gone, just the app.</span>
							</span>
							<span class="callout-line"></span>
						</div>
					{/if}
				</li>
			{/each}
		</ol>

		<!-- Pagination: numbered dots + tap to jump -->
		<div class="reveal install-dots" style="transition-delay: 120ms" role="tablist">
			{#each steps as _, i (platform + i)}
				<button
					type="button"
					class="dot-btn"
					class:active={i === activeIdx}
					aria-label={`Go to step ${i + 1}`}
					aria-selected={i === activeIdx}
					role="tab"
					onclick={() => jumpTo(i)}
				>
					<span class="dot-num">{i + 1}</span>
				</button>
			{/each}
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

	/* ── Platform toggle ── */
	.platform-toggle {
		display: inline-flex;
		gap: 0;
		padding: 4px;
		background: var(--color-bg-2);
		border: 1px solid var(--color-border-subtle);
		border-radius: 999px;
		margin-bottom: 24px;
	}
	.platform-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		border: 0;
		background: transparent;
		border-radius: 999px;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-muted);
		cursor: pointer;
		transition:
			background var(--duration-base) var(--ease-out),
			color var(--duration-base) var(--ease-out),
			box-shadow var(--duration-base) var(--ease-out);
	}
	.platform-btn.active {
		background: var(--color-surface-1);
		color: var(--color-text-primary);
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.06),
			0 0 0 1px var(--color-border-default);
	}
	.platform-glyph {
		display: inline-grid;
		place-items: center;
		width: 14px;
		height: 14px;
	}
	.platform-glyph svg {
		width: 100%;
		height: 100%;
	}

	/* ── Carousel scroller ── */
	.install-scroller {
		list-style: none;
		padding: 0;
		margin: 0 -22px;
		display: flex;
		gap: 12px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		scroll-padding: 0 22px;
		padding: 4px 22px 4px;
	}
	.install-scroller::-webkit-scrollbar {
		display: none;
	}
	.install-card {
		flex: 0 0 calc(100% - 32px);
		max-width: 380px;
		scroll-snap-align: start;
		display: grid;
		grid-template-columns: 38px 1fr 124px;
		grid-template-rows: auto auto;
		gap: 14px;
		align-items: center;
		padding: 18px 16px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-xl);
		min-height: 230px;
	}

	/* Number badge */
	.card-num {
		display: grid;
		place-items: center;
		align-self: center;
	}
	.card-num span {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--color-accent);
		background: color-mix(in oklab, var(--color-accent) 10%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-accent) 30%, var(--color-border-default));
	}

	/* Text column */
	.card-text {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.step-title {
		font-size: 16px;
		font-weight: 600;
		letter-spacing: -0.015em;
		margin: 0;
		color: var(--color-text-primary);
		line-height: 1.25;
	}
	.step-body {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--color-text-muted);
	}
	.step-callout {
		grid-column: 1 / -1;
		margin: 6px 0 -2px;
		display: flex;
		align-items: center;
		gap: 12px;
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.04em;
		color: var(--color-accent);
		line-height: 1.3;
		min-width: 0;
	}
	.callout-line {
		flex: 1 1 0;
		min-width: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in oklab, var(--color-accent) 40%, transparent) 30%,
			color-mix(in oklab, var(--color-accent) 40%, transparent) 70%,
			transparent
		);
	}
	.callout-line:last-child {
		background: linear-gradient(
			90deg,
			color-mix(in oklab, var(--color-accent) 40%, transparent),
			transparent
		);
	}
	.callout-line:first-child {
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in oklab, var(--color-accent) 40%, transparent)
		);
	}
	.callout-text {
		flex: 0 1 auto;
		min-width: 0;
		font-weight: 500;
		text-transform: lowercase;
		text-align: center;
		text-wrap: balance;
	}
	.callout-dim {
		color: color-mix(in oklab, var(--color-accent) 60%, var(--color-text-faint));
		font-weight: 400;
	}

	/* ── Pagination dots ── */
	.install-dots {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin-top: 18px;
	}
	.dot-btn {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		border: 1px solid var(--color-border-default);
		background: var(--color-bg-2);
		color: var(--color-text-faint);
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		padding: 0;
		transition:
			background var(--duration-base) var(--ease-out),
			color var(--duration-base) var(--ease-out),
			border-color var(--duration-base) var(--ease-out),
			box-shadow var(--duration-base) var(--ease-out),
			transform var(--duration-base) var(--ease-out);
	}
	.dot-btn.active {
		background: var(--color-accent);
		color: #fff;
		border-color: var(--color-accent);
		box-shadow: 0 4px 12px -4px color-mix(in oklab, var(--color-accent) 50%, transparent);
		transform: scale(1.05);
	}
	.dot-num {
		line-height: 1;
	}

	/* ── Phone vignette (mini phone mock) ── */
	.phone-vignette {
		width: 124px;
		aspect-ratio: 9 / 19;
		justify-self: end;
		border-radius: 22px;
		background: linear-gradient(180deg, #2a2a2d 0%, #0e0e10 100%);
		border: 1px solid #1a1a1d;
		padding: 5px;
		box-shadow:
			0 0 0 4px #18181b,
			0 14px 28px -14px rgb(0 0 0 / 0.4);
	}
	.vignette-screen {
		width: 100%;
		height: 100%;
		border-radius: 18px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		position: relative;
	}
	.vignette-light {
		background: #f5f5f4;
		color: #18181b;
	}
	.vignette-dark {
		background: linear-gradient(160deg, #1d1d1f 0%, #2a2a2d 60%, #18181b 100%);
		color: #f4f4f5;
	}
	.vignette-android-home {
		background:
			radial-gradient(80% 60% at 30% 10%, rgb(79 70 229 / 0.25), transparent 70%),
			linear-gradient(180deg, #1c1d22 0%, #0f1015 100%);
		color: #f4f4f5;
	}

	.ios-status-bar {
		display: flex;
		justify-content: space-between;
		padding: 6px 10px 0;
		font-size: 6.5px;
		font-weight: 700;
		letter-spacing: 0.02em;
		flex-shrink: 0;
	}
	.ios-status-bar.dark {
		color: #f4f4f5;
	}
	.ios-url-bar {
		margin: 5px 8px 4px;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
		background: #e7e5e4;
		border-radius: 6px;
		font-size: 6.5px;
		font-weight: 500;
	}
	.android-url-bar {
		margin: 5px 8px 4px;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
		background: #fff;
		border: 1px solid #e7e5e4;
		border-radius: 999px;
		font-size: 6.5px;
		font-weight: 500;
	}
	.url-lock {
		font-size: 5.5px;
	}
	.url-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.kebab {
		font-weight: 700;
		font-size: 8px;
		color: #71717a;
	}
	.kebab--active {
		color: var(--color-accent);
	}
	.ios-content {
		flex: 1;
		padding: 6px 10px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.ios-content.faded {
		filter: blur(0.4px);
		opacity: 0.5;
	}
	.ios-headline {
		height: 6px;
		width: 60%;
		background: #d4d4d4;
		border-radius: 2px;
	}
	.ios-line {
		height: 3px;
		width: 100%;
		background: #e7e5e4;
		border-radius: 2px;
	}
	.ios-line.short {
		width: 70%;
	}
	.ios-tab-bar {
		flex-shrink: 0;
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 4px 6px;
		font-size: 9px;
		color: #71717a;
		border-top: 1px solid rgb(0 0 0 / 0.04);
	}
	.share-highlight {
		color: var(--color-accent);
		font-weight: 700;
		transform: scale(1.15);
		display: inline-block;
		filter: drop-shadow(0 0 4px color-mix(in oklab, var(--color-accent) 60%, transparent));
		animation: tap-pulse 1.8s var(--ease-in-out) infinite;
	}
	@keyframes tap-pulse {
		0%,
		100% {
			transform: scale(1.15);
		}
		50% {
			transform: scale(1.35);
		}
	}

	/* Step 2 — share sheet */
	.share-sheet {
		position: absolute;
		left: 4px;
		right: 4px;
		bottom: 4px;
		background: rgb(255 255 255 / 0.96);
		backdrop-filter: blur(8px);
		border-radius: 14px;
		padding: 6px 6px 4px;
		box-shadow: 0 -8px 20px rgb(0 0 0 / 0.1);
	}
	.sheet-grab {
		width: 22px;
		height: 2px;
		border-radius: 2px;
		background: #d4d4d4;
		margin: 0 auto 4px;
	}
	.sheet-row {
		display: flex;
		gap: 4px;
		justify-content: space-between;
		padding: 0 2px 4px;
	}
	.sheet-icon {
		font-size: 8px;
		width: 18px;
		height: 18px;
		display: grid;
		place-items: center;
		background: #f4f4f5;
		border-radius: 5px;
	}
	.sheet-divider {
		height: 1px;
		background: rgb(0 0 0 / 0.06);
		margin: 0 -6px 2px;
	}
	.sheet-list {
		display: flex;
		flex-direction: column;
	}
	.sheet-list-row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 3px 4px;
		font-size: 6.5px;
		font-weight: 500;
		color: #18181b;
	}
	.sheet-list-row--target {
		background: color-mix(in oklab, var(--color-accent) 12%, transparent);
		color: var(--color-accent);
		border-radius: 4px;
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 30%, transparent);
	}

	/* Step 3 — confirm */
	.confirm-sheet {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 5px 8px 4px;
		font-size: 7px;
		font-weight: 500;
		border-bottom: 1px solid rgb(0 0 0 / 0.06);
	}
	.confirm-cancel {
		color: var(--color-accent);
	}
	.confirm-title {
		font-weight: 600;
		color: #18181b;
	}
	.confirm-add {
		color: var(--color-accent);
		font-weight: 600;
	}
	.confirm-card {
		margin: 6px 8px;
		padding: 6px;
		background: #fff;
		border: 1px solid rgb(0 0 0 / 0.06);
		border-radius: 8px;
	}
	.confirm-app {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.confirm-icon {
		width: 22px;
		height: 22px;
		border-radius: 5px;
		flex-shrink: 0;
	}
	.confirm-meta {
		min-width: 0;
		flex: 1;
	}
	.confirm-name {
		font-size: 7px;
		font-weight: 600;
		color: #18181b;
	}
	.confirm-host {
		font-size: 5.5px;
		color: #71717a;
		margin-top: 1px;
	}
	.confirm-hint {
		margin: 4px 8px;
		font-size: 5.5px;
		color: #71717a;
		line-height: 1.45;
	}

	/* Step 4 — home grid */
	.home-grid {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
		padding: 12px 10px;
		align-content: start;
	}
	.home-tile {
		aspect-ratio: 1;
		background: rgb(255 255 255 / 0.07);
		border-radius: 6px;
		display: grid;
		place-items: center;
	}
	.home-tile--circle {
		border-radius: 999px;
	}
	.home-tile--ours {
		background: #fff;
		box-shadow:
			0 0 0 1.5px color-mix(in oklab, var(--color-accent) 60%, transparent),
			0 0 14px color-mix(in oklab, var(--color-accent) 50%, transparent);
		animation: ours-pulse 2.4s var(--ease-in-out) infinite;
	}
	.home-tile--ours img {
		width: 80%;
		height: 80%;
		object-fit: contain;
	}
	@keyframes ours-pulse {
		0%,
		100% {
			box-shadow:
				0 0 0 1.5px color-mix(in oklab, var(--color-accent) 60%, transparent),
				0 0 14px color-mix(in oklab, var(--color-accent) 50%, transparent);
		}
		50% {
			box-shadow:
				0 0 0 2px color-mix(in oklab, var(--color-accent) 80%, transparent),
				0 0 20px color-mix(in oklab, var(--color-accent) 70%, transparent);
		}
	}
	.home-label {
		text-align: center;
		font-size: 6.5px;
		font-weight: 500;
		color: #f4f4f5;
		padding-bottom: 8px;
	}
	.home-label--android {
		font-weight: 400;
	}

	/* Android — kebab menu */
	.kebab-menu {
		position: absolute;
		top: 22px;
		right: 8px;
		min-width: 76px;
		background: #fff;
		border-radius: 6px;
		padding: 3px;
		box-shadow:
			0 6px 16px rgb(0 0 0 / 0.18),
			0 0 0 1px rgb(0 0 0 / 0.06);
	}
	.menu-row {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 3px 5px;
		font-size: 6.5px;
		color: #18181b;
		border-radius: 3px;
	}
	.menu-row--target {
		background: color-mix(in oklab, var(--color-accent) 14%, transparent);
		color: var(--color-accent);
		font-weight: 600;
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 30%, transparent);
	}

	/* Android — install dialog */
	.install-dialog {
		position: absolute;
		left: 6px;
		right: 6px;
		bottom: 6px;
		background: #fff;
		border-radius: 10px;
		padding: 7px;
		box-shadow: 0 8px 20px rgb(0 0 0 / 0.18);
	}
	.install-dialog-app {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.install-dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 4px;
		margin-top: 7px;
	}
	.dialog-btn {
		font-size: 6.5px;
		font-weight: 600;
		padding: 3px 7px;
		border-radius: 5px;
	}
	.dialog-btn--ghost {
		color: #71717a;
	}
	.dialog-btn--primary {
		color: #fff;
		background: var(--color-accent);
	}
</style>

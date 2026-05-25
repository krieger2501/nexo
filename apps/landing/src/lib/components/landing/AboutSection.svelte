<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
</script>

<section id="about" class="scroll-mt-20 about-section">
	<div class="about-container">
		<div class="reveal section-head mb-8">
			<div class="t-label">{m.section_about()}</div>
			<h2 class="about-heading">{m.about_heading()}</h2>
			<p class="about-sub">{m.about_sub()}</p>
		</div>

		<!-- Block 1: The stack -->
		<article class="reveal mblock" style="transition-delay: 60ms">
			<div class="mblock-label">{m.about_built_label()}</div>
			<h3 class="mblock-title">{m.about_built_title()}</h3>
			<p class="mblock-body">{m.about_built_desc()}</p>
		</article>

		<div class="reveal divider" style="transition-delay: 80ms" aria-hidden="true">
			<span></span>
		</div>

		<!-- Block 2: The rules — indented -->
		<article
			class="reveal mblock mblock--indent"
			style="transition-delay: 100ms"
		>
			<div class="mblock-label">{m.about_rules_label()}</div>
			<h3 class="mblock-title">{m.about_rules_title()}</h3>
			<p class="mblock-body">{m.about_rules_desc()}</p>
		</article>

		<div class="reveal divider" style="transition-delay: 120ms" aria-hidden="true">
			<span></span>
		</div>

		<!-- Block 3: Who's invited -->
		<article class="reveal mblock" style="transition-delay: 140ms">
			<div class="mblock-label">{m.about_who_label()}</div>
			<h3 class="mblock-title">{m.about_who_title()}</h3>
			<p class="mblock-body">{m.about_who_desc()}</p>
		</article>

		<div class="reveal divider divider--bold" style="transition-delay: 160ms" aria-hidden="true">
			<span></span>
		</div>

		<!-- Block 4: The promise — pull-quote climax -->
		<article class="reveal mblock mblock--quote" style="transition-delay: 180ms">
			<div class="mblock-label">{m.about_wont_label()}</div>
			<div class="mquote-wrap">
				<span class="mquote-mark" aria-hidden="true">“</span>
				<blockquote class="mquote">{m.about_wont_title()}</blockquote>
			</div>
			<p class="mblock-body">{m.about_wont_desc()}</p>
		</article>
	</div>
</section>

<style>
	.about-section {
		padding: 56px 0 72px;
		background: var(--color-bg-0);
		position: relative;
		overflow: hidden;
	}
	.about-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 80%;
		max-width: 480px;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			var(--color-border-default) 30%,
			var(--color-border-default) 70%,
			transparent
		);
	}
	.about-container {
		padding: 0 22px;
		max-width: 480px;
		margin: 0 auto;
	}

	.t-label {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-text-faint);
	}

	.about-heading {
		margin: 8px 0 0;
		font-size: clamp(30px, 7vw, 38px);
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1.05;
	}
	.about-sub {
		margin: 14px 0 0;
		color: var(--color-text-muted);
		font-size: 15px;
		line-height: 1.55;
		max-width: 32ch;
	}

	/* ── Manifesto blocks ── */
	.mblock {
		padding: 28px 0 4px;
		max-width: 26ch;
	}
	.mblock--indent {
		margin-left: auto;
		text-align: right;
	}
	.mblock-label {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-text-faint);
		margin-bottom: 12px;
	}
	.mblock--indent .mblock-label::before {
		content: '— ';
		color: var(--color-accent);
	}
	.mblock--indent .mblock-label::after {
		content: '';
	}
	.mblock-title {
		margin: 0;
		font-size: clamp(26px, 6.4vw, 34px);
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1.08;
		color: var(--color-text-primary);
	}
	.mblock-body {
		margin: 14px 0 0;
		font-size: 14.5px;
		line-height: 1.6;
		color: var(--color-text-muted);
	}
	.mblock--indent .mblock-body {
		margin-left: auto;
		max-width: 26ch;
	}

	/* ── Em-dash divider ── */
	.divider {
		display: flex;
		justify-content: center;
		padding: 22px 0 8px;
	}
	.divider span {
		display: inline-block;
		width: 32px;
		height: 1px;
		background: var(--color-border-default);
	}
	.divider--bold span {
		width: 56px;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			var(--color-accent) 30%,
			var(--color-accent) 70%,
			transparent
		);
	}

	/* ── Pull-quote climax ── */
	.mblock--quote {
		max-width: 100%;
		padding-top: 8px;
		padding-bottom: 8px;
	}
	.mblock--quote .mblock-label {
		color: var(--color-accent);
		margin-bottom: 18px;
	}
	.mquote-wrap {
		display: flex;
		align-items: flex-start;
		gap: 6px;
	}
	.mquote-mark {
		flex-shrink: 0;
		font-family: 'Georgia', 'Times New Roman', serif;
		font-size: clamp(60px, 16vw, 84px);
		font-weight: 700;
		line-height: 0.7;
		color: color-mix(in oklab, var(--color-accent) 35%, transparent);
		letter-spacing: -0.04em;
		margin-top: 0.18em;
		user-select: none;
	}
	.mquote {
		margin: 0;
		padding: 0;
		font-size: clamp(32px, 8.4vw, 44px);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.05;
		color: var(--color-text-primary);
		background: linear-gradient(
			170deg,
			var(--color-text-primary) 0%,
			color-mix(in oklab, var(--color-accent) 60%, var(--color-text-primary)) 100%
		);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.mblock--quote .mblock-body {
		margin-top: 18px;
		font-size: 14.5px;
		font-style: italic;
		color: var(--color-text-muted);
		line-height: 1.6;
	}
</style>

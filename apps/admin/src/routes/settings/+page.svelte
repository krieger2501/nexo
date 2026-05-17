<script lang="ts">
	import { settings, persistSettings } from '$lib/settings.svelte';

	let { data } = $props();

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		settings.logDark;
		void settings.logWrap;
		void settings.logDensity;
		void settings.timeMode;
		persistSettings();
	});

	const densityOptions: Array<{ value: typeof settings.logDensity; label: string }> = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'regular', label: 'Regular' },
		{ value: 'comfy', label: 'Comfy' }
	];

	const timeModeOptions: Array<{ value: typeof settings.timeMode; label: string }> = [
		{ value: 'rel', label: 'Relative' },
		{ value: 'abs', label: 'Absolute' }
	];
</script>

<div class="settings-page">
	<!-- Logs section -->
	<section class="section">
		<h2 class="section-title">Logs</h2>

		<div class="card">
			<label class="row toggle-row">
				<div class="row-text">
					<span class="row-label">Dark log panel</span>
					<span class="row-sub">High-contrast background for log viewer</span>
				</div>
				<button
					type="button"
					class="toggle"
					class:on={settings.logDark}
					role="switch"
					aria-checked={settings.logDark}
					aria-label="Dark log panel"
					onclick={() => (settings.logDark = !settings.logDark)}
				></button>
			</label>

			<div class="divider"></div>

			<label class="row toggle-row">
				<div class="row-text">
					<span class="row-label">Wrap long lines</span>
					<span class="row-sub">Wrap instead of horizontal scroll</span>
				</div>
				<button
					type="button"
					class="toggle"
					class:on={settings.logWrap}
					role="switch"
					aria-checked={settings.logWrap}
					aria-label="Wrap long lines"
					onclick={() => (settings.logWrap = !settings.logWrap)}
				></button>
			</label>

			<div class="divider"></div>

			<div class="row segment-row">
				<div class="row-text">
					<span class="row-label">Density</span>
					<span class="row-sub">Spacing between log lines</span>
				</div>
				<div class="segment" role="group" aria-label="Density">
					{#each densityOptions as opt (opt.value)}
						<button
							type="button"
							class="seg-btn"
							class:active={settings.logDensity === opt.value}
							onclick={() => (settings.logDensity = opt.value)}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="divider"></div>

			<div class="row segment-row">
				<div class="row-text">
					<span class="row-label">Timestamps</span>
					<span class="row-sub">How times are displayed in logs</span>
				</div>
				<div class="segment" role="group" aria-label="Timestamps">
					{#each timeModeOptions as opt (opt.value)}
						<button
							type="button"
							class="seg-btn"
							class:active={settings.timeMode === opt.value}
							onclick={() => (settings.timeMode = opt.value)}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- About section -->
	<section class="section">
		<h2 class="section-title">About</h2>

		<div class="card">
			<div class="row">
				<span class="row-label">App</span>
				<span class="row-value">Nexo Admin</span>
			</div>

			<div class="divider"></div>

			<div class="row">
				<span class="row-label">Signed in as</span>
				<span class="row-value">{data.user?.email ?? '—'}</span>
			</div>
		</div>
	</section>
</div>

<style>
	/* global: .section-title, .toggle, .toggle.on */

	.settings-page {
		padding: 20px 16px 32px;
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	/* ── Section ── */
	.section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* ── Card ── */
	.card {
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.divider {
		height: 1px;
		background: var(--color-border-subtle);
		margin: 0 16px;
	}

	/* ── Row ── */
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 16px;
		min-height: 52px;
	}

	.row-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.row-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.row-sub {
		font-size: 12px;
		color: var(--color-text-subtle);
	}

	.row-value {
		font-size: 13px;
		color: var(--color-text-subtle);
		text-align: right;
		max-width: 60%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.toggle-row {
		cursor: pointer;
	}

	.segment-row {
		flex-wrap: wrap;
		gap: 10px;
	}

	/* ── Segmented control ── */
	.segment {
		display: flex;
		border-radius: var(--radius-md);
		overflow: hidden;
		border: 1px solid var(--color-border-default);
	}

	.seg-btn {
		flex: 1;
		padding: 5px 10px;
		font-size: 12px;
		font-weight: 500;
		border: none;
		background: transparent;
		color: var(--color-text-subtle);
		cursor: pointer;
		transition:
			background var(--duration-fast) var(--ease-out),
			color var(--duration-fast) var(--ease-out);
		white-space: nowrap;
	}

	.seg-btn + .seg-btn {
		border-left: 1px solid var(--color-border-default);
	}

	.seg-btn.active {
		background: color-mix(in oklab, var(--color-accent) 12%, transparent);
		color: var(--accent-ink);
		font-weight: 600;
	}
</style>

<script lang="ts">
	interface HistoryRow {
		checkedAt: Date | string;
		ok: boolean;
		latencyMs: number | null;
	}

	interface Props {
		history: HistoryRow[];
		buckets?: number;
		windowMs?: number;
	}

	let { history, buckets = 48, windowMs = 24 * 60 * 60 * 1000 }: Props = $props();

	type BucketState = 'ok' | 'warn' | 'err' | 'empty';
	interface Bucket {
		state: BucketState;
		total: number;
		passing: number;
	}

	const bucketed = $derived.by(() => {
		const now = Date.now();
		const start = now - windowMs;
		const bucketMs = windowMs / buckets;
		const arr: Bucket[] = Array.from({ length: buckets }, () => ({
			state: 'empty',
			total: 0,
			passing: 0
		}));
		for (const row of history) {
			const t = new Date(row.checkedAt).getTime();
			if (t < start || t > now) continue;
			const idx = Math.min(buckets - 1, Math.max(0, Math.floor((t - start) / bucketMs)));
			arr[idx]!.total += 1;
			if (row.ok) arr[idx]!.passing += 1;
		}
		for (const b of arr) {
			if (b.total === 0) b.state = 'empty';
			else if (b.passing === b.total) b.state = 'ok';
			else if (b.passing === 0) b.state = 'err';
			else b.state = 'warn';
		}
		return arr;
	});

	const totals = $derived.by(() => {
		const start = Date.now() - windowMs;
		let total = 0;
		let passing = 0;
		let firstSeen: number | null = null;
		for (const row of history) {
			const t = new Date(row.checkedAt).getTime();
			if (t < start) continue;
			if (firstSeen === null || t < firstSeen) firstSeen = t;
			total += 1;
			if (row.ok) passing += 1;
		}
		return { total, passing, firstSeen };
	});

	const uptimePct = $derived(
		totals.total > 0 ? Math.round((totals.passing / totals.total) * 1000) / 10 : null
	);

	const tone = $derived<'ok' | 'warn' | 'err' | 'mute'>(
		uptimePct === null ? 'mute' : uptimePct >= 99.5 ? 'ok' : uptimePct >= 95 ? 'warn' : 'err'
	);

	// Show "data starts at" hint when window is only partially covered
	const coverageHint = $derived.by(() => {
		if (totals.firstSeen === null) return null;
		const ageMs = Date.now() - totals.firstSeen;
		// Only show if first record is meaningfully inside the window (>30min in)
		if (ageMs > windowMs - 30 * 60 * 1000) return null;
		const hours = Math.floor(ageMs / (60 * 60 * 1000));
		const mins = Math.floor((ageMs % (60 * 60 * 1000)) / (60 * 1000));
		if (hours === 0) return `tracking since ${mins}m ago`;
		return `tracking since ${hours}h ${mins}m ago`;
	});

	const fmtBucketTitle = (i: number, b: Bucket) => {
		const start = Date.now() - windowMs;
		const bucketMs = windowMs / buckets;
		const t0 = new Date(start + i * bucketMs);
		const label = t0.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
		if (b.total === 0) return `${label} · no checks`;
		return `${label} · ${b.passing}/${b.total} passing`;
	};
</script>

<div class="uptime">
	<div class="uptime-h">
		<div class="uptime-label">24h uptime</div>
		{#if totals.total > 0}
			<div class="uptime-checks">{totals.passing} / {totals.total} checks</div>
		{/if}
	</div>

	{#if uptimePct === null}
		<div class="uptime-empty">
			<div class="uptime-empty-em">▁</div>
			<div class="uptime-empty-msg">No checks recorded yet</div>
			<div class="uptime-empty-hint">Recheck above to start tracking</div>
		</div>
	{:else}
		<div class="uptime-pct {tone}">
			{uptimePct}<span class="uptime-pct-unit">%</span>
		</div>

		<div class="uptime-bars" role="img" aria-label="24-hour uptime sparkline">
			{#each bucketed as b, i (i)}
				<span class="bar {b.state}" title={fmtBucketTitle(i, b)}></span>
			{/each}
		</div>
		<div class="uptime-axis">
			<span>24h ago</span>
			<span class="uptime-axis-mid">12h</span>
			<span>now</span>
		</div>

		{#if coverageHint}
			<div class="uptime-coverage">{coverageHint}</div>
		{/if}
	{/if}
</div>

<style>
	.uptime {
		margin-top: 14px;
		padding: 14px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-md);
		box-sizing: border-box;
		max-width: 100%;
		overflow: hidden;
	}
	.uptime-h {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 4px;
	}
	.uptime-label {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-subtle);
	}
	.uptime-checks {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-text-subtle);
	}

	.uptime-pct {
		font-size: 28px;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.1;
		margin: 2px 0 12px;
		font-variant-numeric: tabular-nums;
	}
	.uptime-pct.ok {
		color: var(--accent-ink);
	}
	.uptime-pct.warn {
		color: var(--warn-ink);
	}
	.uptime-pct.err {
		color: var(--err-ink);
	}
	.uptime-pct.mute {
		color: var(--color-text-faint);
	}
	.uptime-pct-unit {
		font-size: 18px;
		opacity: 0.7;
		margin-left: 1px;
	}

	.uptime-bars {
		display: flex;
		gap: 2px;
		height: 26px;
		align-items: stretch;
		min-width: 0;
		width: 100%;
	}
	.bar {
		flex: 1 1 0;
		min-width: 0;
		border-radius: 2px;
		background: var(--color-bg-2);
		/* dotted hint for empty buckets so they aren't invisible */
		background-image: linear-gradient(
			to bottom,
			transparent 0,
			transparent 11px,
			color-mix(in oklab, var(--color-border-default) 80%, transparent) 11px,
			color-mix(in oklab, var(--color-border-default) 80%, transparent) 13px,
			transparent 13px
		);
	}
	.bar.ok {
		background: var(--accent-ink);
		background-image: none;
		opacity: 0.85;
	}
	.bar.warn {
		background: var(--warn-ink);
		background-image: none;
	}
	.bar.err {
		background: var(--err-ink);
		background-image: none;
	}

	.uptime-axis {
		display: flex;
		justify-content: space-between;
		margin-top: 6px;
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--color-text-faint);
	}
	.uptime-axis-mid {
		opacity: 0.7;
	}

	.uptime-coverage {
		margin-top: 8px;
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--color-text-faint);
		font-style: italic;
	}

	.uptime-empty {
		text-align: center;
		padding: 16px 8px 8px;
		color: var(--color-text-subtle);
	}
	.uptime-empty-em {
		font-size: 28px;
		opacity: 0.35;
		line-height: 1;
		font-family: var(--font-mono);
	}
	.uptime-empty-msg {
		margin-top: 6px;
		font-size: 13px;
	}
	.uptime-empty-hint {
		margin-top: 2px;
		font-size: 11px;
		color: var(--color-text-faint);
	}
</style>

<script lang="ts">
	import type { ContainerInfo } from '$lib/server/docker';
	import { Activity, TrendingDown, TrendingUp, Users } from 'lucide-svelte';
	import { ctnName, ctnGroup } from '$lib/utils/containers';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import FilterChips from '$lib/components/FilterChips.svelte';
	import ContainerCard from './ContainerCard.svelte';

	let { data } = $props();

	// ── Grouping ──────────────────────────────────────────────────────────────

	const GROUP_ORDER = ['core', 'app', 'data', 'infra'];
	const GROUP_LABELS: Record<string, string> = {
		core: 'Core',
		app: 'Apps',
		data: 'Data',
		infra: 'Infra'
	};

	let filter = $state<'all' | 'running' | 'issues' | 'stopped'>('all');
	let query = $state('');

	const counts = $derived({
		all: data.containers.length,
		running: data.containers.filter(
			(c) => c.State.toLowerCase() === 'running' && c.State.toLowerCase() !== 'restarting'
		).length,
		issues: data.containers.filter((c) => c.State.toLowerCase() === 'restarting').length,
		stopped: data.containers.filter(
			(c) => c.State.toLowerCase() === 'exited' || c.State.toLowerCase() === 'dead'
		).length
	});

	const filtered = $derived(
		data.containers.filter((c) => {
			const s = c.State.toLowerCase();
			if (filter === 'running' && s !== 'running') return false;
			if (filter === 'issues' && s !== 'restarting') return false;
			if (filter === 'stopped' && s !== 'exited' && s !== 'dead') return false;
			if (query) {
				const q = query.trim().toLowerCase();
				const search = (ctnName(c) + ' ' + c.Image + ' ' + c.Status).toLowerCase();
				if (!search.includes(q)) return false;
			}
			return true;
		})
	);

	const grouped = $derived(() => {
		const g: Record<string, ContainerInfo[]> = {};
		for (const c of filtered) {
			const grp = ctnGroup(c);
			(g[grp] ??= []).push(c);
		}
		return g;
	});

	const runningCount = $derived(
		data.containers.filter((c) => c.State.toLowerCase() === 'running').length
	);
	const issueCount = $derived(
		data.containers.filter((c) => c.State.toLowerCase() === 'restarting').length
	);

	// ── DB stats ──────────────────────────────────────────────────────────────
	const totals = $derived(data.dbStats.totals);
	const activity = $derived(data.dbStats.activity);

	const activityRows = $derived([
		{ label: 'New users', icon: Users, ...activity.users },
		{ label: 'Expenses added', icon: TrendingDown, ...activity.expenses },
		{ label: 'Income added', icon: TrendingUp, ...activity.income }
	]);
</script>

<div class="screen">
	<!-- Header -->
	<div>
		<div class="label-eyebrow">Containers</div>
		<h1 class="screen-title">
			{runningCount} running
		</h1>
		<div class="screen-sub">
			{#if issueCount > 0}
				<span style="color:var(--err-ink);font-weight:600">{issueCount} need attention</span> · {counts.stopped}
				stopped
			{:else}
				All running · {counts.stopped} stopped
			{/if}
		</div>
	</div>

	<!-- Summary cards -->
	<div class="summary">
		<div class="summary-card">
			<div class="summary-num {issueCount > 0 ? 'warn' : 'ok'}">
				{runningCount}<span style="font-size:16px;color:var(--color-text-faint)">/{counts.all}</span
				>
			</div>
			<div class="summary-label">up</div>
			<div class="summary-sub">across {GROUP_ORDER.length} groups</div>
		</div>
		<div class="summary-card">
			<div class="summary-num {issueCount > 0 ? 'err' : 'ok'}">{issueCount}</div>
			<div class="summary-label">issues</div>
			<div class="summary-sub">{issueCount > 0 ? 'Tap to filter' : 'All checks passing'}</div>
		</div>
	</div>

	<!-- Search -->
	<SearchInput bind:value={query} placeholder="Filter containers…" />

	<!-- Chips -->
	<FilterChips
		bind:value={filter}
		options={[
			{ value: 'all', label: 'All', count: counts.all },
			{ value: 'running', label: 'Healthy', count: counts.running },
			{ value: 'issues', label: 'Issues', count: issueCount },
			{ value: 'stopped', label: 'Stopped', count: counts.stopped }
		]}
	/>

	<!-- Grouped container list -->
	<div class="groups">
		{#each GROUP_ORDER as grp (grp)}
			{#if grouped()[grp]?.length}
				<div>
					<div class="group-h">
						<span>{GROUP_LABELS[grp]}</span>
						<span class="count">{grouped()[grp].length}</span>
					</div>
					<div class="row-stack">
						{#each grouped()[grp] as c (c.Id)}
							<ContainerCard container={c} />
						{/each}
					</div>
				</div>
			{/if}
		{/each}

		{#if filtered.length === 0}
			<div class="empty">
				<div class="em">○</div>
				{query ? 'Nothing matches.' : 'No containers found.'}
			</div>
		{/if}
	</div>

	<!-- DB totals -->
	<div class="section-header">
		<svg
			class="section-icon"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<ellipse cx="12" cy="5" rx="9" ry="3" />
			<path d="M21 5v6c0 1.66-4.03 3-9 3S3 12.66 3 11V5" />
			<path d="M21 11v6c0 1.66-4.03 3-9 3s-9-1.34-9-3v-6" />
		</svg>
		<span class="section-title">Database</span>
	</div>
	<div class="row-stack">
		{#each [['Users', totals.users], ['Accounts', totals.accounts], ['Expenses', totals.expenses], ['Income', totals.income], ['Debts', totals.debts]] as [lbl, val] (lbl)}
			<div class="kv">
				<span class="k">{lbl}</span>
				<span class="v mono">{val}</span>
			</div>
		{/each}
	</div>

	<!-- Activity -->
	<div class="section-header">
		<Activity size={14} class="section-icon" />
		<span class="section-title">Activity</span>
	</div>
	<div class="row-stack">
		{#each activityRows as row (row.label)}
			<div class="act-row">
				<div class="act-icon"><row.icon size={14} /></div>
				<span class="act-label">{row.label}</span>
				<div class="act-counts">
					<span class="act-val accent">{row.today}</span>
					<span class="act-sep">·</span>
					<span class="act-val">{row.week}</span>
					<span class="act-sep">·</span>
					<span class="act-val muted">{row.month}</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.screen {
		gap: 16px; /* local reminder — matches global */
	}

	/* ── Summary cards ── */
	.summary {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.summary-card {
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-md);
		padding: 12px 14px;
	}

	.summary-num {
		font-size: 28px;
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1;
	}

	.summary-num.warn {
		color: var(--warn-ink);
	}
	.summary-num.err {
		color: var(--err-ink);
	}
	.summary-num.ok {
		color: var(--accent-ink);
	}

	.summary-label {
		color: var(--color-text-subtle);
		font-size: 12px;
		margin-top: 4px;
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.summary-sub {
		color: var(--color-text-faint);
		font-size: 11px;
		margin-top: 2px;
	}

	/* ── Groups ── */
	.groups {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.group-h {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 4px;
		color: var(--color-text-subtle);
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.group-h .count {
		color: var(--color-text-faint);
	}

	/* ── Empty ── */
	.empty {
		text-align: center;
		padding: 32px 24px;
		color: var(--color-text-muted);
	}

	.empty .em {
		font-size: 32px;
		margin-bottom: 8px;
		opacity: 0.4;
	}

	/* ── DB / Activity section ── */
	.section-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.section-header :global(.section-icon) {
		width: 14px;
		height: 14px;
		color: var(--color-text-faint);
	}

	.section-icon {
		width: 14px;
		height: 14px;
		color: var(--color-text-faint);
		flex-shrink: 0;
	}

	/* ── Activity list ── */
	.act-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.act-row:last-child {
		border-bottom: 0;
	}

	.act-icon {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		background: var(--color-bg-2);
		color: var(--color-text-muted);
	}

	.act-label {
		flex: 1;
		font-size: 14px;
		font-weight: 500;
	}

	.act-counts {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 13px;
	}

	.act-val {
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.act-val.accent {
		color: var(--accent-ink);
	}

	.act-val.muted {
		color: var(--color-text-subtle);
	}

	.act-sep {
		color: var(--color-text-faint);
	}
</style>

<script lang="ts">
	import type { EnrichedContainer } from './+page.server';
	import { Activity, MoreHorizontal, TrendingDown, TrendingUp, Users } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { BottomSheet, PageHeader } from '@nexo/ui';
	import {
		ctnName,
		ctnGroup,
		ctnHasIssue,
		ctnIsHealthy,
		ctnIsStopped
	} from '$lib/utils/containers';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import FilterChips from '$lib/components/FilterChips.svelte';
	import UserAvatarMenu from '$lib/components/UserAvatarMenu.svelte';
	import ContainerCard from './ContainerCard.svelte';

	let { data, form } = $props();

	// ── Greeting ──────────────────────────────────────────────────────────────
	const firstName = $derived(
		((data.profile?.displayName || data.profile?.name || data.user?.name) ?? '').split(' ')[0] ||
			'there'
	);
	const todayLabel = $derived(
		new Date().toLocaleDateString('de-DE', {
			weekday: 'long',
			day: '2-digit',
			month: 'short'
		})
	);

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
	let menuOpen = $state(false);
	let confirmOpen = $state(false);
	let confirmProfile = $state<'production' | 'preview'>('production');
	let busy = $state(false);
	let menuWrap = $state<HTMLDivElement | null>(null);

	function onMenuDocClick(e: MouseEvent) {
		if (!menuOpen || !menuWrap) return;
		if (!menuWrap.contains(e.target as Node)) menuOpen = false;
	}

	function onMenuKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) menuOpen = false;
	}

	const productionContainers = $derived(data.containers.filter((c) => c.Profile === 'production'));
	const previewContainers = $derived(data.containers.filter((c) => c.Profile === 'preview'));

	const prodCounts = $derived({
		all: productionContainers.length,
		running: productionContainers.filter(ctnIsHealthy).length,
		issues: productionContainers.filter(ctnHasIssue).length,
		stopped: productionContainers.filter(ctnIsStopped).length
	});

	const previewCounts = $derived({
		all: previewContainers.length,
		running: previewContainers.filter(ctnIsHealthy).length,
		issues: previewContainers.filter(ctnHasIssue).length,
		stopped: previewContainers.filter(ctnIsStopped).length
	});

	function applyFilters(list: EnrichedContainer[]): EnrichedContainer[] {
		return list.filter((c) => {
			if (filter === 'running' && !ctnIsHealthy(c)) return false;
			if (filter === 'issues' && !ctnHasIssue(c)) return false;
			if (filter === 'stopped' && !ctnIsStopped(c)) return false;
			if (query) {
				const q = query.trim().toLowerCase();
				const search = (ctnName(c) + ' ' + c.Image + ' ' + c.Status).toLowerCase();
				if (!search.includes(q)) return false;
			}
			return true;
		});
	}

	const prodFiltered = $derived(applyFilters(productionContainers));
	const previewFiltered = $derived(applyFilters(previewContainers));

	function groupBy(list: EnrichedContainer[]): Record<string, EnrichedContainer[]> {
		const g: Record<string, EnrichedContainer[]> = {};
		for (const c of list) {
			const grp = ctnGroup(c);
			(g[grp] ??= []).push(c);
		}
		return g;
	}

	const prodGrouped = $derived(groupBy(prodFiltered));
	const previewGrouped = $derived(groupBy(previewFiltered));

	const attentionProd = $derived(productionContainers.filter(ctnHasIssue));
	const attentionPreview = $derived(previewContainers.filter(ctnHasIssue));

	function profileTargetCount(p: 'production' | 'preview'): number {
		return data.containers.filter((c) => c.Profile === p).length;
	}
</script>

<svelte:window onclick={onMenuDocClick} onkeydown={onMenuKey} />

<div class="screen">
	<PageHeader title="Hey, {firstName}" subtitle={todayLabel}>
		{#snippet actions()}
			<div class="menu-wrap" bind:this={menuWrap}>
				<button
					class="hdr-action"
					type="button"
					aria-label="More"
					aria-expanded={menuOpen}
					aria-haspopup="menu"
					onclick={() => (menuOpen = !menuOpen)}
				>
					<MoreHorizontal size={18} />
				</button>
				{#if menuOpen}
					<div class="menu-pop" role="menu">
						<button
							class="pop-row"
							type="button"
							role="menuitem"
							disabled={profileTargetCount('production') === 0}
							onclick={() => {
								menuOpen = false;
								confirmProfile = 'production';
								confirmOpen = true;
							}}
						>
							<span class="pop-label">Restart all production</span>
							<span class="pop-meta">{profileTargetCount('production')}</span>
						</button>
						<button
							class="pop-row"
							type="button"
							role="menuitem"
							disabled={profileTargetCount('preview') === 0}
							onclick={() => {
								menuOpen = false;
								confirmProfile = 'preview';
								confirmOpen = true;
							}}
						>
							<span class="pop-label">Restart all preview</span>
							<span class="pop-meta">{profileTargetCount('preview')}</span>
						</button>
						<button
							class="pop-row"
							type="button"
							role="menuitem"
							onclick={() => {
								menuOpen = false;
								location.reload();
							}}
						>
							<span class="pop-label">Refresh status</span>
						</button>
					</div>
				{/if}
			</div>
		{/snippet}
		{#snippet avatar()}
			<UserAvatarMenu />
		{/snippet}
	</PageHeader>

	<!-- Summary heading -->
	<div class="head-line">
		{#if prodCounts.issues > 0}
			<span class="err-text">{prodCounts.issues} need attention</span> · {prodCounts.stopped} stopped
		{:else}
			All running · {prodCounts.stopped} stopped
		{/if}
	</div>

	{#if form?.error === 'RESTART_PARTIAL'}
		<div class="banner err">
			Some containers failed to restart: {form.failed?.join(', ')}
		</div>
	{/if}

	<!-- Summary cards (production-only) -->
	<div class="summary">
		<div class="summary-card">
			<div class="summary-num {prodCounts.issues > 0 ? 'warn' : 'ok'}">
				{prodCounts.running}<span style="font-size:16px;color:var(--color-text-faint)"
					>/{prodCounts.all}</span
				>
			</div>
			<div class="summary-label">up · prod</div>
			<div class="summary-sub">across {GROUP_ORDER.length} groups</div>
		</div>
		<div class="summary-card">
			<div class="summary-num {prodCounts.issues > 0 ? 'err' : 'ok'}">{prodCounts.issues}</div>
			<div class="summary-label">issues · prod</div>
			<div class="summary-sub">
				{prodCounts.issues > 0 ? 'Tap a card to drill in' : 'All checks passing'}
			</div>
		</div>
	</div>

	{#if attentionProd.length > 0 || attentionPreview.length > 0}
		<div class="attention">
			<div class="attention-h">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
					<path d="M8 1.5l7 12.5H1L8 1.5z" stroke-linejoin="round" />
					<path d="M8 6.5v3.5M8 12v.01" stroke-linecap="round" />
				</svg>
				<span>Needs attention</span>
				<span class="attention-count">{attentionProd.length + attentionPreview.length}</span>
			</div>
			{#if attentionProd.length > 0}
				<div class="row-stack">
					{#each attentionProd as c (c.Id)}
						<a class="att-row" href="/services/{(c.Names[0] ?? c.Id).replace(/^\//, '')}">
							<span class="att-name">{ctnName(c)}</span>
							<span class="att-state">{c.Status || c.State}</span>
						</a>
					{/each}
				</div>
			{/if}
			{#if attentionPreview.length > 0}
				<div class="att-preview-label">Preview</div>
				<div class="row-stack">
					{#each attentionPreview as c (c.Id)}
						<a
							class="att-row att-row-preview"
							href="/services/{(c.Names[0] ?? c.Id).replace(/^\//, '')}"
						>
							<span class="att-name">{ctnName(c)}</span>
							<span class="att-state">{c.Status || c.State}</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Search -->
	<SearchInput bind:value={query} placeholder="Filter containers…" />

	<!-- Status chips -->
	<FilterChips
		bind:value={filter}
		options={[
			{ value: 'all', label: 'All', count: prodCounts.all + previewCounts.all },
			{
				value: 'running',
				label: 'Healthy',
				count: prodCounts.running + previewCounts.running
			},
			{
				value: 'issues',
				label: 'Issues',
				count: prodCounts.issues + previewCounts.issues
			},
			{
				value: 'stopped',
				label: 'Stopped',
				count: prodCounts.stopped + previewCounts.stopped
			}
		]}
	/>

	<!-- Production -->
	<section class="profile-section">
		<div class="profile-h">
			<span class="profile-h-title">Production</span>
			<span class="profile-h-meta">
				{prodCounts.running}/{prodCounts.all} up{prodCounts.issues > 0
					? ` · ${prodCounts.issues} issues`
					: ''}
			</span>
		</div>
		<div class="groups">
			{#each GROUP_ORDER as grp (grp)}
				{#if prodGrouped[grp]?.length}
					<div>
						<div class="group-h">
							<span>{GROUP_LABELS[grp]}</span>
							<span class="count">{prodGrouped[grp].length}</span>
						</div>
						<div class="row-stack">
							{#each prodGrouped[grp] as c (c.Id)}
								<ContainerCard container={c} />
							{/each}
						</div>
					</div>
				{/if}
			{/each}

			{#if prodFiltered.length === 0}
				<div class="empty">
					<div class="em">○</div>
					{query ? 'Nothing matches.' : 'No production containers.'}
				</div>
			{/if}
		</div>
	</section>

	<!-- Preview (secondary) -->
	{#if previewCounts.all > 0}
		<section class="profile-section profile-section-preview">
			<div class="profile-h">
				<span class="profile-h-title">Preview</span>
				<span class="profile-h-meta">
					{previewCounts.running}/{previewCounts.all} up{previewCounts.issues > 0
						? ` · ${previewCounts.issues} issues`
						: ''}
				</span>
			</div>
			<div class="profile-h-sub">staging traffic · not user-facing</div>
			<div class="groups">
				{#each GROUP_ORDER as grp (grp)}
					{#if previewGrouped[grp]?.length}
						<div>
							<div class="group-h">
								<span>{GROUP_LABELS[grp]}</span>
								<span class="count">{previewGrouped[grp].length}</span>
							</div>
							<div class="row-stack">
								{#each previewGrouped[grp] as c (c.Id)}
									<ContainerCard container={c} />
								{/each}
							</div>
						</div>
					{/if}
				{/each}

				{#if previewFiltered.length === 0}
					<div class="empty empty-preview">
						<div class="em">○</div>
						{query ? 'Nothing matches in preview.' : 'No preview containers running.'}
					</div>
				{/if}
			</div>
		</section>
	{/if}

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
	{#await data.dbStats}
		<div class="row-stack">
			{#each ['Users', 'Accounts', 'Expenses', 'Income', 'Debts'] as lbl (lbl)}
				<div class="kv">
					<span class="k">{lbl}</span>
					<span class="v mono shimmer">—</span>
				</div>
			{/each}
		</div>
	{:then stats}
		<div class="row-stack">
			{#each [['Users', stats.totals.users], ['Accounts', stats.totals.accounts], ['Expenses', stats.totals.expenses], ['Income', stats.totals.income], ['Debts', stats.totals.debts]] as [lbl, val] (lbl)}
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
			{#each [{ label: 'New users', icon: Users, ...stats.activity.users }, { label: 'Expenses added', icon: TrendingDown, ...stats.activity.expenses }, { label: 'Income added', icon: TrendingUp, ...stats.activity.income }] as row (row.label)}
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
	{/await}
</div>

<BottomSheet bind:open={confirmOpen} title="Restart {confirmProfile} containers?">
	<p class="confirm-body">
		This will restart all <strong>{profileTargetCount(confirmProfile)}</strong> containers in the
		<strong>{confirmProfile}</strong>
		profile in parallel. Each container has 10s to stop gracefully.
	</p>
	<form
		method="POST"
		action="?/restartProfile"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
				confirmOpen = false;
			};
		}}
	>
		<input type="hidden" name="profile" value={confirmProfile} />
		<div class="confirm-actions">
			<button
				class="btn-secondary"
				type="button"
				onclick={() => (confirmOpen = false)}
				disabled={busy}
			>
				Cancel
			</button>
			<button class="btn-danger" type="submit" disabled={busy}>
				{busy ? 'Restarting…' : 'Restart all'}
			</button>
		</div>
	</form>
</BottomSheet>

<style>
	.screen {
		gap: 16px;
	}

	/* ── Header action button ── */
	.hdr-action {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		color: var(--color-text-subtle);
		cursor: pointer;
	}

	.menu-wrap {
		position: relative;
		display: inline-flex;
	}

	.menu-pop {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		z-index: 60;
		min-width: 220px;
		padding: 6px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-md, 12px);
		box-shadow:
			0 12px 32px -12px rgba(0, 0, 0, 0.18),
			0 2px 6px rgba(0, 0, 0, 0.06);
		display: flex;
		flex-direction: column;
		gap: 2px;
		animation: pop-in 140ms var(--ease-out, ease-out);
	}

	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.pop-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		font: inherit;
		font-size: 13.5px;
		color: var(--color-text-primary);
		background: transparent;
		border: none;
		text-align: left;
		border-radius: 8px;
		cursor: pointer;
	}
	.pop-row:hover {
		background: var(--color-bg-1);
	}
	.pop-row:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.pop-row:disabled:hover {
		background: transparent;
	}
	.pop-label {
		font-weight: 500;
	}
	.pop-meta {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-text-subtle);
	}

	.head-line {
		font-size: 13px;
		color: var(--color-text-subtle);
		padding: 0 4px;
	}

	.err-text {
		color: var(--err-ink);
		font-weight: 600;
	}

	.banner {
		padding: 10px 14px;
		border-radius: var(--radius-md);
		font-size: 13px;
		border: 1px solid;
	}
	.banner.err {
		background: color-mix(in oklab, var(--err-ink) 8%, transparent);
		border-color: color-mix(in oklab, var(--err-ink) 30%, transparent);
		color: var(--err-ink);
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

	/* ── Attention ── */
	.attention {
		background: color-mix(in oklab, var(--err-ink) 6%, var(--color-surface-1));
		border: 1px solid color-mix(in oklab, var(--err-ink) 25%, transparent);
		border-radius: var(--radius-md);
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.attention-h {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--err-ink);
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.attention-h svg {
		width: 12px;
		height: 12px;
	}
	.attention-count {
		margin-left: auto;
		color: var(--err-ink);
		opacity: 0.7;
	}
	.att-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 10px;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-subtle);
	}
	.att-row:active {
		background: var(--color-bg-1);
	}
	.att-name {
		flex: 1;
		min-width: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.att-state {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--err-ink);
		flex-shrink: 0;
		max-width: 55%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ── Groups ── */
	.groups {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* ── Profile sections ── */
	.profile-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.profile-h {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		padding: 0 4px;
	}

	.profile-h-title {
		font-size: 19px;
		font-weight: 600;
		letter-spacing: -0.015em;
		color: var(--color-text-primary);
	}

	.profile-h-meta {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-text-subtle);
	}

	.profile-h-sub {
		font-size: 11px;
		color: var(--color-text-faint);
		font-style: italic;
		padding: 0 4px;
		margin-top: -2px;
	}

	.profile-section-preview {
		opacity: 0.78;
		margin-top: 8px;
		padding-top: 16px;
		border-top: 1px dashed var(--color-border-subtle);
	}

	.profile-section-preview .profile-h-title {
		font-size: 15px;
		color: var(--color-text-muted, var(--color-text-subtle));
		font-weight: 500;
	}

	.empty-preview {
		padding: 16px 24px;
		font-size: 12.5px;
	}

	.att-preview-label {
		font-family: var(--font-mono);
		font-size: 9px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--err-ink);
		opacity: 0.65;
		padding: 4px 2px 0;
	}

	.att-row-preview {
		opacity: 0.85;
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

	.shimmer {
		color: var(--color-text-faint);
		opacity: 0.5;
		animation: shimmer 1.2s ease-in-out infinite;
	}
	@keyframes shimmer {
		50% {
			opacity: 0.85;
		}
	}

	/* ── Bottom-sheet menu ── */
	.confirm-body {
		color: var(--color-text-subtle);
		font-size: 14px;
		line-height: 1.5;
		margin: 0 0 16px;
	}

	.confirm-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}

	.btn-secondary,
	.btn-danger {
		padding: 10px 16px;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid var(--color-border-default);
		background: var(--color-surface-1);
		color: var(--color-text-primary);
	}
	.btn-danger {
		background: var(--err-ink);
		border-color: var(--err-ink);
		color: white;
	}
	.btn-secondary:disabled,
	.btn-danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

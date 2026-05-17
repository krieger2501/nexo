<script lang="ts">
	import { fmtRelative, initials, displayName, entryStatus } from '$lib/utils';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import FilterChips from '$lib/components/FilterChips.svelte';

	type Entry =
		| {
				type: 'user';
				id: string;
				email: string;
				name: string;
				image: string | null;
				createdAt: string;
				allowed: boolean;
				apps: string[];
		  }
		| {
				type: 'invited';
				id: null;
				email: string;
				name: null;
				image: null;
				createdAt: string;
				allowed: boolean;
				apps: string[];
		  };

	type FilterStatus = 'all' | 'active' | 'invited' | 'blocked';

	interface Props {
		entries: Entry[];
		counts: { all: number; active: number; invited: number; blocked: number };
		searchQuery: string;
		filterStatus: FilterStatus;
		onopendetail: (entry: Entry) => void;
		onopeninvite: () => void;
	}

	let {
		entries,
		counts,
		searchQuery = $bindable(''),
		filterStatus = $bindable('all' as FilterStatus),
		onopendetail,
		onopeninvite
	}: Props = $props();
</script>

<div class="screen fade-in">
	<div>
		<div class="label-eyebrow">Users</div>
		<h1 class="screen-title">{counts.active} active</h1>
		<div class="screen-sub">
			{#if counts.invited > 0}
				<span style="color:var(--warn-ink)">{counts.invited} pending</span> ·
			{/if}
			{counts.all} total
		</div>
	</div>

	<SearchInput bind:value={searchQuery} placeholder="Search by email or name…" />

	<FilterChips
		bind:value={filterStatus}
		options={[
			{ value: 'all', label: 'All', count: counts.all },
			{ value: 'active', label: 'Active', count: counts.active },
			{ value: 'invited', label: 'Pending', count: counts.invited },
			{ value: 'blocked', label: 'Blocked', count: counts.blocked }
		]}
	/>

	<div class="row-stack">
		{#each entries as entry (entry.email)}
			{@const status = entryStatus(entry)}
			<button type="button" class="user-row" onclick={() => onopendetail(entry)}>
				<div class="avatar" class:owner={entry.type === 'user' && entry.allowed}>
					{initials(entry)}
				</div>
				<div class="user-body">
					<div class="user-name ellipsis">{displayName(entry)}</div>
					<div class="user-email ellipsis">{entry.email}</div>
					{#if status === 'active'}
						<div class="user-meta">
							{entry.apps.length} app{entry.apps.length === 1 ? '' : 's'} · {fmtRelative(
								entry.createdAt
							)}
						</div>
					{:else if status === 'invited'}
						<div class="user-meta pending">invited · awaiting first login</div>
					{:else}
						<div class="user-meta blocked">blocked · no access</div>
					{/if}
				</div>
				<svg class="chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
					><path d="M6 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" /></svg
				>
			</button>
		{/each}
		{#if entries.length === 0}
			<div class="empty">
				<div class="em">○</div>
				{searchQuery ? 'No users match.' : 'No users yet.'}
			</div>
		{/if}
	</div>

	<button type="button" class="fab" onclick={onopeninvite} aria-label="Invite user">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
			><path d="M12 5v14M5 12h14" stroke-linecap="round" /></svg
		>
	</button>
</div>

<style>
	.user-row {
		display: grid;
		grid-template-columns: 40px 1fr auto;
		gap: 12px;
		align-items: center;
		padding: 12px 14px;
		border-bottom: 1px solid var(--color-border-subtle);
		background: var(--color-surface-1);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: background var(--duration-fast) var(--ease-out);
		text-align: left;
		width: 100%;
	}

	.user-row:last-child {
		border-bottom: 0;
	}

	.user-row:hover,
	.user-row:active {
		background: var(--color-bg-1);
	}

	.user-body {
		min-width: 0;
	}

	.user-name {
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	.user-email {
		color: var(--color-text-subtle);
		font-size: 12px;
		font-family: var(--font-mono);
		margin-top: 2px;
		max-width: 200px;
	}

	.user-meta {
		color: var(--color-text-faint);
		font-family: var(--font-mono);
		font-size: 10px;
		margin-top: 3px;
	}

	.user-meta.pending {
		color: var(--warn-ink);
	}

	.user-meta.blocked {
		color: var(--err-ink);
	}

	.chev {
		width: 18px;
		height: 18px;
		color: var(--color-text-faint);
		flex-shrink: 0;
	}

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

	.fab {
		position: fixed;
		right: max(16px, calc(50vw - 240px + 16px));
		bottom: calc(var(--tabbar-h) + var(--safe-bot) + 16px);
		z-index: 40;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: var(--color-text-primary);
		color: var(--color-surface-1);
		display: grid;
		place-items: center;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.2),
			0 1px 3px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		border: 0;
		-webkit-tap-highlight-color: transparent;
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.fab:active {
		transform: scale(0.94);
	}

	.fab svg {
		width: 22px;
		height: 22px;
	}
</style>

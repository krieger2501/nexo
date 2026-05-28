<script lang="ts">
	import { enhance } from '$app/forms';
	import { BottomSheet, DeviceListRow, type SheetAction } from '@nexo/ui';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	type Session = {
		id: string;
		isCurrent: boolean;
		name: string | null;
		icon: string;
		device: string;
		browser: string;
		os: string;
		summary: string;
		ip: string | null;
		lastActive: Date;
		createdAt: Date;
	};

	let {
		open = $bindable(false),
		sessions
	}: {
		open?: boolean;
		sessions: Session[];
	} = $props();

	let renamingSessionId = $state<string | null>(null);
	let renameValue = $state('');

	const sorted = $derived(
		[...sessions].sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0))
	);

	function buildMetaLines(s: Session): string[] {
		const lines: string[] = [];
		lines.push(`${s.browser} · ${s.os}${s.ip ? ` · ${s.ip}` : ''}`);
		if (s.isCurrent) {
			lines.push(m.sessions_active_now());
		} else if (s.lastActive) {
			const date = new Date(s.lastActive).toLocaleDateString(getLocale(), {
				month: 'short',
				day: 'numeric'
			});
			lines.push(m.sessions_last_active({ date }));
		}
		return lines;
	}

	const REVOKE_ALL_FORM_ID = 'revoke-all-sessions-form';
	const sheetActions = $derived<SheetAction[]>(
		sessions.length > 1
			? [
					{ label: m.sessions_revoke_all(), variant: 'danger', formId: REVOKE_ALL_FORM_ID },
					{ label: m.sheet_action_close(), variant: 'secondary', onclick: () => (open = false) }
				]
			: [{ label: m.sheet_action_close(), variant: 'secondary', onclick: () => (open = false) }]
	);
</script>

<BottomSheet bind:open title={m.sheet_title_sessions()} actions={sheetActions}>
	<p class="sub">{m.sessions_sub()}</p>
	<div class="session-list">
		{#each sorted as session (session.id)}
			{#if renamingSessionId === session.id}
				<form
					class="rename-row"
					method="POST"
					action="?/renameSession"
					use:enhance={() => {
						return async ({ update }) => {
							await update({ reset: false });
							renamingSessionId = null;
						};
					}}
				>
					<div class="rename-icon">{session.icon}</div>
					<input type="hidden" name="sessionId" value={session.id} />
					<!-- svelte-ignore a11y_autofocus -->
					<input
						class="rename-input"
						type="text"
						name="name"
						bind:value={renameValue}
						placeholder={m.sessions_rename_placeholder()}
						maxlength="32"
						autofocus
					/>
					<button
						type="button"
						class="rename-action cancel"
						onclick={() => (renamingSessionId = null)}
						aria-label={m.sheet_action_close()}>✕</button
					>
					<button type="submit" class="rename-action save">{m.sessions_rename_save()}</button>
				</form>
			{:else}
				<DeviceListRow
					icon={session.icon}
					label={session.name ?? session.summary}
					metaLines={buildMetaLines(session)}
					isCurrent={session.isCurrent}
				>
					{#snippet actions()}
						<button
							type="button"
							class="session-action-btn"
							onclick={() => {
								renamingSessionId = session.id;
								renameValue = session.name ?? '';
							}}
							aria-label={m.sessions_rename_aria()}>✏️</button
						>
						{#if !session.isCurrent}
							<form
								method="POST"
								action="?/revokeSession"
								use:enhance={() => {
									return async ({ update }) => {
										await update({ reset: false });
									};
								}}
							>
								<input type="hidden" name="sessionId" value={session.id} />
								<button
									type="submit"
									class="session-action-btn danger"
									aria-label={m.sessions_revoke_aria()}>✕</button
								>
							</form>
						{/if}
					{/snippet}
				</DeviceListRow>
			{/if}
		{/each}
	</div>
	{#if sessions.length > 1}
		<form
			id={REVOKE_ALL_FORM_ID}
			method="POST"
			action="?/revokeOtherSessions"
			use:enhance={() => {
				return async ({ update }) => {
					await update({ reset: false });
					open = false;
				};
			}}
		></form>
	{/if}
</BottomSheet>

<style>
	.sub {
		font-size: 13px;
		color: var(--color-text-muted, #a1a1aa);
		margin-bottom: 16px;
	}
	.session-list {
		display: flex;
		flex-direction: column;
	}
	.rename-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 16px;
		border-top: 1px solid var(--color-border-subtle, #f0f0f0);
		background: color-mix(in oklab, var(--color-accent, #16a34a) 4%, transparent);
	}
	.rename-row:first-child {
		border-top: 0;
	}
	.rename-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: var(--color-bg-1, #fafafa);
		display: grid;
		place-items: center;
		font-size: 18px;
		flex-shrink: 0;
	}
	.rename-input {
		flex: 1;
		min-width: 0;
		font: inherit;
		font-size: 14px;
		padding: 8px 10px;
		border: 1px solid var(--color-border-default, #e5e5e5);
		border-radius: var(--radius-sm, 8px);
		background: var(--color-surface-1, #fff);
		outline: none;
	}
	.rename-input:focus {
		border-color: var(--color-accent, #16a34a);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-accent, #16a34a) 12%, transparent);
	}
	.rename-action {
		font: inherit;
		font-size: 12px;
		font-weight: 600;
		padding: 0 10px;
		height: 32px;
		border: none;
		border-radius: var(--radius-sm, 8px);
		cursor: pointer;
		flex-shrink: 0;
	}
	.rename-action.save {
		background: var(--color-accent, #16a34a);
		color: #fff;
	}
	.rename-action.cancel {
		width: 32px;
		padding: 0;
		background: var(--color-bg-1, #fafafa);
		color: var(--color-text-muted, #71717a);
	}
	.session-action-btn {
		width: 28px;
		height: 28px;
		border: none;
		background: var(--color-bg-1, #fafafa);
		border-radius: var(--radius-sm, 8px);
		cursor: pointer;
		font-size: 13px;
		display: grid;
		place-items: center;
		transition: background 150ms;
	}
	.session-action-btn:active {
		background: var(--color-surface-2, #f0f0f0);
	}
	.session-action-btn.danger {
		color: var(--color-expense, #dc2626);
		font-weight: 700;
	}
</style>

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import {
		BottomSheet,
		DeviceListRow,
		ErrorBanner,
		PageHeader,
		SectionLabel,
		Toast
	} from '@nexo/ui';
	import { parseUserAgent, deviceIcon } from '@nexo/ui/utils/ua-parser';
	import { formatRelative, defaultLabelFromUA } from '@nexo/ui/utils/format-relative';
	import UserAvatarMenu from '$lib/components/UserAvatarMenu.svelte';
	import {
		enableNotifications,
		getPermissionState,
		getCurrentSubscription,
		sendTest,
		isStandalone,
		type PermissionState
	} from '@nexo/push/client';
	import {
		Send,
		Trash2,
		Pencil,
		Pause,
		Play,
		BellPlus,
		ExternalLink,
		Plug,
		Smartphone,
		Share2
	} from '@lucide/svelte';

	let { data } = $props();

	let permState = $state<PermissionState>('default');
	let hasSubscription = $state(false);
	let currentEndpoint = $state<string | null>(null);
	let standalone = $state(true);
	let mounted = $state(false);
	let busy = $state(false);
	let lastError = $state<string | null>(null);
	let renamingId = $state<string | null>(null);
	let renameLabel = $state('');
	let renameSheetOpen = $state(false);
	let removeSheetOpen = $state(false);
	let removingId = $state<string | null>(null);
	let removingLabel = $state<string>('');
	let toastMessage = $state('');
	let toastOpen = $state(false);

	onMount(async () => {
		permState = await getPermissionState();
		const sub = await getCurrentSubscription();
		hasSubscription = sub !== null;
		currentEndpoint = sub?.endpoint ?? null;
		standalone = isStandalone();
		mounted = true;
	});

	async function refreshSub() {
		permState = await getPermissionState();
		const sub = await getCurrentSubscription();
		hasSubscription = sub !== null;
		currentEndpoint = sub?.endpoint ?? null;
	}

	async function onEnable() {
		if (busy) return;
		busy = true;
		lastError = null;
		try {
			const r = await enableNotifications({
				app: 'flaschen',
				vapidPublicKey: data.vapidPublicKey,
				label: defaultDeviceLabel()
			});
			await refreshSub();
			if (r.ok) {
				await invalidateAll();
				flashToast(m.devices_toast_enabled());
			} else {
				lastError = r.reason;
			}
		} catch (err) {
			lastError = err instanceof Error ? err.message : String(err);
		} finally {
			busy = false;
		}
	}

	function startRemove(id: string, label: string) {
		removingId = id;
		removingLabel = label;
		removeSheetOpen = true;
	}

	async function onTest() {
		if (busy) return;
		busy = true;
		lastError = null;
		try {
			const r = await sendTest();
			if (r.ok) flashToast(m.devices_toast_test_sent());
			else lastError = 'test send failed';
		} finally {
			busy = false;
		}
	}

	function flashToast(text: string) {
		toastMessage = text;
		toastOpen = true;
	}

	function startRename(id: string, current: string | null) {
		renamingId = id;
		renameLabel = current ?? '';
		renameSheetOpen = true;
	}

	function defaultDeviceLabel(): string {
		const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
		return defaultLabelFromUA(ua);
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
		node.select();
	}

	type HeroState =
		| 'unsupported'
		| 'blocked'
		| 'connect-required'
		| 'reconnect'
		| 'off'
		| 'elsewhere'
		| 'paused'
		| 'quiet'
		| 'on';

	// Reactive clock for quiet-hours detection. Re-evaluates every minute.
	let nowMinute = $state(0);
	$effect(() => {
		const update = () => {
			const d = new Date();
			nowMinute = d.getHours() * 60 + d.getMinutes();
		};
		update();
		const id = setInterval(update, 60_000);
		return () => clearInterval(id);
	});

	const inQuietHoursNow = $derived.by(() => {
		if (!data.quietHours.enabled) return false;
		const { startMinutes: start, endMinutes: end } = data.quietHours;
		// Window may wrap midnight (e.g. 22:00–06:00) — handle both cases.
		return start === end ? false : start < end ? nowMinute >= start && nowMinute < end : nowMinute >= start || nowMinute < end;
	});

	const heroState = $derived.by((): HeroState => {
		if (permState === 'unsupported') return 'unsupported';
		if (permState === 'denied') return 'blocked';
		if (data.connection === 'never') return 'connect-required';
		if (data.connection === 'reconnect') return 'reconnect';
		if (permState !== 'granted' || !hasSubscription) {
			const others = data.devices.filter(
				(d) => currentEndpoint === null || d.endpoint !== currentEndpoint
			).length;
			return others > 0 ? 'elsewhere' : 'off';
		}
		if (!data.watching) return 'paused';
		if (inQuietHoursNow) return 'quiet';
		return 'on';
	});

	type Tone = 'ok' | 'warn' | 'err' | 'accent';
	type HeroInfo = {
		title: string;
		sub: string;
		pill: string;
		tone: Tone;
	};

	const heroInfo = $derived.by<HeroInfo>(() => {
		switch (heroState) {
			case 'on':
				return {
					title: m.devices_state_on_title(),
					sub: m.devices_state_on_sub(),
					pill: m.devices_pill_on(),
					tone: 'ok'
				};
			case 'paused':
				return {
					title: m.devices_state_paused_title(),
					sub: m.devices_state_paused_desc(),
					pill: m.devices_pill_paused(),
					tone: 'warn'
				};
			case 'quiet': {
				const fmt = (mins: number) => {
					const h = Math.floor(mins / 60) % 24;
					const m2 = mins % 60;
					return `${String(h).padStart(2, '0')}:${String(m2).padStart(2, '0')}`;
				};
				return {
					title: m.devices_state_quiet_title(),
					sub: m.devices_state_quiet_desc({
						start: fmt(data.quietHours.startMinutes),
						end: fmt(data.quietHours.endMinutes)
					}),
					pill: m.devices_pill_quiet(),
					tone: 'accent'
				};
			}
			case 'off':
				return {
					title: m.devices_state_off_title(),
					sub: m.devices_state_off_desc(),
					pill: m.devices_pill_off(),
					tone: 'warn'
				};
			case 'elsewhere': {
				const others = data.devices.filter(
					(d) => currentEndpoint === null || d.endpoint !== currentEndpoint
				).length;
				return {
					title: m.devices_state_elsewhere_title(),
					sub:
						others === 1
							? m.devices_state_elsewhere_desc_one()
							: m.devices_state_elsewhere_desc_many({ count: String(others) }),
					pill: m.devices_pill_elsewhere(),
					tone: 'accent'
				};
			}
			case 'blocked':
				return {
					title: m.devices_state_blocked_title(),
					sub: m.devices_denied(),
					pill: m.devices_pill_blocked(),
					tone: 'err'
				};
			case 'unsupported':
				return {
					title: m.devices_state_unsupported_title(),
					sub: m.devices_unsupported(),
					pill: m.devices_pill_unsupported(),
					tone: 'warn'
				};
			case 'connect-required':
				return {
					title: m.devices_state_connect_title(),
					sub: m.devices_state_connect_desc(),
					pill: m.devices_pill_setup(),
					tone: 'accent'
				};
			case 'reconnect':
				return {
					title: m.devices_state_reconnect_title(),
					sub: m.devices_state_reconnect_desc(),
					pill: m.devices_pill_reconnect(),
					tone: 'err'
				};
		}
	});

	const showA2hsHint = $derived(!standalone && permState !== 'unsupported');
</script>

<div class="page">
	<PageHeader title={m.devices_title()}>
		{#snippet avatar()}<UserAvatarMenu />{/snippet}
	</PageHeader>

	<!-- Hero -->
	{#if !mounted}
		<section class="hero hero-skeleton" aria-busy="true">
			<div class="hero-head">
				<span class="hero-eyebrow">{m.devices_eyebrow()}</span>
				<span class="sk-pill"></span>
			</div>
			<div class="orb-wrap"><span class="orb sk-orb"></span></div>
			<div class="hero-body">
				<span class="sk-line sk-line-lg"></span>
				<span class="sk-line"></span>
				<span class="sk-line sk-line-sm"></span>
			</div>
		</section>
	{:else}
		<section class="hero" data-hero-state={heroState}>
			<div class="hero-head">
				<span class="hero-eyebrow">{m.devices_eyebrow()}</span>
				<span class="hero-pill" data-tone={heroInfo.tone}>
					<span class="dot"></span>
					{heroInfo.pill}
				</span>
			</div>

			<div class="orb-wrap" aria-hidden="true">
				<span class="orb">
					<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
						<rect x="10.25" y="2.5" width="3.5" height="1.5" rx="0.3" />
						<path d="M10.5 4h3v4l2 2v9.5a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V10l2-2V4z" />
						<rect x="9" y="14" width="6" height="3" rx="0.4" fill="rgba(0, 0, 0, 0.22)" />
					</svg>
					<span class="orb-slash"></span>
				</span>
			</div>

			<div class="hero-body">
				<h1 class="hero-title">{heroInfo.title}</h1>
				<p class="hero-sub">{heroInfo.sub}</p>

				<div class="hero-actions">
					{#if heroState === 'on'}
						<form method="POST" action="?/pause" use:enhance>
							<button type="submit" class="btn secondary" disabled={busy}>
								<Pause size={14} strokeWidth={1.8} />
								{m.devices_pause()}
							</button>
						</form>
						<button type="button" class="btn ghost" onclick={onTest} disabled={busy}>
							<Send size={14} strokeWidth={1.8} />
							{m.devices_test_push()}
						</button>
					{:else if heroState === 'quiet'}
						<a class="btn primary" href="/settings#quiet">
							<Pencil size={14} strokeWidth={1.8} />
							{m.devices_adjust_quiet()}
						</a>
						<button type="button" class="btn ghost" onclick={onTest} disabled={busy}>
							<Send size={14} strokeWidth={1.8} />
							{m.devices_test_push()}
						</button>
					{:else if heroState === 'paused'}
						<form method="POST" action="?/resume" use:enhance>
							<button type="submit" class="btn primary" disabled={busy}>
								<Play size={14} strokeWidth={1.8} />
								{m.devices_resume()}
							</button>
						</form>
						<a class="btn ghost" href="/settings#quiet">
							{m.devices_adjust_quiet()}
						</a>
					{:else if heroState === 'off'}
						<!-- Empty state below provides the primary CTA; hero stays status-only. -->
					{:else if heroState === 'elsewhere'}
						<button type="button" class="btn primary" onclick={onEnable} disabled={busy}>
							<BellPlus size={14} strokeWidth={1.8} />
							{m.devices_add_this_device()}
						</button>
					{:else if heroState === 'blocked'}
						<a
							class="btn primary"
							href="https://support.apple.com/guide/iphone/iph7c3d96bbb/ios"
							target="_blank"
							rel="noreferrer"
						>
							<ExternalLink size={14} strokeWidth={1.8} />
							{m.devices_open_browser_settings()}
						</a>
					{:else if heroState === 'unsupported'}
						<button type="button" class="btn primary" disabled>
							<Smartphone size={14} strokeWidth={1.8} />
							{m.devices_show_a2hs()}
						</button>
					{:else if heroState === 'connect-required' || heroState === 'reconnect'}
						<a class="btn primary" href="/settings?connect=1">
							<Plug size={14} strokeWidth={1.8} />
							{m.devices_connect_flaschenpost()}
						</a>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	{#if lastError}
		<ErrorBanner label="Push error" message={lastError} onDismiss={() => (lastError = null)} />
	{/if}

	<!-- Devices section -->
	<SectionLabel title={m.devices_list_title()} right={String(data.devices.length)} />

	<div class="dev-list">
		{#if data.devices.length === 0}
			<div class="dev-empty">
				<div class="glyph"><Smartphone size={22} strokeWidth={1.7} /></div>
				<h3>{m.devices_empty_title()}</h3>
				<p>{m.devices_empty_desc()}</p>
				{#if heroState === 'off'}
					<button type="button" class="btn primary" onclick={onEnable} disabled={busy}>
						<BellPlus size={14} strokeWidth={1.8} />
						{m.devices_add_this_device()}
					</button>
				{/if}
			</div>
		{:else}
			{#each data.devices as device (device.id)}
				{@const parsed = parseUserAgent(device.userAgent)}
				{@const isCurrent = currentEndpoint !== null && device.endpoint === currentEndpoint}
				{@const meta = `Added ${formatRelative(device.createdAt)}${device.lastUsedAt ? ` · last push ${formatRelative(device.lastUsedAt)}` : ''}`}
				<DeviceListRow
					icon={deviceIcon(parsed.device, parsed.os)}
					label={device.label ?? defaultLabelFromUA(device.userAgent)}
					metaLines={[meta]}
					{isCurrent}
					currentLabel={m.devices_this_device()}
				>
					{#snippet actions()}
						<button
							type="button"
							class="rm"
							onclick={() => startRename(device.id, device.label)}
							aria-label={m.devices_rename()}
						>
							<Pencil size={14} strokeWidth={1.8} />
						</button>
						<button
							type="button"
							class="rm rm-danger"
							onclick={() =>
								startRemove(device.id, device.label ?? defaultLabelFromUA(device.userAgent))}
							aria-label={m.devices_remove()}
						>
							<Trash2 size={14} strokeWidth={1.8} />
						</button>
					{/snippet}
				</DeviceListRow>
			{/each}
		{/if}
	</div>

	{#if showA2hsHint}
		<aside class="a2hs-hint">
			<div class="ico"><Share2 size={14} strokeWidth={1.7} /></div>
			<p class="a2hs-text">
				{m.devices_a2hs_lead()}<b>{m.devices_a2hs_emph()}</b>{m.devices_a2hs_tail()}
			</p>
		</aside>
	{/if}
</div>

<!-- Toast -->
<Toast bind:open={toastOpen} type="success" message={toastMessage} duration={3000} />

<!-- Rename sheet -->
<BottomSheet
	bind:open={renameSheetOpen}
	title={m.devices_rename()}
	subtitle={m.devices_rename_sub()}
>
	<form
		method="POST"
		action="?/rename"
		use:enhance={() =>
			async ({ update }) => {
				await update({ reset: false });
				renameSheetOpen = false;
				renamingId = null;
			}}
	>
		<input type="hidden" name="id" value={renamingId ?? ''} />
		<label class="field">
			<span class="field-label">{m.devices_label()}</span>
			<input
				type="text"
				name="label"
				bind:value={renameLabel}
				maxlength="64"
				placeholder="iPhone 15"
				use:focusOnMount
			/>
		</label>
		<div class="sheet-actions sheet-actions-row">
			<button type="button" class="sheet-cancel" onclick={() => (renameSheetOpen = false)}>
				{m.connect_cancel()}
			</button>
			<button type="submit" class="sheet-done">{m.saved()}</button>
		</div>
	</form>
</BottomSheet>

<!-- Remove confirmation sheet -->
<BottomSheet
	bind:open={removeSheetOpen}
	title={m.devices_remove_confirm_title()}
	subtitle={m.devices_remove_confirm_desc({ label: removingLabel })}
>
	<form
		method="POST"
		action="?/remove"
		use:enhance={() =>
			async ({ update }) => {
				await update({ reset: false });
				removeSheetOpen = false;
				removingId = null;
			}}
	>
		<input type="hidden" name="id" value={removingId ?? ''} />
		<div class="sheet-actions sheet-actions-row">
			<button type="button" class="sheet-cancel" onclick={() => (removeSheetOpen = false)}>
				{m.connect_cancel()}
			</button>
			<button type="submit" class="sheet-done sheet-done-danger">
				{m.devices_remove_confirm_cta()}
			</button>
		</div>
	</form>
</BottomSheet>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	/* Sheet form */
	.field {
		display: block;
		margin-bottom: 14px;
	}
	.field-label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-subtle);
		margin-bottom: 6px;
	}
	.field input {
		width: 100%;
		padding: 12px;
		font-size: 14px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-1);
	}

	/* Device row action buttons (inside DeviceListRow's actions snippet) */
	.rm {
		appearance: none;
		border: 1px solid rgb(255 255 255 / 0.85);
		background: rgb(255 255 255 / 0.55);
		color: var(--text-muted);
		cursor: pointer;
		width: 32px;
		height: 32px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		box-shadow: var(--shadow-glass-sm);
		transition: transform 320ms var(--ease-spring), color 200ms;
	}
	.rm:active {
		transform: scale(0.92);
	}
	.rm:hover {
		color: var(--accent-ink);
		background: rgb(255 255 255 / 0.85);
	}
	.rm-danger:hover {
		color: var(--err-ink);
		background: var(--err-soft);
		border-color: color-mix(in oklab, var(--err) 20%, #fff);
	}

	/* Hero skeleton (shown until onMount has read browser push state) */
	.hero-skeleton .sk-pill {
		display: inline-block;
		width: 56px;
		height: 18px;
		border-radius: 999px;
		background: var(--bg-2);
	}
	.hero-skeleton .sk-orb {
		opacity: 0.45;
	}
	.hero-skeleton .sk-line {
		display: block;
		height: 12px;
		border-radius: 6px;
		background: var(--bg-2);
		margin: 8px auto;
		width: 70%;
	}
	.hero-skeleton .sk-line-lg {
		height: 18px;
		width: 55%;
	}
	.hero-skeleton .sk-line-sm {
		width: 40%;
	}
	.hero-skeleton {
		animation: sk-pulse 1.6s ease-in-out infinite;
	}
	@keyframes sk-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.55;
		}
	}
</style>

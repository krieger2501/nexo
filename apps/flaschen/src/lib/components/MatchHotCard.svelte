<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Bell, Hand, X, Sparkles } from '@lucide/svelte';

	type Offer = {
		warehouse: { name: string };
		workgroup: { name: string };
		start: string;
		durationInMinutes: number;
		rewardScore?: number;
		isMarketplaceShift?: boolean;
		shiftType?: string | null;
		dedupeKey: string;
	};

	let {
		offer,
		receivedAt,
		onSkip,
		onTaken
	}: {
		offer: Offer;
		receivedAt: number;
		onSkip: (key: string) => void;
		onTaken: (key: string) => void;
	} = $props();

	let submitting = $state(false);

	function pad2(n: number) {
		return String(n).padStart(2, '0');
	}
	function fmtTimeRange(start: string, dur: number) {
		const d = new Date(start);
		const e = new Date(d.getTime() + dur * 60_000);
		return `${pad2(d.getHours())}:${pad2(d.getMinutes())}–${pad2(e.getHours())}:${pad2(e.getMinutes())}`;
	}
	function fmtDuration(mins: number) {
		const h = Math.floor(mins / 60);
		const m2 = mins % 60;
		return m2 ? `${h}:${pad2(m2)}h` : `${h}h`;
	}
	function fmtDate(start: string) {
		const d = new Date(start);
		try {
			const wd = new Intl.DateTimeFormat(getLocale(), { weekday: 'long' }).format(d);
			return `${wd} · ${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
		} catch {
			return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
		}
	}

	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(id);
	});
	const ageLabel = $derived.by(() => {
		const diffMin = Math.max(0, Math.round((now - receivedAt) / 60_000));
		if (diffMin < 1) return m.dashboard_just_now();
		if (diffMin < 60) return m.dashboard_minutes_ago({ n: String(diffMin) });
		const h = Math.round(diffMin / 60);
		return m.dashboard_hours_ago({ n: String(h) });
	});
</script>

<div class="hot-card" role="region" aria-live="polite">
	<div class="hot-head">
		<span class="hot-pulse"></span>
		<span class="hot-eyebrow"><em>New</em>{m.dashboard_hot_eyebrow()}</span>
		<span class="hot-meta">{ageLabel}</span>
	</div>

	<div class="hot-body">
		<h2 class="hot-title">
			<em>{offer.warehouse.name}</em><br />
			{offer.workgroup.name}
		</h2>
		<div class="hot-when">
			{fmtDate(offer.start)} · {fmtTimeRange(offer.start, offer.durationInMinutes)} · {fmtDuration(
				offer.durationInMinutes
			)}
		</div>
		{#if (offer.rewardScore ?? 0) > 0 || offer.isMarketplaceShift || offer.shiftType}
			<div class="hot-chips">
				{#if offer.shiftType}
					<span class="chip chip-type">{offer.shiftType}</span>
				{/if}
				{#if (offer.rewardScore ?? 0) > 0}
					<span class="chip chip-bonus"
						>{m.dashboard_kronkorken({ n: String(offer.rewardScore ?? 0) })}</span
					>
				{/if}
				{#if offer.isMarketplaceShift}
					<span class="chip chip-mp">📦 {m.dashboard_marketplace()}</span>
				{/if}
			</div>
		{/if}
	</div>

	<form
		method="POST"
		action="?/takeShift"
		use:enhance={() => {
			submitting = true;
			return async ({ result }) => {
				submitting = false;
				await applyAction(result);
				if (result.type === 'success') {
					onTaken(offer.dedupeKey);
					await invalidateAll();
				} else if (result.type === 'failure' && result.data?.takeError === 'OFFER_GONE') {
					onTaken(offer.dedupeKey);
					await invalidateAll();
				}
			};
		}}
	>
		<input type="hidden" name="dedupeKey" value={offer.dedupeKey} />
		<div class="hot-actions">
			<button type="submit" class="hot-take" disabled={submitting}>
				{#if submitting}
					<Sparkles size={18} strokeWidth={2.2} />
					{m.dashboard_take_submitting()}
				{:else}
					<Hand size={18} strokeWidth={2.2} />
					{m.dashboard_take_shift()}
				{/if}
			</button>
			<button
				type="button"
				class="hot-skip"
				disabled={submitting}
				onclick={() => onSkip(offer.dedupeKey)}
			>
				<X size={16} strokeWidth={2} />
				{m.dashboard_hot_skip()}
			</button>
		</div>
	</form>
</div>

<style>
	form {
		margin: 0;
	}
</style>

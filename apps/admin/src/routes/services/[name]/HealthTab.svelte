<script lang="ts">
	import type { ContainerInspect } from '$lib/server/docker';

	interface Props {
		container: ContainerInspect;
		fmtRelative: (iso: string | null) => string;
	}

	let { container, fmtRelative }: Props = $props();

	const health = $derived(container.State.Health ?? null);
	const checks = $derived(health ? health.Log.slice().reverse() : []);
	const passing = $derived(checks.filter((x) => x.ExitCode === 0).length);
</script>

<div class="fade-in">
	{#if health}
		<div class="health-summary">
			<div>
				<div class="health-count">{passing} / {checks.length} passing</div>
				<div class="health-meta">Docker health check log</div>
			</div>
			<button
				type="button"
				class="btn btn-ghost btn-small"
				onclick={() => window.location.reload()}
			>
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
					><path d="M3 8a5 5 0 018-3.5M13 8a5 5 0 01-8 3.5" /><path
						d="M11 2v3h-3M5 14v-3h3"
						stroke-linecap="round"
					/></svg
				>
				Recheck
			</button>
		</div>
		<div class="row-stack" style="margin-top:10px">
			{#each checks as entry (entry.Start)}
				{@const ok = entry.ExitCode === 0}
				<div class="hc">
					<div class="hc-icon {ok ? 'ok' : 'err'}">
						{#if ok}
							<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"
								><path d="M3 8l3.5 3.5L13 5" stroke-linecap="round" stroke-linejoin="round" /></svg
							>
						{:else}
							<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"
								><circle cx="8" cy="8" r="6" /><path
									d="M5 5l6 6M11 5l-6 6"
									stroke-linecap="round"
								/></svg
							>
						{/if}
					</div>
					<div class="hc-body">
						<div class="hc-title">{fmtRelative(entry.Start)}</div>
						<div class="hc-out">{entry.Output.trim() || (ok ? 'Passed' : 'Failed')}</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty">
			<div class="em">—</div>
			<div>No health check configured for this container.</div>
		</div>
	{/if}
</div>

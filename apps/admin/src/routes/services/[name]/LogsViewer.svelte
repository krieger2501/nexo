<script lang="ts">
	import { onMount, onDestroy, setContext, untrack } from 'svelte';
	import { settings } from '$lib/settings.svelte';
	import { createLogsState, LOGS_CTX } from './logsState.svelte';
	import LogsToolbar from './LogsToolbar.svelte';
	import LogRow from './LogRow.svelte';
	import FieldSelectorSheet from './FieldSelectorSheet.svelte';

	interface Props {
		serviceName: string;
	}

	let { serviceName }: Props = $props();

	const logs = createLogsState(untrack(() => serviceName));
	setContext(LOGS_CTX, logs);

	let sentinelEl = $state<HTMLElement | null>(null);
	$effect(() => {
		logs.setSentinel(sentinelEl);
	});

	// Attach scroll detection to .app-body — auto-detaches on unmount
	$effect(() => {
		const body = document.querySelector<HTMLElement>('.app-body');
		if (!body) return;
		const handler = () => {
			const atBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 40;
			logs.autoScroll = atBottom;
			if (atBottom) logs.newSinceScroll = 0;
		};
		body.addEventListener('scroll', handler, { passive: true });
		return () => body.removeEventListener('scroll', handler);
	});

	let destroyEs: (() => void) | null = null;
	onMount(() => {
		destroyEs = logs.connect();
	});
	onDestroy(() => {
		destroyEs?.();
	});
</script>

<div class="logs {settings.logDark ? 'dark' : ''} fade-in">
	<LogsToolbar />

	<div class="logs-stream density-{settings.logDensity}">
		{#if logs.filteredLines.length === 0}
			<div class="log-empty">
				{logs.logSearch ? 'No lines match your search.' : 'Waiting for logs…'}
			</div>
		{/if}
		{#each logs.filteredLines as entry, i (i)}
			<LogRow {entry} index={i} />
		{/each}
		<div bind:this={sentinelEl}></div>
	</div>
</div>

{#if !logs.autoScroll && logs.newSinceScroll > 0}
	<button
		type="button"
		class="jump-pill"
		onclick={() => {
			logs.autoScroll = true;
			logs.newSinceScroll = 0;
			sentinelEl?.scrollIntoView({ block: 'end' });
		}}
	>
		{logs.newSinceScroll} new log{logs.newSinceScroll === 1 ? '' : 's'} ↓
	</button>
{/if}

<FieldSelectorSheet />

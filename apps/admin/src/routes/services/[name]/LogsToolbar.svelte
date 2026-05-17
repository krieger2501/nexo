<script lang="ts">
	import { getContext } from 'svelte';
	import type { LogsState } from './logsState.svelte';
	import { LOGS_CTX } from './logsState.svelte';

	const logs = getContext<LogsState>(LOGS_CTX);
</script>

<div class="logs-toolbar">
	<!-- Search -->
	<div class="search-wrap">
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
			><circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" stroke-linecap="round" /></svg
		>
		<input
			class="input"
			placeholder="Search msg, corr-id, email…"
			bind:value={logs.logSearch}
			inputmode="search"
		/>
		{#if logs.logSearch}
			<button
				type="button"
				class="clear"
				aria-label="Clear search"
				onclick={() => (logs.logSearch = '')}
			>
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"
					><path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round" /></svg
				>
			</button>
		{/if}
	</div>

	<!-- Level chips -->
	<div class="level-chips">
		{#each ['all', 'debug', 'info', 'warn', 'error'] as const as lv (lv)}
			<button
				type="button"
				class="level-chip"
				class:active={logs.logFilter === lv}
				data-lv={lv === 'all' ? undefined : lv}
				onclick={() => (logs.logFilter = lv)}
			>
				{#if lv !== 'all'}<span class="ldot"></span>{/if}
				{lv}
				<span class="n">{logs.levelCounts[lv] ?? 0}</span>
			</button>
		{/each}
	</div>

	<!-- Meta row: live/count + actions -->
	<div class="logs-meta">
		<span class="live-indicator {logs.paused ? 'paused' : ''}">
			<span class="ld"></span>{logs.paused ? 'Paused' : 'Live'}
		</span>
		<span>{logs.filteredLines.length} / {logs.lines.length}</span>
		<div class="logs-actions">
			<div class="mode-seg">
				<button type="button" class:active={!logs.rawMode} onclick={() => (logs.rawMode = false)}
					>JSON</button
				>
				<button type="button" class:active={logs.rawMode} onclick={() => (logs.rawMode = true)}
					>RAW</button
				>
			</div>
			<button
				type="button"
				class="icon-btn"
				onclick={() => (logs.paused = !logs.paused)}
				title={logs.paused ? 'Resume' : 'Pause'}
			>
				{#if logs.paused}
					<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 3l9 5-9 5z" /></svg>
				{:else}
					<svg viewBox="0 0 16 16" fill="currentColor"
						><rect x="4" y="3" width="3" height="10" rx="1" /><rect
							x="9"
							y="3"
							width="3"
							height="10"
							rx="1"
						/></svg
					>
				{/if}
			</button>
			<button type="button" class="icon-btn" onclick={logs.copyAllLogs} title="Copy all">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
					><rect x="5" y="5" width="8" height="9" rx="1.5" /><path d="M3 11V3a1 1 0 011-1h7" /></svg
				>
			</button>
		</div>
	</div>

	<!-- Field bar (inline meta fields) -->
	{#if !logs.rawMode && logs.availableMetaKeys.length > 0}
		<div class="field-bar">
			{#each logs.displayFields as f (f)}
				<button type="button" class="field-pill" onclick={() => logs.toggleDisplayField(f)}>
					{f}
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"
						><path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round" /></svg
					>
				</button>
			{/each}
			<button type="button" class="field-pill add" onclick={() => (logs.fieldSheetOpen = true)}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
					><path d="M12 5v14M5 12h14" stroke-linecap="round" /></svg
				>
				fields
			</button>
		</div>
	{/if}
</div>

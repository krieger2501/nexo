<script lang="ts">
	import { getContext } from 'svelte';
	import type { LogsState } from './logsState.svelte';
	import { LOGS_CTX } from './logsState.svelte';

	const logs = getContext<LogsState>(LOGS_CTX);
</script>

{#if logs.fieldSheetOpen}
	<div class="sheet-backdrop open" onclick={() => (logs.fieldSheetOpen = false)} role="none"></div>
	<div
		class="sheet open"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		tabindex="-1"
	>
		<div class="sheet-handle"></div>
		<h3 class="sheet-title">Display fields</h3>
		<p class="sheet-desc">Pick which fields show inline on each row.</p>
		<div class="sheet-fields">
			{#each logs.availableMetaKeys as f (f)}
				<div class="sheet-field-row">
					<span class="sheet-field-key">{f}</span>
					<button
						type="button"
						class="toggle {logs.displayFields.includes(f) ? 'on' : ''}"
						aria-label="Toggle {f}"
						aria-pressed={logs.displayFields.includes(f)}
						onclick={() => logs.toggleDisplayField(f)}
					></button>
				</div>
			{/each}
		</div>
		<button
			type="button"
			class="btn btn-secondary btn-block"
			style="margin-top:12px"
			onclick={() => (logs.fieldSheetOpen = false)}>Done</button
		>
	</div>
{/if}

<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
		inputmode?: 'search' | 'text' | 'email' | 'url';
	}

	let { value = $bindable(''), placeholder = 'Search…', inputmode = 'search' }: Props = $props();
</script>

<div class="search-wrap">
	<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
		><circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" stroke-linecap="round" /></svg
	>
	<input class="input" {placeholder} {inputmode} bind:value />
	{#if value}
		<button type="button" class="clear" aria-label="Clear search" onclick={() => (value = '')}>
			<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"
				><path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round" /></svg
			>
		</button>
	{/if}
</div>

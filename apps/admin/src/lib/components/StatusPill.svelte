<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant: 'ok' | 'warn' | 'err' | 'mute' | 'info';
		children: Snippet;
	}

	let { variant, children }: Props = $props();
</script>

<span class="pill {variant}">{@render children()}</span>

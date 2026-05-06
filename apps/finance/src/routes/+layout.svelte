<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';

	let { children } = $props();

	const isLoginPage = $derived(page.url.pathname === '/login');
</script>

<main
	class="mx-auto min-h-screen max-w-md"
	style="padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))"
>
	{@render children()}
</main>

{#if !isLoginPage}
	<BottomNav />
{/if}

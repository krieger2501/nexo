<script lang="ts">
	import { BottomSheet } from '@nexo/ui';
	import { m } from '$lib/paraglide/messages.js';

	let {
		open = $bindable(false),
		signOutHref
	}: { open?: boolean; signOutHref: string } = $props();
</script>

<BottomSheet
	bind:open
	title={m.sheet_title_signout()}
	actions={[
		{ label: m.sheet_signout_stay(), variant: 'secondary', onclick: () => (open = false) },
		{ label: m.sheet_signout_confirm(), variant: 'danger', href: signOutHref }
	]}
>
	<p class="sub">{m.sheet_signout_sub()}</p>
</BottomSheet>

<style>
	.sub {
		font-size: 13.5px;
		color: var(--color-text-subtle);
		line-height: 1.5;
		margin: 0 0 4px;
	}
</style>

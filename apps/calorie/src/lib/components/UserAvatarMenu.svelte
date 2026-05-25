<script lang="ts">
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { UserAvatarMenu } from '@nexo/ui';
	import { Repeat } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	type AppUser = { name?: string | null; email?: string | null; image?: string | null };
	type HubProfileData = { displayName?: string | null } | null;

	const user = $derived(page.data.user as AppUser | null);
	const hubProfile = $derived(page.data.hubProfile as HubProfileData);

	const hubUrl = $derived(
		env.PUBLIC_LANDING_URL
			? `${env.PUBLIC_LANDING_URL}/apps`
			: 'https://krieger2501.de/apps'
	);
</script>

<UserAvatarMenu {user} displayName={hubProfile?.displayName} {hubUrl}>
	{#snippet extras({ close }: { close: () => void })}
		<button
			type="button"
			class="extra"
			onclick={() => {
				close();
				goto('/onboarding');
			}}
		>
			<Repeat size={14} strokeWidth={1.7} />
			<span>Re-run setup</span>
		</button>
	{/snippet}
</UserAvatarMenu>

<style>
	.extra {
		all: unset;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		font-size: 13px;
		color: var(--color-text-muted);
		border-top: 1px solid var(--color-border-subtle);
	}
	.extra:hover {
		background: var(--color-bg-1);
	}
</style>

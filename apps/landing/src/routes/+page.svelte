<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';
	import HeroSection from '$lib/components/landing/HeroSection.svelte';
	import AppsSection from '$lib/components/landing/AppsSection.svelte';
	import InstallSection from '$lib/components/landing/InstallSection.svelte';
	import AboutSection from '$lib/components/landing/AboutSection.svelte';
	import FooterCta from '$lib/components/landing/FooterCta.svelte';

	const { data }: { data: PageData } = $props();
	const firstName = $derived(data.user?.name?.split(' ')[0] ?? null);
	const authUrl = env.PUBLIC_AUTH_URL ?? '';

	const apps = $derived([
		{
			id: 'finance',
			name: 'Finance',
			monogram: 'F',
			icon: '/icon-finance-dark.svg',
			accent: 'var(--color-accent-finance)',
			status: 'live' as const,
			desc: m.app_finance_desc(),
			meta: m.app_finance_meta()
		},
		{
			id: 'calorie',
			name: 'Calorie',
			monogram: 'C',
			icon: '/icon-calorie-dark.svg',
			accent: '#b85a3a',
			status: 'live' as const,
			desc: m.app_calorie_desc(),
			meta: m.app_calorie_meta()
		},
		{
			id: 'gym',
			name: 'Gym',
			monogram: 'G',
			icon: '/icon-gym.svg',
			accent: 'var(--color-accent-gym)',
			status: 'soon' as const,
			desc: m.app_gym_desc(),
			meta: m.app_gym_meta()
		},
		{
			id: 'time',
			name: 'Time Tracker',
			monogram: 'T',
			accent: 'var(--color-accent-time)',
			status: 'planned' as const,
			desc: m.app_time_desc(),
			meta: m.app_time_meta()
		},
		{
			id: 'pomodoro',
			name: 'Pomodoro',
			monogram: 'P',
			accent: 'var(--color-accent-pomodoro)',
			status: 'planned' as const,
			desc: m.app_pomodoro_desc(),
			meta: m.app_pomodoro_meta()
		}
	]);

	onMount(() => {
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						e.target.classList.add('in');
						io.unobserve(e.target);
					}
				}
			},
			{ threshold: 0.12 }
		);
		document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

		return () => {
			io.disconnect();
		};
	});
</script>

<svelte:head>
	<title>{m.site_title()}</title>
	<meta name="description" content={m.site_description()} />
	<meta property="og:title" content="Nexo" />
	<meta property="og:description" content={m.site_description()} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://krieger2501.de" />
</svelte:head>

<HeroSection version={data.appVersions.landing} />
<AppsSection {apps} {firstName} {authUrl} />
<InstallSection />
<AboutSection />
<FooterCta {firstName} {authUrl} />

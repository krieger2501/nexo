<script lang="ts">
	import { page } from '$app/state';
	import { Home, CreditCard, Receipt, TrendingUp, Users, BarChart2 } from 'lucide-svelte';

	const navItems = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/accounts', label: 'Accounts', icon: CreditCard },
		{ href: '/expenses', label: 'Expenses', icon: Receipt },
		{ href: '/income', label: 'Income', icon: TrendingUp },
		{ href: '/debt', label: 'Debt', icon: Users },
		{ href: '/forecast', label: 'Forecast', icon: BarChart2 }
	] as const;

	const url = $derived(page.url);
</script>

<nav
	class="fixed right-0 bottom-0 left-0 z-50 flex min-h-(--bottom-nav-height) items-center
	       justify-around border-t border-border bg-surface/95 px-1 backdrop-blur-md"
	style="padding-bottom: env(safe-area-inset-bottom);"
>
	{#each navItems as item (item.href)}
		{@const active = url.pathname === item.href}
		<a
			href={item.href}
			class="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 pt-2 pb-1.5
			       transition-colors duration-150
			       {active ? 'text-primary-500' : 'text-neutral hover:text-primary-400'}"
		>
			{#if active}
				<span class="absolute top-0 h-0.5 w-5 rounded-full bg-primary-500"></span>
			{/if}
			<item.icon size={20} stroke-width={active ? 2.5 : 1.75} />
			<span class="text-[10px] leading-none font-medium">{item.label}</span>
		</a>
	{/each}
</nav>

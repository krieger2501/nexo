import type { Component } from 'svelte';

export type BottomNavTab = {
	href: string;
	label: string;
	icon: Component<{ size?: number; strokeWidth?: number }>;
	exact?: boolean;
	active?: boolean;
};

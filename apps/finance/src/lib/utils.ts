import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export const RECURRENCE_ORDER = [
	'weekly',
	'biweekly',
	'monthly',
	'quarterly',
	'half-yearly',
	'yearly'
];

const MONTHLY_FACTOR: Record<string, number> = {
	weekly: 52 / 12,
	biweekly: 26 / 12,
	monthly: 1,
	quarterly: 1 / 3,
	'half-yearly': 1 / 6,
	yearly: 1 / 12
};

export function normalizeToMonthly(amount: number, recurrence: string): number {
	return amount * (MONTHLY_FACTOR[recurrence] ?? 0);
}

export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
	ref?: E | null;
};

export type WithoutChildren<T> = Omit<T, 'children'>;
export type WithoutChild<T> = Omit<T, 'child'>;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

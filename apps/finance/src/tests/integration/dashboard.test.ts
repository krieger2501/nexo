import { describe, it, expect } from 'vitest';

// Pure logic extracted from +page.server.ts — tested here without a real DB connection.

function getMonthlyExpenses(expenses: { active: boolean; recurrence: string; amount: number }[]) {
	return expenses
		.filter((e) => e.active && e.recurrence === 'monthly')
		.reduce((s, e) => s + e.amount, 0);
}

function getMonthlyIncome(income: { recurrence: string; amount: number }[]) {
	return income.filter((i) => i.recurrence === 'monthly').reduce((s, i) => s + i.amount, 0);
}

function getUpcoming(
	expenses: { id: string; name: string; amount: number; due_date: string | null }[],
	income: { id: string; name: string; amount: number; expected_date: string | null }[],
	debts: {
		id: string;
		counterparty: string;
		amount: number;
		due_date: string | null;
		paid: boolean;
	}[],
	now = new Date()
) {
	const in30 = new Date(now);
	in30.setDate(in30.getDate() + 30);

	return [
		...expenses
			.filter((e) => e.due_date && new Date(e.due_date) >= now && new Date(e.due_date) <= in30)
			.map((e) => ({
				id: e.id,
				label: e.name,
				amount: e.amount,
				date: e.due_date!,
				type: 'expense' as const
			})),
		...income
			.filter(
				(i) =>
					i.expected_date && new Date(i.expected_date) >= now && new Date(i.expected_date) <= in30
			)
			.map((i) => ({
				id: i.id,
				label: i.name,
				amount: i.amount,
				date: i.expected_date!,
				type: 'income' as const
			})),
		...debts
			.filter(
				(d) => !d.paid && d.due_date && new Date(d.due_date) >= now && new Date(d.due_date) <= in30
			)
			.map((d) => ({
				id: d.id,
				label: d.counterparty,
				amount: d.amount,
				date: d.due_date!,
				type: 'debt' as const
			}))
	].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

describe('getMonthlyExpenses', () => {
	it('sums active monthly expenses', () => {
		const expenses = [
			{ active: true, recurrence: 'monthly', amount: 100 },
			{ active: true, recurrence: 'monthly', amount: 50 },
			{ active: false, recurrence: 'monthly', amount: 200 },
			{ active: true, recurrence: 'yearly', amount: 300 }
		];
		expect(getMonthlyExpenses(expenses)).toBe(150);
	});

	it('returns 0 with no matching expenses', () => {
		expect(getMonthlyExpenses([])).toBe(0);
	});
});

describe('getMonthlyIncome', () => {
	it('sums monthly income', () => {
		const income = [
			{ recurrence: 'monthly', amount: 3000 },
			{ recurrence: 'monthly', amount: 500 },
			{ recurrence: 'yearly', amount: 1000 }
		];
		expect(getMonthlyIncome(income)).toBe(3500);
	});
});

describe('getUpcoming', () => {
	const now = new Date('2025-01-01T00:00:00Z');

	const inWindow = '2025-01-10T00:00:00Z';
	const outOfWindow = '2025-02-15T00:00:00Z';

	it('includes events within 30 days', () => {
		const events = getUpcoming(
			[{ id: '1', name: 'Rent', amount: 1000, due_date: inWindow }],
			[],
			[],
			now
		);
		expect(events).toHaveLength(1);
		expect(events[0].label).toBe('Rent');
		expect(events[0].type).toBe('expense');
	});

	it('excludes events outside the 30-day window', () => {
		const events = getUpcoming(
			[{ id: '1', name: 'Rent', amount: 1000, due_date: outOfWindow }],
			[],
			[],
			now
		);
		expect(events).toHaveLength(0);
	});

	it('excludes paid debts', () => {
		const events = getUpcoming(
			[],
			[],
			[{ id: '1', counterparty: 'Alice', amount: 50, due_date: inWindow, paid: true }],
			now
		);
		expect(events).toHaveLength(0);
	});

	it('sorts events chronologically', () => {
		const events = getUpcoming(
			[
				{ id: '2', name: 'Later', amount: 50, due_date: '2025-01-20T00:00:00Z' },
				{ id: '1', name: 'Earlier', amount: 100, due_date: '2025-01-05T00:00:00Z' }
			],
			[],
			[],
			now
		);
		expect(events[0].label).toBe('Earlier');
		expect(events[1].label).toBe('Later');
	});

	it('merges expenses, income, and debts', () => {
		const events = getUpcoming(
			[{ id: '1', name: 'Rent', amount: 1000, due_date: inWindow }],
			[{ id: '2', name: 'Salary', amount: 3000, expected_date: inWindow }],
			[{ id: '3', counterparty: 'Bob', amount: 20, due_date: inWindow, paid: false }],
			now
		);
		expect(events).toHaveLength(3);
		expect(events.map((e) => e.type).sort()).toEqual(['debt', 'expense', 'income']);
	});
});

import { describe, it, expect } from 'vitest';
import { calculateTargets, slotTargets, tierShowsFiber, tierShowsSugar } from '$lib/calc';

describe('calculateTargets', () => {
	it('produces sensible kcal for a typical maintain profile', () => {
		const t = calculateTargets({
			sex: 'male',
			age: 32,
			heightCm: 182,
			weightKg: 78,
			activity: 3,
			goal: 'maintain',
			tier: 'extended'
		});
		expect(t.kcal).toBeGreaterThan(2200);
		expect(t.kcal).toBeLessThan(3000);
		expect(t.protein_g).toBeGreaterThan(120);
	});

	it('reduces kcal for cut and increases for bulk', () => {
		const base = calculateTargets({
			sex: 'female',
			age: 28,
			heightCm: 168,
			weightKg: 64,
			activity: 3,
			goal: 'maintain',
			tier: 'basic'
		});
		const cut = calculateTargets({
			sex: 'female',
			age: 28,
			heightCm: 168,
			weightKg: 64,
			activity: 3,
			goal: 'cut',
			tier: 'basic'
		});
		const bulk = calculateTargets({
			sex: 'female',
			age: 28,
			heightCm: 168,
			weightKg: 64,
			activity: 3,
			goal: 'bulk',
			tier: 'basic'
		});
		expect(cut.kcal).toBeLessThan(base.kcal);
		expect(bulk.kcal).toBeGreaterThan(base.kcal);
	});

	it('adjusts protein up for cut', () => {
		const cut = calculateTargets({
			sex: 'male',
			age: 30,
			heightCm: 180,
			weightKg: 80,
			activity: 3,
			goal: 'cut',
			tier: 'extended'
		});
		const maintain = calculateTargets({
			sex: 'male',
			age: 30,
			heightCm: 180,
			weightKg: 80,
			activity: 3,
			goal: 'maintain',
			tier: 'extended'
		});
		expect(cut.protein_g).toBeGreaterThanOrEqual(maintain.protein_g);
	});
});

describe('slotTargets', () => {
	it('splits kcal into breakfast 30%, lunch 35%, dinner 30%, snack 5%', () => {
		const s = slotTargets(2000);
		expect(s.breakfast).toBe(600);
		expect(s.lunch).toBe(700);
		expect(s.dinner).toBe(600);
		expect(s.snack).toBe(100);
		expect(s.breakfast + s.lunch + s.dinner + s.snack).toBe(2000);
	});
});

describe('tier helpers', () => {
	it('hides fiber/sugar at basic tier', () => {
		expect(tierShowsFiber('basic')).toBe(false);
		expect(tierShowsSugar('basic')).toBe(false);
	});

	it('shows fiber at extended and full', () => {
		expect(tierShowsFiber('extended')).toBe(true);
		expect(tierShowsFiber('full')).toBe(true);
	});

	it('shows sugar at extended and full', () => {
		expect(tierShowsSugar('extended')).toBe(true);
		expect(tierShowsSugar('full')).toBe(true);
	});
});

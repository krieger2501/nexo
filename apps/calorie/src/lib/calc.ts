import type { Profile, Targets, MacroTier } from './types';

/** Mifflin-St Jeor BMR + activity multiplier + goal adjustment. */
export function calculateTargets(p: Profile): Targets {
	const s = p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78;
	const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + s;
	const mult = [1.2, 1.375, 1.55, 1.725, 1.9][p.activity - 1] ?? 1.55;
	const tdee = bmr * mult;
	const adj = p.goal === 'cut' ? -400 : p.goal === 'bulk' ? 300 : 0;
	const kcal = Math.round((tdee + adj) / 10) * 10;

	const protein_g = Math.round(p.weightKg * (p.goal === 'cut' ? 2.0 : 1.8));
	const fat_g = Math.round((kcal * 0.28) / 9);
	const carbs_g = Math.round((kcal - protein_g * 4 - fat_g * 9) / 4);

	return {
		kcal,
		protein_g,
		carbs_g,
		fat_g,
		fiber_g: 32,
		sugar_g: 45,
		satfat_g: 22,
		sodium_mg: 2300
	};
}

/** Slot kcal split — Breakfast 30%, Lunch 35%, Dinner 30%, Snack 5%. */
export function slotTargets(
	kcal: number
): Record<'breakfast' | 'lunch' | 'dinner' | 'snack', number> {
	return {
		breakfast: Math.round(kcal * 0.3),
		lunch: Math.round(kcal * 0.35),
		dinner: Math.round(kcal * 0.3),
		snack: Math.round(kcal * 0.05)
	};
}

export function tierShowsFiber(tier: MacroTier): boolean {
	return tier !== 'basic';
}

export function tierShowsSugar(tier: MacroTier): boolean {
	return tier === 'extended' || tier === 'full';
}

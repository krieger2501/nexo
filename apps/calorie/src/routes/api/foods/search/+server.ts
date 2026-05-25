import { json } from '@sveltejs/kit';
import { withUser, userFoods, entries as entriesTable, foodsCache } from '@nexo/db';
import { and, eq, ilike, or, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

/**
 * Per-user food search. Sources:
 *  - user's own custom foods (user_foods)
 *  - foods_cache rows the user has previously logged (no cross-user leakage)
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const userId = locals.user!.id;
	const q = (url.searchParams.get('q') ?? '').trim();
	if (q.length < 2) return json({ results: [] });

	const pattern = `%${q}%`;

	const data = await withUser(userId, async (tx) => {
		const own = await tx
			.select()
			.from(userFoods)
			.where(
				and(
					eq(userFoods.userId, userId),
					or(ilike(userFoods.name, pattern), ilike(userFoods.brand, pattern))
				)
			)
			.orderBy(desc(userFoods.createdAt))
			.limit(20);

		const cachedHits = await tx
			.select({ row: foodsCache })
			.from(foodsCache)
			.innerJoin(
				entriesTable,
				and(eq(entriesTable.foodBarcode, foodsCache.barcode), eq(entriesTable.userId, userId))
			)
			.where(
				or(
					ilike(foodsCache.nameDe, pattern),
					ilike(foodsCache.nameEn, pattern),
					ilike(foodsCache.nameGeneric, pattern),
					ilike(foodsCache.brand, pattern)
				)
			)
			.groupBy(foodsCache.barcode)
			.limit(20);

		return { own, cachedHits: cachedHits.map((c) => c.row) };
	});

	const results = [
		...data.own.map((f) => ({
			id: f.id,
			source: 'user' as const,
			name: f.name,
			brand: f.brand,
			kcal100g: Number(f.kcal100g),
			protein100g: Number(f.protein100g),
			carbs100g: Number(f.carbs100g),
			fat100g: Number(f.fat100g),
			fiber100g: f.fiber100g != null ? Number(f.fiber100g) : null,
			sugars100g: f.sugars100g != null ? Number(f.sugars100g) : null
		})),
		...data.cachedHits.map((c) => ({
			id: c.barcode,
			source: 'cache' as const,
			name: c.nameDe ?? c.nameEn ?? c.nameGeneric ?? 'Unknown',
			brand: c.brand,
			kcal100g: c.kcal100g != null ? Number(c.kcal100g) : null,
			protein100g: c.protein100g != null ? Number(c.protein100g) : null,
			carbs100g: c.carbs100g != null ? Number(c.carbs100g) : null,
			fat100g: c.fat100g != null ? Number(c.fat100g) : null,
			fiber100g: c.fiber100g != null ? Number(c.fiber100g) : null,
			sugars100g: c.sugars100g != null ? Number(c.sugars100g) : null
		}))
	];

	return json({ results });
};

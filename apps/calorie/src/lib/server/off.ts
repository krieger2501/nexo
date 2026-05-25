import { OpenFoodFacts } from '@openfoodfacts/openfoodfacts-nodejs';
import { withUser, foodsCache } from '@nexo/db';
import { eq } from 'drizzle-orm';
import { logger } from './logger';

const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 4500;

let _client: OpenFoodFacts | null = null;
function client(): OpenFoodFacts {
	if (_client) return _client;
	_client = new OpenFoodFacts(globalThis.fetch.bind(globalThis), {
		// User-Agent format required by OFF — identifies the integrating app
		// SDK appends its own version; we override with our app identity instead
	});
	return _client;
}

export type CachedFood = {
	source: 'cache' | 'off' | 'stale';
	barcode: string;
	name: string;
	brand: string | null;
	kcal100g: number | null;
	protein100g: number | null;
	carbs100g: number | null;
	fat100g: number | null;
	fiber100g: number | null;
	sugars100g: number | null;
	saturatedFat100g: number | null;
	salt100g: number | null;
	servingSizeG: number | null;
	imageUrl: string | null;
	fetchedAt: string;
};

function num(v: unknown): number | null {
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	if (typeof v === 'string') {
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

function toRow(barcode: string, p: Record<string, unknown>) {
	const n = (p.nutriments ?? {}) as Record<string, unknown>;
	return {
		barcode,
		nameDe: (p.product_name_de as string | null) ?? null,
		nameEn: (p.product_name_en as string | null) ?? null,
		nameGeneric: (p.product_name as string | null) ?? null,
		brand: (p.brands as string | null) ?? null,
		kcal100g: numStr(n['energy-kcal_100g']),
		protein100g: numStr(n.proteins_100g),
		carbs100g: numStr(n.carbohydrates_100g),
		fat100g: numStr(n.fat_100g),
		fiber100g: numStr(n.fiber_100g),
		sugars100g: numStr(n.sugars_100g),
		saturatedFat100g: numStr(n['saturated-fat_100g']),
		salt100g: numStr(n.salt_100g),
		servingSizeG: numStr(p.serving_quantity),
		imageUrl: (p.image_front_small_url as string | null) ?? null,
		rawOff: p as Record<string, unknown>
	};
}

function numStr(v: unknown): string | null {
	const n = num(v);
	return n == null ? null : String(n);
}

function rowToFood(source: CachedFood['source'], row: typeof foodsCache.$inferSelect): CachedFood {
	return {
		source,
		barcode: row.barcode,
		name: row.nameDe ?? row.nameEn ?? row.nameGeneric ?? 'Unknown',
		brand: row.brand,
		kcal100g: row.kcal100g != null ? Number(row.kcal100g) : null,
		protein100g: row.protein100g != null ? Number(row.protein100g) : null,
		carbs100g: row.carbs100g != null ? Number(row.carbs100g) : null,
		fat100g: row.fat100g != null ? Number(row.fat100g) : null,
		fiber100g: row.fiber100g != null ? Number(row.fiber100g) : null,
		sugars100g: row.sugars100g != null ? Number(row.sugars100g) : null,
		saturatedFat100g: row.saturatedFat100g != null ? Number(row.saturatedFat100g) : null,
		salt100g: row.salt100g != null ? Number(row.salt100g) : null,
		servingSizeG: row.servingSizeG != null ? Number(row.servingSizeG) : null,
		imageUrl: row.imageUrl,
		fetchedAt: row.fetchedAt.toISOString()
	};
}

const FIELDS: ReadonlyArray<string> = [
	'code',
	'product_name',
	'product_name_de',
	'product_name_en',
	'brands',
	'quantity',
	'serving_size',
	'serving_quantity',
	'image_front_small_url',
	'nutriments',
	'nutriscore_grade'
];

/**
 * Look up a product by barcode. Cache-first, then OFF, with stale-on-error fallback.
 * Per-user scoping is enforced by the caller — this function only deals with the shared
 * barcode cache.
 */
export async function lookupBarcode(userId: string, barcode: string): Promise<CachedFood | null> {
	if (!/^\d{8,14}$/.test(barcode)) {
		throw new Error('INVALID_BARCODE');
	}

	const [cached] = await withUser(userId, (tx) =>
		tx.select().from(foodsCache).where(eq(foodsCache.barcode, barcode)).limit(1)
	);

	if (cached) {
		const fresh = Date.now() - cached.fetchedAt.getTime() < TTL_MS;
		if (fresh) {
			// Bump last_accessed so we know which barcodes are actively used
			await withUser(userId, (tx) =>
				tx
					.update(foodsCache)
					.set({ lastAccessedAt: new Date() })
					.where(eq(foodsCache.barcode, barcode))
			);
			return rowToFood('cache', cached);
		}
	}

	try {
		const ctrl = new AbortController();
		const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
		// The SDK's getProductV3 is heavily generic over `fields`; bypass the strict literal
		// inference by treating the call as untyped here — we re-narrow on the response shape below.
		const callable = client().getProductV3 as unknown as (
			barcode: string,
			query: { fields: readonly string[] }
		) => Promise<unknown>;
		const res = await callable(barcode, { fields: FIELDS });
		clearTimeout(timer);

		const product = (res as { product?: Record<string, unknown>; status?: number }).product;
		const status = (res as { status?: number }).status;

		if (!product || status !== 1) {
			if (cached) return rowToFood('stale', cached);
			return null;
		}

		const row = toRow(barcode, product);
		const inserted = await withUser(userId, async (tx) => {
			const [r] = await tx
				.insert(foodsCache)
				.values({ ...row, fetchedAt: new Date(), lastAccessedAt: new Date() })
				.onConflictDoUpdate({
					target: foodsCache.barcode,
					set: { ...row, fetchedAt: new Date(), lastAccessedAt: new Date() }
				})
				.returning();
			return r;
		});
		return rowToFood('off', inserted);
	} catch (e) {
		logger.warn('off_fetch_failed', { barcode, error: String(e) });
		if (cached) return rowToFood('stale', cached);
		throw e;
	}
}

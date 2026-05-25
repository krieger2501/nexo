import { fail } from '@sveltejs/kit';
import { withUser, weightLogs, entries as entriesTable } from '@nexo/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import { logger } from '$lib/server/logger';
import type { PageServerLoad, Actions } from './$types';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const since = new Date(Date.now() - NINETY_DAYS_MS);
	const sinceDate = since.toISOString().slice(0, 10);

	const data = await withUser(userId, async (tx) => {
		const weights = await tx
			.select()
			.from(weightLogs)
			.where(and(eq(weightLogs.userId, userId), gte(weightLogs.date, sinceDate)))
			.orderBy(weightLogs.date);

		// Aggregate kcal per day (truncate logged_at to day in user's local TZ — we use UTC here for v1)
		const totals = await tx
			.select({
				date: sql<string>`to_char(${entriesTable.loggedAt}::date, 'YYYY-MM-DD')`,
				kcal: sql<string>`sum(${entriesTable.kcal})`
			})
			.from(entriesTable)
			.where(and(eq(entriesTable.userId, userId), gte(entriesTable.loggedAt, since)))
			.groupBy(sql`${entriesTable.loggedAt}::date`);

		return { weights, totals };
	});

	return {
		weights: data.weights.map((w) => ({ date: w.date, kg: Number(w.kg) })),
		dailyKcal: data.totals.map((t) => ({ date: t.date, kcal: Number(t.kcal) }))
	};
};

export const actions: Actions = {
	logWeight: async ({ locals, request }) => {
		const userId = locals.user!.id;
		const form = await request.formData();
		const kg = Number(form.get('kg') ?? 0);
		const date = (form.get('date') as string) || new Date().toISOString().slice(0, 10);

		if (!kg || kg < 20 || kg > 400) {
			return fail(400, { error: 'INVALID_WEIGHT', correlationId: locals.correlationId });
		}

		try {
			await withUser(userId, (tx) =>
				tx
					.insert(weightLogs)
					.values({ userId, date, kg: String(kg) })
					.onConflictDoUpdate({
						target: [weightLogs.userId, weightLogs.date],
						set: { kg: String(kg), loggedAt: new Date() }
					})
			);
			return { success: true };
		} catch (e) {
			logger.error('logWeight failed', {
				error: String(e),
				correlationId: locals.correlationId
			});
			return fail(500, { error: 'LOG_WEIGHT_FAILED', correlationId: locals.correlationId });
		}
	}
};

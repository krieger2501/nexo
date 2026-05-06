import { fail } from '@sveltejs/kit';
import { db, userSettings } from '@nexo/db';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const [row] = await db
		.select()
		.from(userSettings)
		.where(eq(userSettings.userId, userId))
		.limit(1);

	return {
		displayName: row?.displayName ?? '',
		currency: row?.currency ?? 'EUR',
		weekStartDay: row?.weekStartDay ?? 'monday'
	};
};

export const actions: Actions = {
	save: async ({ locals, request }) => {
		const form = await request.formData();
		const displayName = (form.get('displayName') as string).trim() || null;
		const currency = form.get('currency') as string;
		const weekStartDay = form.get('weekStartDay') as string;

		try {
			await db
				.insert(userSettings)
				.values({ userId: locals.user!.id, displayName, currency, weekStartDay })
				.onConflictDoUpdate({
					target: userSettings.userId,
					set: { displayName, currency, weekStartDay, updatedAt: new Date() }
				});
		} catch {
			return fail(500, { error: 'Failed to save settings' });
		}

		return { success: true };
	}
};

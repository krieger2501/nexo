import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db, pushSubscription } from '@nexo/db';
import { and, desc, eq } from 'drizzle-orm';
import { env as publicEnv } from '$env/dynamic/public';
import { logger } from '$lib/server/logger';
import { dockerGet, dockerAction } from '$lib/server/docker';
import type { ContainerInfo } from '$lib/server/docker';
import { ctnName } from '$lib/utils/containers';
import { requireOwner } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const devices = await db
		.select()
		.from(pushSubscription)
		.where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.app, 'admin')))
		.orderBy(desc(pushSubscription.createdAt));

	return {
		devices,
		vapidPublicKey: publicEnv.PUBLIC_VAPID_PUBLIC_KEY ?? '',
		diagnostics: {
			userId,
			email: locals.user?.email ?? null,
			correlationId: locals.correlationId
		}
	};
};

export const actions: Actions = {
	rename: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const label = String(fd.get('label') ?? '')
			.trim()
			.slice(0, 64);
		if (!id) return fail(400, { error: 'MISSING_ID' as const });

		try {
			await db
				.update(pushSubscription)
				.set({ label: label || null })
				.where(and(eq(pushSubscription.id, id), eq(pushSubscription.userId, userId)));
		} catch (e) {
			logger.error('rename device failed', { userId, error: String(e) });
			return fail(500, { error: 'DB_ERROR' as const, correlationId: locals.correlationId });
		}
		return { success: true as const, toast: 'Device renamed' };
	},

	remove: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'MISSING_ID' as const });

		try {
			await db
				.delete(pushSubscription)
				.where(and(eq(pushSubscription.id, id), eq(pushSubscription.userId, userId)));
		} catch (e) {
			logger.error('remove device failed', { userId, error: String(e) });
			return fail(500, { error: 'DB_ERROR' as const, correlationId: locals.correlationId });
		}
		return { success: true as const, toast: 'Device removed' };
	},

	// Bulk restart every container in a profile network. Sized for incident
	// response — moved here from the home page so it's not one tap away.
	restartProfile: async ({ request, locals }) => {
		requireOwner(locals);
		const data = await request.formData();
		const profile = String(data.get('profile') ?? '');
		if (profile !== 'production' && profile !== 'preview') {
			return fail(400, {
				error: 'BAD_PROFILE' as const,
				failed: [] as string[],
				correlationId: locals.correlationId
			});
		}

		const list = await dockerGet<ContainerInfo[]>(
			`/containers/json?filters=${encodeURIComponent(JSON.stringify({ network: [`nexo-${profile}`] }))}`
		).catch(() => [] as ContainerInfo[]);

		logger.info('restartProfile', {
			profile,
			count: list.length,
			correlationId: locals.correlationId
		});

		const results = await Promise.allSettled(
			list.map((c) => dockerAction(`/containers/${c.Id}/restart?t=10`))
		);
		const failed = results
			.map((r, i) => ({ r, name: ctnName(list[i]!) }))
			.filter(({ r }) => r.status === 'rejected')
			.map(({ name }) => name);

		if (failed.length > 0) {
			logger.error('restartProfile partial failure', {
				failed,
				correlationId: locals.correlationId
			});
			return fail(500, {
				error: 'RESTART_PARTIAL' as const,
				failed,
				correlationId: locals.correlationId
			});
		}
		return {
			success: true as const,
			restarted: list.length,
			toast: `Restarted ${list.length} containers`
		};
	}
};

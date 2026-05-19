import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { db, pushSubscription } from '@nexo/db';
import { and, eq } from 'drizzle-orm';
import { sendToUser, type PushPayload } from './server.js';

// Each app populates `locals.user` in its hooks, but the shared package
// can't reach those App.Locals augmentations — narrow on read.
type SessionUser = { id: string; email: string; name: string };
type LocalsWithUser = { user?: SessionUser | null };

type SubscribeBody = {
	subscription: {
		endpoint: string;
		keys: { p256dh: string; auth: string };
	};
	label?: string;
};

function parseSubscribe(body: unknown): SubscribeBody | null {
	if (typeof body !== 'object' || body === null) return null;
	const b = body as Record<string, unknown>;
	const sub = b.subscription as Record<string, unknown> | undefined;
	if (!sub || typeof sub.endpoint !== 'string') return null;
	const keys = sub.keys as Record<string, unknown> | undefined;
	if (!keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') return null;
	return {
		subscription: {
			endpoint: sub.endpoint,
			keys: { p256dh: keys.p256dh, auth: keys.auth }
		},
		label: typeof b.label === 'string' ? b.label : undefined
	};
}

export function subscribeHandler(app: string): RequestHandler {
	return async ({ request, locals }) => {
		const user = (locals as LocalsWithUser).user;
		if (!user) throw error(401, 'unauthorized');

		const body = parseSubscribe(await request.json().catch(() => null));
		if (!body) throw error(400, 'invalid subscription');

		const userAgent = request.headers.get('user-agent') ?? null;

		await db
			.insert(pushSubscription)
			.values({
				userId: user.id,
				app,
				endpoint: body.subscription.endpoint,
				p256dh: body.subscription.keys.p256dh,
				auth: body.subscription.keys.auth,
				userAgent,
				label: body.label ?? null,
				lastUsedAt: new Date()
			})
			.onConflictDoUpdate({
				target: [pushSubscription.userId, pushSubscription.app, pushSubscription.endpoint],
				set: {
					p256dh: body.subscription.keys.p256dh,
					auth: body.subscription.keys.auth,
					userAgent,
					label: body.label ?? null,
					lastUsedAt: new Date()
				}
			});

		return json({ ok: true });
	};
}

export function unsubscribeHandler(app: string): RequestHandler {
	return async ({ request, locals }) => {
		const user = (locals as LocalsWithUser).user;
		if (!user) throw error(401, 'unauthorized');

		const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
		if (!body?.endpoint) throw error(400, 'missing endpoint');

		await db
			.delete(pushSubscription)
			.where(
				and(
					eq(pushSubscription.userId, user.id),
					eq(pushSubscription.app, app),
					eq(pushSubscription.endpoint, body.endpoint)
				)
			);

		return json({ ok: true });
	};
}

export type TestPayloadFactory = (user: SessionUser) => PushPayload;

export function testHandler(app: string, payloadFor: TestPayloadFactory): RequestHandler {
	return async ({ locals }) => {
		const user = (locals as LocalsWithUser).user;
		if (!user) throw error(401, 'unauthorized');
		const result = await sendToUser(user.id, app, payloadFor(user));
		return json({ ok: true, ...result });
	};
}

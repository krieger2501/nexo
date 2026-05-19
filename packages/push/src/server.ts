import webpush from 'web-push';
import { db, pushSubscription } from '@nexo/db';
import { and, eq } from 'drizzle-orm';

let initialized = false;

function init() {
	if (initialized) return;
	const subject = process.env.VAPID_SUBJECT;
	const publicKey = process.env.VAPID_PUBLIC_KEY;
	const privateKey = process.env.VAPID_PRIVATE_KEY;
	if (!subject || !publicKey || !privateKey) {
		throw new Error('VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY must be set');
	}
	webpush.setVapidDetails(subject, publicKey, privateKey);
	initialized = true;
}

export type PushPayload = {
	title: string;
	body?: string;
	icon?: string;
	badge?: string;
	tag?: string;
	url?: string;
	data?: Record<string, unknown>;
	requireInteraction?: boolean;
	silent?: boolean;
	vibrate?: number[];
};

export type SendResult = {
	sent: number;
	pruned: number;
	failed: number;
};

/**
 * Deliver `payload` to every push subscription belonging to `userId` for `app`.
 * Stale endpoints (404/410) are deleted; other errors are counted but not thrown
 * so a single bad endpoint never blocks delivery to the rest.
 */
export async function sendToUser(
	userId: string,
	app: string,
	payload: PushPayload
): Promise<SendResult> {
	init();
	const subs = await db
		.select()
		.from(pushSubscription)
		.where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.app, app)));

	if (subs.length === 0) return { sent: 0, pruned: 0, failed: 0 };

	const json = JSON.stringify(payload);
	let sent = 0;
	let pruned = 0;
	let failed = 0;

	await Promise.all(
		subs.map(async (s) => {
			try {
				await webpush.sendNotification(
					{ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
					json
				);
				await db
					.update(pushSubscription)
					.set({ lastUsedAt: new Date() })
					.where(eq(pushSubscription.id, s.id));
				sent++;
			} catch (err: unknown) {
				const status = (err as { statusCode?: number })?.statusCode;
				if (status === 404 || status === 410) {
					await db.delete(pushSubscription).where(eq(pushSubscription.id, s.id));
					pruned++;
				} else {
					failed++;
				}
			}
		})
	);

	return { sent, pruned, failed };
}

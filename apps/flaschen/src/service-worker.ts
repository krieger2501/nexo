/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { installPushHandlers } from '@nexo/push/sw';

declare const self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);

installPushHandlers(self, {
	icon: '/icons/icon-192x192.png',
	badge: '/icons/icon-192x192.png'
});

// Broadcast push payloads to any open client so the dashboard can
// surface the live "hot card" without waiting for a notificationclick.
self.addEventListener('push', (event: PushEvent) => {
	if (!event.data) return;
	let payload: { tag?: string; data?: { dedupeKey?: string } } | null = null;
	try {
		payload = event.data.json() as { tag?: string; data?: { dedupeKey?: string } };
	} catch {
		return;
	}
	const dedupeKey =
		(typeof payload?.data?.dedupeKey === 'string' && payload.data.dedupeKey) ||
		(typeof payload?.tag === 'string' && payload.tag) ||
		null;
	if (!dedupeKey) return;
	event.waitUntil(
		(async () => {
			const clients = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true
			});
			for (const client of clients) {
				client.postMessage({ type: 'flaschen:push', dedupeKey });
			}
		})()
	);
});

self.addEventListener('install', () => {
	void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

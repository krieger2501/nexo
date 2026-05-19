/// <reference lib="webworker" />

export type ReceivedPushPayload = {
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

export type PushHandlerDefaults = {
	icon?: string;
	badge?: string;
};

/**
 * Wires the standard push + notificationclick handlers onto a service worker.
 * Apps can pass per-app defaults (icon/badge) so payload senders don't need
 * to repeat them in every send.
 */
export function installPushHandlers(
	self: ServiceWorkerGlobalScope,
	defaults: PushHandlerDefaults = {}
): void {
	self.addEventListener('push', (event: PushEvent) => {
		const data = readPayload(event);
		if (!data) return;
		event.waitUntil(
			self.registration.showNotification(data.title, {
				body: data.body,
				icon: data.icon ?? defaults.icon ?? '/icons/icon-192x192.png',
				badge: data.badge ?? defaults.badge,
				tag: data.tag,
				data: { url: data.url, ...data.data },
				requireInteraction: data.requireInteraction,
				silent: data.silent,
				// `vibrate` is widely supported on Android Chrome but not in the
				// current TS DOM lib types — assert through.
				...({ vibrate: data.vibrate } as object)
			})
		);
	});

	self.addEventListener('notificationclick', (event: NotificationEvent) => {
		event.notification.close();
		const url = (event.notification.data as { url?: string } | null)?.url ?? '/';
		event.waitUntil(focusOrOpen(self, url));
	});
}

function readPayload(event: PushEvent): ReceivedPushPayload | null {
	if (!event.data) return null;
	try {
		return event.data.json() as ReceivedPushPayload;
	} catch {
		const text = event.data.text();
		return text ? { title: text } : null;
	}
}

async function focusOrOpen(self: ServiceWorkerGlobalScope, url: string): Promise<void> {
	const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
	for (const client of clients) {
		try {
			const clientUrl = new URL(client.url);
			const target = new URL(url, clientUrl.origin);
			if (clientUrl.origin === target.origin) {
				await (client as WindowClient).navigate(target.href).catch(() => undefined);
				return (client as WindowClient).focus().then(() => undefined);
			}
		} catch {
			// ignore parse errors and fall through to openWindow
		}
	}
	await self.clients.openWindow(url);
}

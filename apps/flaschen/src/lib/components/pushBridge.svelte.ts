/**
 * SW → client bridge for live pushes.
 *
 * The service worker broadcasts each push payload to all controlled
 * windows; this module surfaces them as a reactive store the dashboard
 * subscribes to. We dedupe by `dedupeKey` so a notification + an open
 * tab don't double-fire.
 */
import { browser } from '$app/environment';

type LivePush = {
	dedupeKey: string;
	receivedAt: number;
};

let last = $state<LivePush | null>(null);
let installed = false;

function install() {
	if (!browser || installed) return;
	if (!('serviceWorker' in navigator)) return;
	installed = true;
	navigator.serviceWorker.addEventListener('message', (event) => {
		const data = event.data as { type?: string; dedupeKey?: string } | undefined;
		if (!data || data.type !== 'flaschen:push') return;
		const key = typeof data.dedupeKey === 'string' ? data.dedupeKey : null;
		if (!key) return;
		last = { dedupeKey: key, receivedAt: Date.now() };
	});
}

export const pushBridge = {
	get latest() {
		return last;
	},
	clear() {
		last = null;
	},
	install
};

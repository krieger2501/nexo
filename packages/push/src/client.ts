export type EnableResult = { ok: true } | { ok: false; reason: string };
export type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
	const padding = '='.repeat((4 - (base64.length % 4)) % 4);
	const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(normalized);
	const out = new Uint8Array(new ArrayBuffer(raw.length));
	for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
	return out;
}

function isSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

export async function getPermissionState(): Promise<PermissionState> {
	if (!isSupported()) return 'unsupported';
	return Notification.permission as PermissionState;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
	if (!isSupported()) return null;
	const reg = await navigator.serviceWorker.ready;
	return reg.pushManager.getSubscription();
}

export async function enableNotifications(opts: {
	app: string;
	vapidPublicKey: string;
	label?: string;
}): Promise<EnableResult> {
	if (!isSupported()) return { ok: false, reason: 'unsupported' };

	const reg = await navigator.serviceWorker.ready;
	const perm = await Notification.requestPermission();
	if (perm !== 'granted') return { ok: false, reason: perm };

	let sub = await reg.pushManager.getSubscription();
	if (!sub) {
		try {
			sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(opts.vapidPublicKey)
			});
		} catch (err) {
			return { ok: false, reason: `subscribe-failed: ${(err as Error).message}` };
		}
	}

	const res = await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			app: opts.app,
			label: opts.label ?? null,
			subscription: sub.toJSON()
		})
	});

	if (!res.ok) return { ok: false, reason: `server-${res.status}` };
	return { ok: true };
}

export async function disableNotifications(): Promise<{ ok: boolean }> {
	if (!isSupported()) return { ok: false };
	const reg = await navigator.serviceWorker.ready;
	const sub = await reg.pushManager.getSubscription();
	if (!sub) return { ok: true };

	const endpoint = sub.endpoint;
	await sub.unsubscribe().catch(() => undefined);

	await fetch('/api/push/unsubscribe', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ endpoint })
	});

	return { ok: true };
}

export async function sendTest(): Promise<{ ok: boolean }> {
	const res = await fetch('/api/push/test', { method: 'POST' });
	return { ok: res.ok };
}

export function isStandalone(): boolean {
	if (typeof window === 'undefined') return false;
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true
	);
}

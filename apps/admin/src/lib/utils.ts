export function fmtRelative(iso: string | null): string {
	if (!iso || iso.startsWith('0001')) return '—';
	const diff = Date.now() - new Date(iso).getTime();
	const s = Math.floor(diff / 1000);
	if (s < 60) return `${s}s ago`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	return `${Math.floor(h / 24)}d ago`;
}

export function initials(e: { name: string | null; email: string }): string {
	if (e.name)
		return e.name
			.split(' ')
			.map((s) => s[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	return e.email[0].toUpperCase();
}

export function displayName(e: { name: string | null; email: string }): string {
	return e.name ?? e.email;
}

export function entryStatus(e: {
	type: string;
	allowed: boolean;
}): 'active' | 'invited' | 'blocked' {
	if (e.type === 'invited') return 'invited';
	if (e.allowed) return 'active';
	return 'blocked';
}

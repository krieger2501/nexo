export type ParsedUA = {
	device: 'phone' | 'tablet' | 'desktop';
	browser: string;
	os: string;
	summary: string;
};

export function parseUserAgent(ua: string | null | undefined): ParsedUA {
	if (!ua)
		return { device: 'desktop', browser: 'Unknown', os: 'Unknown', summary: 'Unknown device' };

	const device = detectDevice(ua);
	const browser = detectBrowser(ua);
	const os = detectOS(ua);
	const summary = `${browser} on ${device === 'desktop' ? os : device === 'phone' ? 'iPhone' : 'iPad'}`;

	return { device, browser, os, summary };
}

function detectDevice(ua: string): 'phone' | 'tablet' | 'desktop' {
	if (/iPhone|Android.*Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return 'phone';
	if (/iPad|Android(?!.*Mobile)|tablet/i.test(ua)) return 'tablet';
	return 'desktop';
}

function detectBrowser(ua: string): string {
	if (/Arc\//i.test(ua)) return 'Arc';
	if (/Edg\//i.test(ua)) return 'Edge';
	if (/OPR\/|Opera/i.test(ua)) return 'Opera';
	if (/Firefox\//i.test(ua)) return 'Firefox';
	if (/CriOS|Chrome\//i.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
	if (/Safari\//i.test(ua) && !/Chrome/.test(ua)) return 'Safari';
	return 'Other';
}

function detectOS(ua: string): string {
	if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
	if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
	if (/Windows/i.test(ua)) return 'Windows';
	if (/Android/i.test(ua)) return 'Android';
	if (/Linux/i.test(ua)) return 'Linux';
	return 'Unknown';
}

export function deviceIcon(device: 'phone' | 'tablet' | 'desktop', os: string): string {
	if (device === 'phone') return '\u{1F4F1}';
	if (device === 'tablet') return '\u{1F4F2}';
	if (os === 'macOS') return '\u{1F5A5}️';
	return '\u{1F4BB}';
}

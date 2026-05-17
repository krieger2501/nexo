type Density = 'compact' | 'regular' | 'comfy';
type TimeMode = 'rel' | 'abs';

const DEFAULTS = {
	logDark: false,
	logWrap: true,
	logDensity: 'regular' as Density,
	timeMode: 'rel' as TimeMode
};

function loadFromStorage(): typeof DEFAULTS {
	if (typeof localStorage === 'undefined') return { ...DEFAULTS };
	try {
		return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('nexo-admin-settings') ?? '{}') };
	} catch {
		return { ...DEFAULTS };
	}
}

export const settings = $state(loadFromStorage());

export function persistSettings() {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem('nexo-admin-settings', JSON.stringify(settings));
}

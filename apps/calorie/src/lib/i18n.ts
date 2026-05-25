import en from '../../messages/en.json';
import de from '../../messages/de.json';

type Messages = typeof en;
type Key = keyof Messages;

const dict = { en, de } as const;
type Locale = keyof typeof dict;

const currentLocale: Locale = 'en';

// Mirrors paraglide's `m.key_name()` shape — each key becomes a function.
export const m = new Proxy({} as Record<Key, () => string>, {
	get(_t, prop: string) {
		return () => (dict[currentLocale] as Messages)[prop as Key] ?? prop;
	}
});

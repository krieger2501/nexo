/**
 * Nexo email design tokens — aligned with the in-app system.
 *
 * Light off-white surfaces, Inter sans, JetBrains Mono for metadata,
 * green accent (per-app accents on app cards). Personality lives in the
 * pulsing-dot eyebrow pill, the gradient-ink headline, and a handwritten
 * "— Kevin" sign-off. Dark mode is a graceful counterpart for clients
 * that honour `prefers-color-scheme` (Apple Mail, iOS Mail, Outlook.com).
 *
 * Doubled selectors (`.x.x`) win specificity over inline styles in
 * supporting clients. Gmail / Outlook Desktop render the light palette.
 */

export const palette = {
	/** Page background — off-white (matches --color-bg-0) */
	bg: '#fafaf9',
	bgSoft: '#f4f4f2',

	/** Card surface */
	surface: '#ffffff',

	/** Ink scale — matches --color-text-* */
	ink: '#18181b',
	inkMuted: '#52525b',
	inkSubtle: '#71717a',
	inkFaint: '#a1a1aa',

	/** Hairlines */
	rule: 'rgba(10,10,10,0.10)',
	ruleSoft: 'rgba(10,10,10,0.06)',
	ruleStrong: 'rgba(10,10,10,0.18)',

	/** Brand accent — Nexo green */
	accent: '#16a34a',
	accentSoft: '#dcfce7',
	accentInk: '#0f5132',

	white: '#ffffff'
} as const;

const paletteDark = {
	bg: '#0a0a0a',
	bgSoft: '#141414',
	surface: '#161616',

	ink: '#fafaf9',
	inkMuted: '#a1a1aa',
	inkSubtle: '#71717a',
	inkFaint: '#52525b',

	rule: 'rgba(250,250,249,0.14)',
	ruleSoft: 'rgba(250,250,249,0.08)',
	ruleStrong: 'rgba(250,250,249,0.22)',

	accent: '#22c55e',
	accentSoft: 'rgba(34,197,94,0.14)',
	accentInk: '#86efac'
} as const;

export const fonts = {
	sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
	mono: "'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, Consolas, monospace"
} as const;

export interface AppMeta {
	accent: string;
	accentDark: string;
	monogram: string;
	tagline: string;
	features: readonly string[];
}

/** Per-app accents — mirror packages/ui/tokens.css (`--color-accent-*`) and the landing config. */
export const APP_META: Record<string, AppMeta> = {
	finance: {
		accent: '#16a34a',
		accentDark: '#4ade80',
		monogram: 'F',
		tagline: 'Personal ledger',
		features: [
			'Track income, expenses & debts',
			'Spending breakdown by category',
			'Recurring commitments at a glance'
		]
	},
	flaschen: {
		accent: '#b81264',
		accentDark: '#f472a8',
		monogram: 'FL',
		tagline: 'Shift-offer notifier',
		features: [
			'Live Flaschenpost availability',
			'Match rules push to your phone',
			'Connect once, watch forever'
		]
	},
	calorie: {
		accent: '#b85a3a',
		accentDark: '#f0986d',
		monogram: 'C',
		tagline: 'Macros & meals',
		features: [
			'Log meals against daily targets',
			'Macro split with tabular numerals',
			'Streaks and weekly trends'
		]
	},
	gym: {
		accent: '#f97316',
		accentDark: '#fdba74',
		monogram: 'G',
		tagline: 'Workout journal',
		features: ['Log workouts, sets & reps', 'Personal records over time', 'Plate math built in']
	},
	pomodoro: {
		accent: '#ef4444',
		accentDark: '#fca5a5',
		monogram: 'P',
		tagline: 'Focus timer',
		features: ['Tomato cycles with breaks', 'Daily session history', 'Custom intervals per task']
	}
} as const;

export const APP_FALLBACK: AppMeta = {
	accent: palette.ink,
	accentDark: paletteDark.ink,
	monogram: '·',
	tagline: 'New tool',
	features: ['Powerful new tools', 'Seamlessly integrated', 'Always improving']
} as const;

/** Format a date as "2026 · 05 · 25" — small mono caps, the same shape used in the app's meta pills. */
export function postmarkDate(d: Date = new Date()): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y} · ${m} · ${day}`;
}

export function emailStyles(): string {
	return `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

body, table, td, p, a, h1, h2, h3 {
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}
table { border-collapse: collapse; }
img { display: block; outline: none; border: 0; text-decoration: none; }

.sans { font-family: ${fonts.sans}; }
.mono { font-family: ${fonts.mono}; }

/* Pulsing accent dot — Nexo signature. Static fallback in clients that strip animations. */
.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${palette.accent};
  vertical-align: middle;
}
.dot-pulse { animation: nexo-pulse 2.4s cubic-bezier(0.65,0,0.35,1) infinite; }
@keyframes nexo-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(0.75); }
}

/* Gradient ink headline — falls back to solid ink in unsupported clients via inline color. */
.grad-ink {
  background: linear-gradient(175deg, ${palette.ink} 0%, ${palette.inkSubtle} 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

@media (prefers-color-scheme: dark) {
  body.body.body { background: ${paletteDark.bg} !important; }
  .envelope.envelope { background: ${paletteDark.surface} !important; border-color: ${paletteDark.rule} !important; box-shadow: none !important; }
  .surface.surface { background: ${paletteDark.surface} !important; }
  .bgsoft.bgsoft { background: ${paletteDark.bgSoft} !important; }
  .ink.ink { color: ${paletteDark.ink} !important; }
  .ink-muted.ink-muted { color: ${paletteDark.inkMuted} !important; }
  .ink-subtle.ink-subtle { color: ${paletteDark.inkSubtle} !important; }
  .ink-faint.ink-faint { color: ${paletteDark.inkFaint} !important; }
  .rule.rule { border-color: ${paletteDark.rule} !important; }
  .rule-soft.rule-soft { border-color: ${paletteDark.ruleSoft} !important; }
  .card.card { background: ${paletteDark.surface} !important; border-color: ${paletteDark.rule} !important; }
  .pill.pill { background: ${paletteDark.bgSoft} !important; border-color: ${paletteDark.rule} !important; color: ${paletteDark.inkMuted} !important; }
  .cta.cta { background: ${paletteDark.accent} !important; }
  .cta-text.cta-text { color: ${paletteDark.bg} !important; }
  .grad-ink.grad-ink { background: linear-gradient(175deg, ${paletteDark.ink} 0%, ${paletteDark.inkSubtle} 100%) !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important; }
  .accent-text-dark.accent-text-dark-finance  { color: ${APP_META.finance.accentDark} !important; }
  .accent-text-dark.accent-text-dark-flaschen { color: ${APP_META.flaschen.accentDark} !important; }
  .accent-text-dark.accent-text-dark-calorie  { color: ${APP_META.calorie.accentDark} !important; }
  .accent-text-dark.accent-text-dark-gym      { color: ${APP_META.gym.accentDark} !important; }
  .accent-text-dark.accent-text-dark-pomodoro { color: ${APP_META.pomodoro.accentDark} !important; }
  .accent-bg-dark.accent-bg-dark-finance  { background: ${APP_META.finance.accentDark} !important; }
  .accent-bg-dark.accent-bg-dark-flaschen { background: ${APP_META.flaschen.accentDark} !important; }
  .accent-bg-dark.accent-bg-dark-calorie  { background: ${APP_META.calorie.accentDark} !important; }
  .accent-bg-dark.accent-bg-dark-gym      { background: ${APP_META.gym.accentDark} !important; }
  .accent-bg-dark.accent-bg-dark-pomodoro { background: ${APP_META.pomodoro.accentDark} !important; }
  [data-ox-darkmode-bgcolor] { background-color: ${paletteDark.bg} !important; }
}
`.trim();
}

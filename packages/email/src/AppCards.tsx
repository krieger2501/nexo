import { Section } from 'react-email';
import * as React from 'react';
import { APP_META, APP_FALLBACK, palette, fonts } from './theme.js';

export interface AppInfo {
	id: string;
	label: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Landing-style app cards, scaled for email:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ ┌────┐                                       ⬤ READY         │
 *   │ │ F  │  Finance                                              │
 *   │ └────┘  Personal ledger                                      │
 *   │                                                              │
 *   │ · Track income, expenses & debts                             │
 *   │ · Spending breakdown by category                             │
 *   │ · Recurring commitments at a glance                          │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Each card carries the per-app accent on the monogram tile and the
 * "READY" status pill. Everything else stays in the system's ink stack.
 * ─────────────────────────────────────────────────────────────────────── */

interface AppCardsProps {
	apps: AppInfo[];
}

export function AppCards({ apps }: AppCardsProps) {
	return (
		<Section style={section}>
			{apps.map((app, i) => {
				const meta = APP_META[app.id] ?? APP_FALLBACK;
				const last = i === apps.length - 1;

				const tileBg = mix(meta.accent, palette.surface, 0.12);
				const tileBorder = mix(meta.accent, palette.rule, 0.32);
				const pillBorder = mix(meta.accent, 'transparent', 0.3);
				const pillBg = mix(meta.accent, 'transparent', 0.1);
				const accentInk = mix(meta.accent, '#000', 0.8);

				return (
					<table
						key={app.id}
						cellPadding="0"
						cellSpacing="0"
						className="card"
						style={{
							...card,
							marginBottom: last ? 0 : '12px'
						}}
					>
						<tbody>
							<tr>
								<td style={cardInner}>
									{/* Header row — monogram tile + name/tagline + ready pill */}
									<table cellPadding="0" cellSpacing="0" style={fullWidth}>
										<tbody>
											<tr>
												<td style={tileCell}>
													<div
														className={`accent-bg-dark accent-bg-dark-${app.id}`}
														style={{
															...tile,
															backgroundColor: tileBg,
															border: `1px solid ${tileBorder}`,
															color: accentInk
														}}
													>
														<span
															className={`accent-text-dark accent-text-dark-${app.id}`}
															style={tileMonogram}
														>
															{meta.monogram}
														</span>
													</div>
												</td>
												<td style={titleCell}>
													<div className="ink sans" style={appName}>
														{app.label}
													</div>
													<div className="ink-subtle sans" style={appTagline}>
														{meta.tagline}
													</div>
												</td>
												<td style={pillCell}>
													<span
														className={`pill accent-text-dark accent-text-dark-${app.id}`}
														style={{
															...readyPill,
															color: accentInk,
															borderColor: pillBorder,
															backgroundColor: pillBg
														}}
													>
														<span
															className={`accent-bg-dark accent-bg-dark-${app.id}`}
															style={{
																...pillDot,
																backgroundColor: meta.accent
															}}
														/>
														READY
													</span>
												</td>
											</tr>
										</tbody>
									</table>

									{/* Hairline + features */}
									<div className="rule-soft" style={featureWrap}>
										{meta.features.map((f, fi) => (
											<table
												key={fi}
												cellPadding="0"
												cellSpacing="0"
												style={{
													...fullWidth,
													marginBottom: fi === meta.features.length - 1 ? 0 : '4px'
												}}
											>
												<tbody>
													<tr>
														<td style={dotCell}>
															<span className="ink-faint mono" style={dotMark}>
																·
															</span>
														</td>
														<td className="ink-muted sans" style={featureCell}>
															{f}
														</td>
													</tr>
												</tbody>
											</table>
										))}
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				);
			})}
		</Section>
	);
}

/* color-mix() polyfill via simple linear blend in sRGB.
 * Gives us per-app tinted backgrounds without leaning on CSS that Outlook strips. */
function mix(a: string, b: string, weightA: number): string {
	const A = parseColor(a);
	const B = b === 'transparent' ? { ...A, a: 0 } : parseColor(b);
	const w = Math.max(0, Math.min(1, weightA));
	const r = Math.round(A.r * w + B.r * (1 - w));
	const g = Math.round(A.g * w + B.g * (1 - w));
	const bl = Math.round(A.b * w + B.b * (1 - w));
	const al = A.a * w + B.a * (1 - w);
	return al < 1 ? `rgba(${r}, ${g}, ${bl}, ${round(al, 3)})` : `rgb(${r}, ${g}, ${bl})`;
}

function parseColor(s: string): { r: number; g: number; b: number; a: number } {
	if (s.startsWith('#')) {
		const hex = s.slice(1);
		const full =
			hex.length === 3
				? hex
						.split('')
						.map((c) => c + c)
						.join('')
				: hex;
		return {
			r: parseInt(full.slice(0, 2), 16),
			g: parseInt(full.slice(2, 4), 16),
			b: parseInt(full.slice(4, 6), 16),
			a: 1
		};
	}
	const m = s.match(/rgba?\(([^)]+)\)/i);
	if (m) {
		const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
		return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
	}
	return { r: 24, g: 24, b: 27, a: 1 };
}

function round(n: number, p: number) {
	const f = Math.pow(10, p);
	return Math.round(n * f) / f;
}

/* ── Styles ────────────────────────────────────────────────────────────── */

const section: React.CSSProperties = {
	margin: '0 0 28px'
};

const fullWidth: React.CSSProperties = { width: '100%' };

const card: React.CSSProperties = {
	width: '100%',
	backgroundColor: palette.surface,
	border: `1px solid ${palette.rule}`,
	borderRadius: '14px',
	overflow: 'hidden'
};

const cardInner: React.CSSProperties = {
	padding: '18px 20px',
	verticalAlign: 'top'
};

const tileCell: React.CSSProperties = {
	width: '46px',
	verticalAlign: 'top',
	paddingRight: '14px'
};

const tile: React.CSSProperties = {
	width: '46px',
	height: '46px',
	borderRadius: '10px',
	textAlign: 'center',
	verticalAlign: 'middle',
	display: 'inline-block',
	lineHeight: '44px',
	fontFamily: fonts.mono,
	fontWeight: 500,
	fontSize: '21px',
	letterSpacing: '-0.02em'
};

const tileMonogram: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontWeight: 500
};

const titleCell: React.CSSProperties = {
	verticalAlign: 'middle',
	paddingRight: '12px'
};

const appName: React.CSSProperties = {
	fontFamily: fonts.sans,
	fontSize: '18px',
	fontWeight: 600,
	letterSpacing: '-0.018em',
	color: palette.ink,
	lineHeight: 1.2,
	margin: 0
};

const appTagline: React.CSSProperties = {
	fontFamily: fonts.sans,
	fontSize: '13px',
	fontWeight: 400,
	color: palette.inkSubtle,
	lineHeight: 1.4,
	marginTop: '3px'
};

const pillCell: React.CSSProperties = {
	width: '78px',
	verticalAlign: 'middle',
	textAlign: 'right'
};

const readyPill: React.CSSProperties = {
	display: 'inline-block',
	fontFamily: fonts.mono,
	fontSize: '10px',
	fontWeight: 600,
	letterSpacing: '0.1em',
	textTransform: 'uppercase',
	padding: '4px 9px 4px 8px',
	border: '1px solid',
	borderRadius: '999px',
	verticalAlign: 'middle',
	whiteSpace: 'nowrap'
};

const pillDot: React.CSSProperties = {
	display: 'inline-block',
	width: '6px',
	height: '6px',
	borderRadius: '50%',
	marginRight: '6px',
	verticalAlign: 'middle',
	position: 'relative',
	top: '-1px'
};

const featureWrap: React.CSSProperties = {
	marginTop: '14px',
	paddingTop: '12px',
	borderTop: `1px solid ${palette.ruleSoft}`
};

const dotCell: React.CSSProperties = {
	width: '14px',
	verticalAlign: 'top',
	paddingTop: '1px'
};

const dotMark: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: '14px',
	color: palette.inkFaint,
	lineHeight: 1.5
};

const featureCell: React.CSSProperties = {
	fontFamily: fonts.sans,
	fontSize: '13.5px',
	color: palette.inkMuted,
	lineHeight: 1.55,
	paddingLeft: '4px'
};

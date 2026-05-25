import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'react-email';
import * as React from 'react';
import { emailStyles, fonts, palette, postmarkDate } from './theme.js';

interface EmailShellProps {
	previewText: string;
	eyebrow: string;
	heading: React.ReactNode;
	sub: string;
	children: React.ReactNode;
	footerNote?: string;
	postscript?: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Shared chrome for every Nexo email — pulls directly from the in-app
 * vocabulary:
 *   · brand row (favicon + "Nexo" wordmark)
 *   · pulsing-dot eyebrow pill (with dated stamp)
 *   · gradient-ink headline (falls back to solid ink in Outlook)
 *   · sub copy in the system muted ink
 *   · slot for body
 *   · handwritten sign-off + optional P.S. (the friends-and-family note)
 *   · subtle fineprint
 * ─────────────────────────────────────────────────────────────────────── */

export function EmailShell({
	previewText,
	eyebrow,
	heading,
	sub,
	children,
	footerNote,
	postscript
}: EmailShellProps) {
	const date = postmarkDate();

	return (
		<Html>
			<Head>
				<meta name="color-scheme" content="light dark" />
				<meta name="supported-color-schemes" content="light dark" />
				<style type="text/css" dangerouslySetInnerHTML={{ __html: emailStyles() }} />
			</Head>
			<Preview>{previewText}</Preview>
			<Body className="body sans" style={body}>
				<Container className="envelope" style={envelope}>
					{/* ── Brand row ── */}
					<Section style={brandRow}>
						<table cellPadding="0" cellSpacing="0" style={fullWidth}>
							<tbody>
								<tr>
									<td style={{ verticalAlign: 'middle' }}>
										<table cellPadding="0" cellSpacing="0">
											<tbody>
												<tr>
													<td style={{ paddingRight: '8px', verticalAlign: 'middle' }}>
														<NexoMark />
													</td>
													<td style={{ verticalAlign: 'middle' }}>
														<span className="ink sans" style={brandName}>
															Nexo
														</span>
													</td>
												</tr>
											</tbody>
										</table>
									</td>
									<td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
										<span className="ink-faint mono" style={brandDate}>
											{date}
										</span>
									</td>
								</tr>
							</tbody>
						</table>
					</Section>

					{/* ── Hero: eyebrow + heading + sub ── */}
					<Section style={hero}>
						{/* Eyebrow pill — table-based for Outlook compat */}
						<table cellPadding="0" cellSpacing="0" style={{ marginBottom: '16px' }}>
							<tbody>
								<tr>
									<td className="pill rule-soft" style={eyebrowPill}>
										<table cellPadding="0" cellSpacing="0">
											<tbody>
												<tr>
													<td style={{ verticalAlign: 'middle', paddingRight: '8px' }}>
														<span className="dot dot-pulse" style={eyebrowDot} />
													</td>
													<td style={{ verticalAlign: 'middle' }}>
														<span className="ink-muted mono" style={eyebrowText}>
															{eyebrow}
														</span>
													</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>

						<Heading className="grad-ink sans" style={heroHeading}>
							{heading}
						</Heading>
						<Text className="ink-muted sans" style={heroSub}>
							{sub}
						</Text>
					</Section>

					{/* ── Body ── */}
					<Section style={bodyWrap}>{children}</Section>

					{/* ── Sign-off (the personal touch) ── */}
					<Section style={signoffWrap}>
						<div className="rule-soft" style={signoffDivider} />
						<Text className="ink sans" style={signoffLine}>
							— Kevin
						</Text>
						{postscript && (
							<Text className="ink-muted sans" style={postscriptLine}>
								<span className="ink-faint mono" style={postscriptLabel}>
									P.S.
								</span>{' '}
								{postscript}
							</Text>
						)}
					</Section>

					{/* ── Fineprint ── */}
					{footerNote && (
						<Section style={fineprintWrap}>
							<Text className="ink-faint sans" style={fineprint}>
								{footerNote}
							</Text>
						</Section>
					)}
				</Container>

				{/* ── Bottom meta bar — out-of-card, like a faint stamp ── */}
				<table cellPadding="0" cellSpacing="0" style={metaBar}>
					<tbody>
						<tr>
							<td style={{ textAlign: 'center' }}>
								<span className="ink-faint mono" style={metaText}>
									krieger2501.de · {date}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</Body>
		</Html>
	);
}

/* ── Nexo wordmark — inline SVG so it renders without an asset host ───── */
function NexoMark() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
			style={{ display: 'block' }}
		>
			<rect width="100" height="100" rx="22" fill="#0f2010" />
			<circle cx="30" cy="30" r="6" fill="#16a34a" />
			<circle cx="70" cy="70" r="6" fill="#16a34a" />
			<path
				d="M30 36 L30 70 M70 30 L70 64"
				stroke="#16a34a"
				strokeWidth="8"
				strokeLinecap="round"
			/>
			<path d="M33 33 L67 67" stroke="#16a34a" strokeWidth="8" strokeLinecap="round" />
		</svg>
	);
}

/* ── CTA pill (green, app-style) ──────────────────────────────────────── */
export function CtaButton({ href, label }: { href: string; label: string }) {
	return (
		<table cellPadding="0" cellSpacing="0" role="presentation" style={{ marginTop: '8px' }}>
			<tbody>
				<tr>
					<td className="cta" style={ctaTd}>
						<a href={href} className="cta-text" style={ctaLink}>
							{label}&nbsp;&nbsp;→
						</a>
					</td>
				</tr>
			</tbody>
		</table>
	);
}

/* ── Section label (mono small caps) ──────────────────────────────────── */
export function SectionLabel({ left, right }: { left: string; right?: string }) {
	return (
		<table cellPadding="0" cellSpacing="0" style={{ ...fullWidth, marginBottom: '14px' }}>
			<tbody>
				<tr>
					<td>
						<Text className="ink-subtle mono" style={sectionLabel}>
							{left}
						</Text>
					</td>
					{right && (
						<td style={{ textAlign: 'right' }}>
							<Text className="ink-faint mono" style={sectionMeta}>
								{right}
							</Text>
						</td>
					)}
				</tr>
			</tbody>
		</table>
	);
}

/* ── Styles ───────────────────────────────────────────────────────────── */

const fullWidth: React.CSSProperties = { width: '100%' };

const body: React.CSSProperties = {
	backgroundColor: palette.bg,
	fontFamily: fonts.sans,
	margin: 0,
	padding: '40px 20px 32px',
	WebkitFontSmoothing: 'antialiased'
};

const envelope: React.CSSProperties = {
	maxWidth: '560px',
	margin: '0 auto',
	backgroundColor: palette.surface,
	border: `1px solid ${palette.rule}`,
	borderRadius: '20px',
	overflow: 'hidden',
	boxShadow:
		'0 1px 0 rgba(255,255,255,0.6) inset, 0 16px 40px -20px rgba(10,10,10,0.14), 0 4px 12px -8px rgba(10,10,10,0.08)'
};

const brandRow: React.CSSProperties = {
	padding: '20px 32px 0'
};

const brandName: React.CSSProperties = {
	fontFamily: fonts.sans,
	fontSize: '15px',
	fontWeight: 600,
	letterSpacing: '-0.01em',
	color: palette.ink
};

const brandDate: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: '10.5px',
	letterSpacing: '0.18em',
	textTransform: 'uppercase',
	color: palette.inkFaint
};

const hero: React.CSSProperties = {
	padding: '24px 32px 24px'
};

const eyebrowPill: React.CSSProperties = {
	display: 'inline-block',
	padding: '5px 11px',
	border: `1px solid ${palette.rule}`,
	borderRadius: '999px',
	backgroundColor: palette.bg
};

const eyebrowDot: React.CSSProperties = {
	display: 'inline-block',
	width: '5px',
	height: '5px',
	borderRadius: '50%',
	backgroundColor: palette.accent,
	verticalAlign: 'middle'
};

const eyebrowText: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: '10px',
	fontWeight: 500,
	letterSpacing: '0.1em',
	textTransform: 'uppercase',
	color: palette.inkMuted
};

const heroHeading: React.CSSProperties = {
	fontFamily: fonts.sans,
	fontSize: '38px',
	fontWeight: 600,
	color: palette.ink,
	letterSpacing: '-0.028em',
	lineHeight: 1.05,
	margin: '0 0 14px'
};

const heroSub: React.CSSProperties = {
	fontFamily: fonts.sans,
	fontSize: '15px',
	color: palette.inkMuted,
	lineHeight: 1.65,
	margin: 0,
	maxWidth: '460px'
};

const bodyWrap: React.CSSProperties = {
	padding: '8px 32px 8px'
};

const signoffWrap: React.CSSProperties = {
	padding: '16px 32px 8px'
};

const signoffDivider: React.CSSProperties = {
	height: 0,
	borderTop: `1px solid ${palette.ruleSoft}`,
	margin: '0 0 18px'
};

const signoffLine: React.CSSProperties = {
	fontFamily: fonts.sans,
	fontSize: '15px',
	fontWeight: 500,
	color: palette.ink,
	margin: '0 0 8px',
	letterSpacing: '-0.005em'
};

const postscriptLine: React.CSSProperties = {
	fontFamily: fonts.sans,
	fontSize: '13.5px',
	color: palette.inkMuted,
	lineHeight: 1.55,
	margin: 0
};

const postscriptLabel: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: '10.5px',
	fontWeight: 600,
	letterSpacing: '0.14em',
	textTransform: 'uppercase',
	color: palette.inkFaint
};

const fineprintWrap: React.CSSProperties = {
	padding: '16px 32px 28px'
};

const fineprint: React.CSSProperties = {
	fontFamily: fonts.sans,
	fontSize: '11.5px',
	color: palette.inkFaint,
	lineHeight: 1.55,
	margin: 0
};

const metaBar: React.CSSProperties = {
	maxWidth: '560px',
	margin: '20px auto 0',
	width: '100%'
};

const metaText: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: '10px',
	letterSpacing: '0.18em',
	textTransform: 'uppercase',
	color: palette.inkFaint
};

const ctaTd: React.CSSProperties = {
	backgroundColor: palette.accent,
	borderRadius: '999px'
};

const ctaLink: React.CSSProperties = {
	display: 'inline-block',
	backgroundColor: palette.accent,
	border: `1px solid ${palette.accent}`,
	borderRadius: '999px',
	color: palette.white,
	fontFamily: fonts.sans,
	fontSize: '14px',
	fontWeight: 600,
	letterSpacing: '0.005em',
	padding: '12px 24px',
	textDecoration: 'none'
};

const sectionLabel: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: '10.5px',
	fontWeight: 600,
	letterSpacing: '0.14em',
	textTransform: 'uppercase',
	color: palette.inkSubtle,
	margin: 0
};

const sectionMeta: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: '10.5px',
	fontWeight: 500,
	letterSpacing: '0.12em',
	textTransform: 'uppercase',
	color: palette.inkFaint,
	margin: 0
};

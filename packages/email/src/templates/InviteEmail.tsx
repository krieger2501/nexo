import * as React from 'react';
import { AppCards, type AppInfo } from '../AppCards.js';
import { CtaButton, EmailShell, SectionLabel } from '../EmailShell.js';
import { palette, fonts } from '../theme.js';

interface InviteEmailProps {
	landingUrl: string;
	apps?: AppInfo[];
}

export default function InviteEmail({ landingUrl, apps = [] }: InviteEmailProps) {
	const hasApps = apps.length > 0;
	const previewText = hasApps
		? `You're in. ${apps.length === 1 ? 'One app is' : `${apps.length} apps are`} ready when you are.`
		: "You're in — pick a sign-in below to get started.";

	return (
		<EmailShell
			previewText={previewText}
			eyebrow="invitation"
			heading={
				<>
					You're
					<br />
					on the list.
				</>
			}
			sub={
				hasApps
					? "A small suite of apps I built for the people I actually want to share things with. Sign in once, and what's below is yours to use."
					: "A small suite of apps I built for the people I actually want to share things with. Sign in once below — I'll flip the switches on individual apps shortly."
			}
			postscript="If anything looks off or you can't get in, just text me. — K"
			footerNote="You're getting this because someone (probably me) added your email to Nexo. No account is created until you actually sign in."
		>
			{hasApps ? (
				<>
					<SectionLabel
						left="What's inside"
						right={`${String(apps.length).padStart(2, '0')} ${apps.length === 1 ? 'app' : 'apps'}`}
					/>
					<AppCards apps={apps} />
				</>
			) : (
				<>
					<SectionLabel left="What happens next" />
					<table cellPadding="0" cellSpacing="0" className="card" style={emptyCard}>
						<tbody>
							<tr>
								<td style={emptyInner}>
									<p className="ink-muted sans" style={emptyText}>
										Once you sign in, I'll grant you access to specific apps. You'll get another
										email the moment something is ready for you.
									</p>
								</td>
							</tr>
						</tbody>
					</table>
				</>
			)}

			<CtaButton href={landingUrl} label="Open Nexo" />
		</EmailShell>
	);
}

export const subject = "You're on the list — Nexo";

InviteEmail.PreviewProps = {
	landingUrl: 'https://krieger2501.de',
	apps: [
		{ id: 'finance', label: 'Finance' },
		{ id: 'flaschen', label: 'Flaschen' },
		{ id: 'calorie', label: 'Calorie' }
	]
} satisfies InviteEmailProps;

/* ── Local styles ─────────────────────────────────────────────────────── */

const emptyCard: React.CSSProperties = {
	width: '100%',
	backgroundColor: palette.surface,
	border: `1px solid ${palette.rule}`,
	borderRadius: '14px',
	margin: '0 0 20px'
};

const emptyInner: React.CSSProperties = {
	padding: '20px 22px'
};

const emptyText: React.CSSProperties = {
	fontFamily: fonts.sans,
	fontSize: '14px',
	color: palette.inkMuted,
	lineHeight: 1.6,
	margin: 0
};

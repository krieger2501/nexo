import * as React from 'react';
import { AppCards, type AppInfo } from '../AppCards.js';
import { CtaButton, EmailShell, SectionLabel } from '../EmailShell.js';

interface AccessGrantedEmailProps {
	name: string;
	apps: AppInfo[];
	landingUrl: string;
}

export default function AccessGrantedEmail({ name, apps, landingUrl }: AccessGrantedEmailProps) {
	const firstName = (name.split(' ')[0] || name).trim();
	const count = apps.length;
	const previewText =
		count === 1
			? `${apps[0]?.label ?? 'A new app'} is ready for you on Nexo.`
			: `${count} new apps are ready for you on Nexo.`;

	return (
		<EmailShell
			previewText={previewText}
			eyebrow="access granted"
			heading={
				<>
					For you,
					<br />
					{firstName}.
				</>
			}
			sub={
				count === 1
					? "A new app's been opened up on your account. Sign in and it's there — no setup."
					: `${count} new apps have been opened up on your account. Sign in and they're all there — no setup.`
			}
			postscript={
				count === 1
					? 'Take it for a spin and let me know what feels off. — K'
					: 'Take them for a spin and let me know what feels off. — K'
			}
			footerNote="An admin granted you this access on Nexo. If you weren't expecting it, reach out to whoever set you up."
		>
			<SectionLabel
				left="Newly unlocked"
				right={`${String(count).padStart(2, '0')} ${count === 1 ? 'app' : 'apps'}`}
			/>
			<AppCards apps={apps} />
			<CtaButton href={landingUrl} label="Launch Nexo" />
		</EmailShell>
	);
}

export function subject(apps: AppInfo[]): string {
	if (apps.length === 1) return `${apps[0].label} is ready for you on Nexo`;
	return `${apps.length} new apps are ready for you on Nexo`;
}

AccessGrantedEmail.PreviewProps = {
	name: 'Kevin Rieger',
	landingUrl: 'https://krieger2501.de',
	apps: [
		{ id: 'finance', label: 'Finance' },
		{ id: 'flaschen', label: 'Flaschen' },
		{ id: 'calorie', label: 'Calorie' },
		{ id: 'pomodoro', label: 'Pomodoro' }
	]
} satisfies AccessGrantedEmailProps;

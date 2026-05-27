import AccessGrantedEmail from './AccessGrantedEmail.js';

export default function AccessGrantedSingle() {
	return AccessGrantedEmail({
		name: 'Kevin',
		landingUrl: 'https://krieger2501.de',
		apps: [{ id: 'finance', label: 'Finance' }]
	});
}

AccessGrantedSingle.PreviewProps = {};

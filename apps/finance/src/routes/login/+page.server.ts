import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Already signed in — skip the login page
	if (locals.user) redirect(303, '/');

	return { error: url.searchParams.get('error') };
};

import { redirect } from '@sveltejs/kit';
import { withUser, profiles } from '@nexo/db';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const userId = locals.user!.id;

	const [profileRow] = await withUser(userId, (tx) =>
		tx.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)
	);

	const needsOnboarding = !profileRow?.onboardingCompletedAt;
	const onOnboardingPage = url.pathname.startsWith('/onboarding');

	// Gate every page on onboarding completion. /onboarding itself is allowed through.
	if (needsOnboarding && !onOnboardingPage) {
		redirect(303, '/onboarding');
	}

	// If onboarding is complete and the user revisits /onboarding (re-run), let them through.

	return {
		user: locals.user,
		correlationId: locals.correlationId,
		needsOnboarding
	};
};

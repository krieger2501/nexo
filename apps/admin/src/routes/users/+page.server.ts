import { db, allowedEmails, users, userAppAccess } from '@nexo/db';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { KNOWN_APPS } from '$lib/apps';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const [emailList, userList, accessList] = await Promise.all([
		db.select().from(allowedEmails),
		db.select().from(users),
		db.select().from(userAppAccess)
	]);

	const emailSet = new Set(emailList.map((e) => e.email));
	const accessMap = new Map<string, string[]>();
	for (const row of accessList) {
		const apps = accessMap.get(row.userId) ?? [];
		apps.push(row.app);
		accessMap.set(row.userId, apps);
	}

	// Merge: signed-in users who are on the whitelist, plus invited-only entries
	const knownUserEmails = new Set(userList.map((u) => u.email));

	const entries = [
		// Signed-in users (may or may not be on whitelist)
		...userList.map((u) => ({
			type: 'user' as const,
			id: u.id,
			email: u.email,
			name: u.name,
			image: u.image,
			createdAt: u.createdAt.toISOString(),
			allowed: emailSet.has(u.email),
			apps: accessMap.get(u.id) ?? []
		})),
		// Invited-only emails (never signed in)
		...emailList
			.filter((e) => !knownUserEmails.has(e.email))
			.map((e) => ({
				type: 'invited' as const,
				id: null,
				email: e.email,
				name: null,
				image: null,
				createdAt: e.addedAt.toISOString(),
				allowed: true,
				apps: [] as string[]
			}))
	];

	return { entries, knownApps: KNOWN_APPS };
};

export const actions: Actions = {
	addEmail: async ({ request }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { addError: 'Invalid email address.' });
		}
		try {
			await db.insert(allowedEmails).values({ email }).onConflictDoNothing();
		} catch {
			return fail(500, { addError: 'Failed to add email.' });
		}
		return { addSuccess: true };
	},

	removeEmail: async ({ request }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		if (!email) return fail(400, { error: 'Missing email.' });
		await db.delete(allowedEmails).where(eq(allowedEmails.email, email));
		return { success: true };
	},

	grantAccess: async ({ request }) => {
		const data = await request.formData();
		const userId = data.get('userId') as string;
		const app = data.get('app') as string;
		if (!userId || !app) return fail(400, { error: 'Missing params.' });
		await db.insert(userAppAccess).values({ userId, app }).onConflictDoNothing();
		return { success: true };
	},

	revokeAccess: async ({ request }) => {
		const data = await request.formData();
		const userId = data.get('userId') as string;
		const app = data.get('app') as string;
		if (!userId || !app) return fail(400, { error: 'Missing params.' });
		await db
			.delete(userAppAccess)
			.where(and(eq(userAppAccess.userId, userId), eq(userAppAccess.app, app)));
		return { success: true };
	}
};

import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const response = await auth.api.signOut({ headers: request.headers, asResponse: true });

	// Forward the Set-Cookie header that clears the session cookie
	const loginUrl = `${auth.options.baseURL}/login`;
	return new Response(null, {
		status: 303,
		headers: {
			Location: loginUrl,
			...(response.headers.get('set-cookie')
				? { 'set-cookie': response.headers.get('set-cookie')! }
				: {})
		}
	});
};

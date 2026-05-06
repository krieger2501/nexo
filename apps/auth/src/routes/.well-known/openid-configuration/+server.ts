import { oauthProviderOpenIdConfigMetadata } from '@better-auth/oauth-provider';
import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = oauthProviderOpenIdConfigMetadata(auth);

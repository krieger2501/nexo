import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider';
import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = oauthProviderAuthServerMetadata(auth);

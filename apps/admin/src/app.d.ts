import type { User } from 'better-auth';

declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {
			user: User | null;
		}
		interface PageData {
			user?: User | null;
		}
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface Platform {}
	}
}

export {};

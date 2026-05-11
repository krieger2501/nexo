export const KNOWN_APPS = ['finance'] as const;
export type KnownApp = (typeof KNOWN_APPS)[number];

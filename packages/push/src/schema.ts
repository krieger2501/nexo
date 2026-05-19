// Re-export the push subscription schema from @nexo/db (where the table lives
// physically so drizzle-kit picks it up). Importing from @nexo/push/schema
// keeps app code consistent with the rest of the @nexo/push API surface.
export { pushSchema, pushSubscription, type PushSubscriptionRow } from '@nexo/db';

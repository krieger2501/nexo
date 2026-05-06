# Access Management

## How access works

Two levels of control:

1. **Can this person sign in at all?** → `auth.allowed_emails` table
2. **Which apps can they use?** → `auth.user_app_access` table (planned — currently all signed-in users can access all apps)

---

## Whitelisting a new user

Insert their email before they try to sign in:

```bash
# Local
docker exec -it nexo-postgres-1 psql -U nexo -d nexo \
  -c "INSERT INTO auth.allowed_emails (email) VALUES ('friend@example.com');"

# Production
docker compose exec postgres psql -U nexo -d nexo \
  -c "INSERT INTO auth.allowed_emails (email) VALUES ('friend@example.com');"
```

They can sign in with **any OAuth provider** (Google, GitHub, or Discord) as long as the account's email matches. The provider doesn't matter — only the email does.

---

## Removing access

```sql
-- Revoke sign-in ability
DELETE FROM auth.allowed_emails WHERE email = 'friend@example.com';

-- Their existing sessions will expire naturally.
-- To revoke immediately, also delete their sessions:
DELETE FROM auth.sessions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'friend@example.com');
```

---

## Viewing current users

```sql
SELECT
  u.email,
  u.name,
  u.created_at,
  ae.email IS NOT NULL AS is_allowed
FROM auth.users u
LEFT JOIN auth.allowed_emails ae ON ae.email = u.email
ORDER BY u.created_at;
```

---

## Per-app access (future)

The `auth.user_app_access` table exists for per-app gating. Currently unused — all whitelisted users can access all apps. When you're ready to restrict access:

```sql
-- Grant user access to finance only
INSERT INTO auth.user_app_access (user_id, app)
SELECT id, 'finance' FROM auth.users WHERE email = 'friend@example.com';
```

To enforce this, the auth server's OIDC hook needs to check `user_app_access` for the requested `client_id` before issuing a token. This is stubbed out in `apps/auth/src/lib/server/auth.ts` and can be wired up when needed.

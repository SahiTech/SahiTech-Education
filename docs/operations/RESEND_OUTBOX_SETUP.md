# MDI transactional email outbox

The application approval flow and the public newsletter confirmation flow write queued email events in the same database transaction as their workflow records. Web requests do not send provider email directly.

## Required secrets

Configure these in the **development Supabase project** before deploying the worker:

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key, stored only as an Edge Function secret
- `RESEND_API_KEY` — Resend API key, stored only as an Edge Function secret
- `RESEND_FROM_EMAIL` — sender address on a domain verified in Resend
- `PUBLIC_SITE_URL` — canonical HTTPS site origin; production currently uses `https://sahitech.dpdns.org`
- `CRON_SECRET` — long random secret used to authenticate scheduled invocations
- `MDI_EMAIL_TOKEN_HMAC_SECRET` — at least 32 random bytes, shared with the Vercel server-only environment variable of the same name

The web application needs `MDI_EMAIL_TOKEN_HMAC_SECRET` in Vercel because it creates nonce/hash pairs for newsletter confirmation links. The Edge Function uses the exact same value to derive the raw link token during delivery. Set it as a server-only environment variable; never prefix it with `NEXT_PUBLIC_`.

Never add secrets to Git, browser environment variables, or chat messages. Never put the Supabase service-role key or Resend API key in Vercel client-exposed variables.

## Newsletter database setup

Before deploying the web application with newsletter endpoints, apply the forward-only migration:

`packages/database/migrations/00045_newsletter_double_opt_in.sql`

The migration creates a private-by-default subscriber table with RLS enabled and no direct client table grants. Public clients can only submit, confirm or unsubscribe through narrowly scoped RPCs. Subscriber records remain `pending` until the email confirmation link is used.

The migration stores confirmation/unsubscribe hashes and random nonces only. It does not store raw bearer tokens. The outbox payload for the confirmation email contains only the confirmation nonce and expected hash.

## Deploy

From a trusted development environment with the Supabase CLI linked to the development project:

```bash
supabase functions deploy process-email-outbox --no-verify-jwt
supabase secrets set RESEND_API_KEY=... RESEND_FROM_EMAIL=... PUBLIC_SITE_URL=https://sahitech.dpdns.org CRON_SECRET=... MDI_EMAIL_TOKEN_HMAC_SECRET=...
```

The platform injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into Edge Functions in the normal Supabase runtime. If your deployment environment requires them explicitly, set them as secrets.

## Supported outbox event types

- `madrasa_invitation`
- `madrasa_application_received`
- `newsletter_confirmation` (localized Bengali, English and Arabic double-opt-in message)

The worker claims up to 10 jobs using row locks, sends supported messages through Resend, and marks the corresponding delivery record only after Resend accepts the message. Failed jobs are retried with backoff, up to five attempts.

The newsletter subscription form does not claim an email was sent from the request handler. Subscription remains pending until the confirmation route successfully consumes the confirmation token.

## Invoke

Call the function every minute or five minutes from a trusted scheduler using:

```http
POST /functions/v1/process-email-outbox
Authorization: Bearer <CRON_SECRET>
```

## Operational safeguards and limitations

- Do not deploy or schedule this worker until a sender domain is verified in Resend and the required secrets are configured.
- The shared HMAC secret must be identical in Vercel and the Supabase Edge Function environment.
- Do not expose `CRON_SECRET`, `RESEND_API_KEY`, `MDI_EMAIL_TOKEN_HMAC_SECRET`, or the service-role key to the browser.
- The invitation URL and newsletter confirmation URL must use the configured `PUBLIC_SITE_URL` origin.
- Raw invitation, upload, newsletter confirmation and unsubscribe bearer tokens must not be persisted in database tables or outbox payloads.
- Newsletter signups collect consent and support double opt-in. A campaign/blog-digest management interface and routine marketing campaign sender are separate work and must be implemented and tested before advertising newsletter campaigns as operational.
- Monitor failed outbox rows and investigate provider rejections before manually retrying.

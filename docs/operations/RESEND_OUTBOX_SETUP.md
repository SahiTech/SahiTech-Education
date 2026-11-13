# MDI transactional email outbox

The application approval flow writes an invitation and a queued outbox event in one database transaction. It does not send email from the web request.

## Required secrets

Configure these in the **development Supabase project** before deploying the worker:

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key, stored only as an Edge Function secret
- `RESEND_API_KEY` — Resend API key, stored only as an Edge Function secret
- `RESEND_FROM_EMAIL` — sender address on a domain verified in Resend
- `PUBLIC_SITE_URL` — canonical HTTPS site origin, e.g. `https://sahitech-edu.com`
- `CRON_SECRET` — long random secret used to authenticate scheduled invocations

Never add any of these values to Git, browser environment variables, or chat messages.

## Deploy

From a trusted development environment with the Supabase CLI linked to the development project:

```bash
supabase functions deploy process-email-outbox --no-verify-jwt
supabase secrets set RESEND_API_KEY=... RESEND_FROM_EMAIL=... PUBLIC_SITE_URL=... CRON_SECRET=...
```

The platform injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into Edge Functions in the normal Supabase runtime. If your deployment environment requires them explicitly, set them as secrets.

## Invoke

Call the function every minute or five minutes from a trusted scheduler using:

```http
POST /functions/v1/process-email-outbox
Authorization: Bearer <CRON_SECRET>
```

The worker claims up to 10 jobs using row locks, sends supported invitation messages through Resend, and marks the invitation as `sent` only after Resend accepts the message. Failed jobs are retried with backoff, up to five attempts.

## Operational safeguards

- Do not deploy or schedule this worker until a sender domain is verified in Resend.
- Do not expose `CRON_SECRET`, `RESEND_API_KEY`, or the service-role key to the browser.
- The invitation URL must use the configured `PUBLIC_SITE_URL` origin.
- The invitation token is stored hashed in `platform_invitations`; the raw token exists only in the service-role-only outbox payload until delivery.
- Monitor failed outbox rows and investigate provider rejections before manually retrying.

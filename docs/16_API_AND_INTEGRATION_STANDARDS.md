# 16. API & Integration Standards

**Principle:** provider-independent boundaries, server-side secrets and evidence-based integration status

## 1. Integration inventory and status discipline

The repository includes Supabase Auth/Database/Storage integration and an email outbox/Edge Function source path. The presence of a package, adapter interface, migration or setup guide does not prove that an external provider is deployed or operational.

SMS gateways, payment gateways, biometric devices, prayer-time sources and international payment providers described in earlier specifications are future integration options unless a current source path and end-to-end test are identified.

## 2. Adapter boundaries

External provider SDKs must be isolated behind typed server-side interfaces. Domain logic should depend on stable application contracts, not vendor packages. An adapter should define:
- normalized request/response types;
- timeouts and bounded retries;
- idempotency behavior;
- provider error normalization;
- safe structured logging and redaction;
- health/readiness indicators where meaningful;
- sandbox/mock behavior that cannot be mistaken for live delivery.

Do not implement an adapter that pretends a provider accepted a message or payment when the response is unknown.

## 3. Payment integration requirements (target)

Payment operations are high impact. A future adapter must:
- create a payment intent against an existing invoice and currency/amount;
- validate signed provider callbacks on the server;
- verify status directly with the provider where supported;
- enforce unique provider transaction references;
- enforce idempotency and replay protection;
- reconcile amount, currency, tenant, invoice and settlement state;
- post balanced journal entries within one transaction;
- keep pending, failed, reversed and settled states distinct.

Never trust a browser redirect as proof of payment. No payment gateway is claimed live based on interface/specification alone.

## 4. Email outbox

The repository contains a Supabase Edge Function source at `supabase/functions/process-email-outbox` and a setup guide at `docs/operations/RESEND_OUTBOX_SETUP.md`.

Operational readiness requires a verified sender domain, secure function secrets, deployed function, scheduler, retry/lease behavior and an end-to-end received message. Do not expose Resend keys, service-role credentials, cron secrets or HMAC secrets to the browser.

A queued outbox row means “requested for delivery”, not “delivered”. Update invitation/application state only after the provider accepts the message and persist provider outcome safely.

## 5. Webhooks and public APIs

- Verify signatures before processing untrusted payloads.
- Use constant-time comparison for secrets/signatures where applicable.
- Enforce freshness/replay windows and durable idempotency keys.
- Validate JSON shape, sizes, content type and ownership.
- Rate limit public endpoints and bound database work.
- Return minimal information; never disclose whether a protected application/student record exists.
- Keep callback URLs and origins on explicit allowlists.

## 6. Storage

- Private documents must remain in private buckets with short-lived signed access.
- Validate uploader capability, tenant association, MIME type, extension and byte size server-side.
- Never rely on browser-provided folder names or metadata as authorization.
- Public asset buckets may contain only safe public media; avoid active formats such as SVG where upload policy cannot safely sanitize them.
- Retention, deletion and object-path migration must be documented before rollout.

## 7. Configuration and provider onboarding

All provider credentials remain in the relevant server secret store. Environment variable names and required values must be documented without including values. New paid providers require explicit approval.

A provider may be marked operational only after:
1. credentials/configuration are confirmed without disclosing secret values;
2. sandbox or test transaction succeeds;
3. idempotency, retries and failure behavior are tested;
4. security and privacy review is complete;
5. production approval is recorded where applicable.

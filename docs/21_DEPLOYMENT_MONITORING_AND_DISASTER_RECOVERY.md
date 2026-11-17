# 21. Deployment, Monitoring & Disaster Recovery

**Purpose:** reproducible environments, observable operations and rehearsed recovery  
**Status:** operational targets require independent environment evidence

## 1. Environment separation

Maintain distinct local, development, preview/staging and production configuration. Do not use production credentials or data for routine development tests.

Environment variables must be classified:
- Public browser variables: only values intentionally safe to expose.
- Server-only variables: privileged Supabase, email, payment, signing, cron and HMAC secrets.
- Build-time configuration: non-secret deployment settings.

Never prefix a secret with `NEXT_PUBLIC_`. Store production secrets only in the approved hosting/provider secret manager.

## 2. Deployment topology

The repository uses a Next.js web application, Supabase PostgreSQL/Auth/Storage integration and Supabase Edge Function source. Hosting, DNS/CDN/WAF, backup plans and scheduled workers must be documented from the actual connected environment. A diagram or configuration file does not prove a service is live.

Deploy to Preview first. Confirm exact commit SHA, environment target, auth callbacks, custom domain routing and runtime logs. Production release requires explicit approval.

## 3. Observability

For application and worker operations, capture structured, privacy-safe events:
- request/correlation ID;
- environment and deployment SHA;
- route/action and normalized result;
- latency and dependency outcome;
- actor/tenant identifiers only where permitted and minimized.

Redact passwords, bearer tokens, cookies, invitation/upload capabilities, NID data, student document contents and payment credentials. Avoid logging full payloads.

Define readiness checks so a transient database or provider issue is represented accurately. Do not show “healthy” based solely on a page rendering.

## 4. External workers and scheduled tasks

Each worker needs:
- documented deployment target and exact version;
- server-only credentials and rotation process;
- authenticated invocation method;
- bounded job claims, lease recovery and retries;
- idempotency and dead-letter handling;
- tenant isolation and append-only operational audit;
- alerting and runbook for prolonged failures.

A worker source file existing in Git does not mean it has been deployed or scheduled.

## 5. Backup and recovery

Define Recovery Point Objective (RPO) and Recovery Time Objective (RTO) only after the Supabase plan/settings and backup architecture are confirmed. Verify:
- database backup/PITR availability and retention;
- Storage/object backup strategy;
- encryption and access boundaries;
- restoration dependencies and credentials;
- restore to an isolated environment;
- referential integrity and application smoke tests;
- documented rollback/forward-fix procedure.

A backup is not proven usable until a restore drill succeeds. Do not claim hourly recovery or a four-hour RTO without evidence.

## 6. Incident response

Maintain severity definitions, escalation contacts, evidence preservation, credential rotation, tenant/user communication and post-incident review. Never copy private student records or secrets into public issue trackers.

## 7. Release checklist

- [ ] Exact commit and Preview deployment verified.
- [ ] Environment variables checked without exposing values.
- [ ] Auth callbacks, cookies, locale and domain behavior tested.
- [ ] Migrations reconciled, rehearsed and approved.
- [ ] Security, performance and runtime logs reviewed.
- [ ] External worker and email/payment integrations end-to-end tested.
- [ ] Backup restore and rollback path rehearsed.
- [ ] Production deployment/database change explicitly approved.

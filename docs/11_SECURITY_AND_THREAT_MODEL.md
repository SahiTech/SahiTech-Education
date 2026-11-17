# 11. Security Architecture & Threat Model

**Security approach:** defense in depth, zero-trust authorization and evidence-based release gates  
**Scope:** application code, PostgreSQL, Supabase Auth/Storage, privileged functions, external integrations and operations

## 1. Threat model

| Threat | Example | Required controls |
|---|---|---|
| Spoofing | Forged or replayed session/invitation | Trusted Auth validation, secure cookie handling, expiring single-use tokens |
| Tampering | Client changes grades, tenant IDs or payment values | Server-side authorization, runtime validation, DB constraints and transactional workflows |
| Repudiation | Unauthorized result or journal change | Append-only audit path, actor identity, timestamps and reason capture |
| Information disclosure | Cross-tenant student or financial record exposure | RLS, least-privilege grants, tenant-aware FKs, Storage rules and minimal public responses |
| Denial of service | Public application form or lookup abuse | Rate limits, bot controls, bounded query cost, quotas and monitoring |
| Elevation of privilege | Tenant member promotes themselves or invokes owner function | Separate platform identity, server checks, narrow RPC grants and role transition guards |
| Secret disclosure | Password, token or service key in logs/RPC response | Secret manager, hashes, redaction, no browser exposure and rotation |

## 2. Database security requirements

Security review must inspect:
- RLS enabled/FORCE RLS state and effective policies;
- table/schema grants, including TRUNCATE, REFERENCES and TRIGGER;
- views and security-invoker behavior;
- SECURITY DEFINER function owner, fixed safe search_path, authorization and EXECUTE grants;
- Storage bucket public/private status and object policies;
- tenant-aware foreign keys and index coverage;
- transaction boundaries for multi-table operations.

RLS alone is not a security guarantee. Multiple permissive policies combine with OR; inspect the complete effective policy set.

Migration `00044_private_rls_security_definer_helpers.sql` contains private-schema SECURITY DEFINER helper implementations and public SECURITY INVOKER wrappers. Any new privileged function requires a function-by-function review; blanket grant/revoke changes are unsafe.

## 3. Public endpoint and token controls

- Keep public application and verification responses minimal.
- Do not expose private application rows, guardian data, raw tokens or internal document identifiers.
- Use cryptographically random tokens with sufficient entropy; store token hashes, enforce expiry/single use/revocation and apply rate limits.
- Validate Storage upload capabilities and content type, byte size and ownership server-side.
- Verify email links and webhooks against a trusted canonical origin and cryptographic signature.
- Treat honeypots and per-email quotas as supplemental friction, not a complete anti-abuse solution.

## 4. Critical source-review blocker — migration 00045

The reviewed source file `packages/database/migrations/00045_owner_direct_setup_madrasa_admin.sql` contains:
- a static fallback password path for new admin account creation;
- a function response field that can return the password used in certain account-creation/update cases.

This is an unacceptable credential-handling pattern for production. Do not disclose or reproduce the literal fallback credential. Do not run this function to provision real accounts until a separately reviewed remediation removes static credentials and stops returning secrets, migrates any affected test accounts safely, and verifies secure first-login/reset behavior. Add regression tests proving no password or secret appears in RPC output, logs or audit payloads.

This finding is based on checked-in source inspection, not a live exploit test. No code/migration was changed in the documentation-only branch.

## 5. High-risk workflows requiring database-level guarantees

The historical security audit identified multi-step workflows whose transactional behavior and error handling need careful revalidation:
- institution provisioning and tenant activation;
- public/student admission and enrollment;
- document review and invitation issuance;
- finance payment collection and journal posting;
- hostel allocation and other multi-record workflows.

A TypeScript validator does not make a multi-step database workflow atomic. Use transaction-capable RPCs or equivalent database transaction boundaries, idempotency and error propagation. Posted accounting records must be immutable at the database boundary if the product promises immutability.

## 6. Privacy and logging

- Minimize collection and retention of student/guardian personal data.
- Do not log passwords, tokens, payment credentials, NID data, private documents or full request bodies.
- Use access-controlled audit records and safe retention rules.
- Public Sanad verification must disclose only fields approved for public verification.
- AI/data processors require explicit data-handling review and human confirmation for consequential operations.

## 7. Release checklist

- [ ] All critical/high findings have an owner and verified remediation.
- [ ] RLS, grants, policies, functions and Storage are tested against a reconciled schema.
- [ ] Cross-tenant read/write/FK probes pass with two or more test tenants.
- [ ] Public endpoint abuse controls are tested.
- [ ] No static or exposed credentials exist in source, migrations, RPC results or logs.
- [ ] Sensitive workflows are transactional and idempotent.
- [ ] Backup/restore and incident-response procedures are exercised.
- [ ] Auth/MFA, email, browser E2E and production configuration are independently verified.
- [ ] Explicit production approval is recorded.

See [the dated November security audit](SECURITY_AUDIT_2026-11.md) for review observations and limitations.

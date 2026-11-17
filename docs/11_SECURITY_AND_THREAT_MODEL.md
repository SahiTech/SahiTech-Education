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

## 4. Manual Admin credential-path remediation — 2026-11-17

The original source review found a static fallback credential, direct writes to Supabase Auth tables, and a password-bearing RPC response in the legacy owner_direct_setup_madrasa_admin routine. The replacement is now implemented on the security feature branch; this does not imply Production is already running it.

### Source and Development evidence

- Migrations 00045–00050 and the server-side provisioning, credential-handoff, first-login and recovery routes implement email-independent manual Admin activation without SQL writes to auth.users/auth.identities or plaintext credential storage.
- Emergency migration 00051 was applied to Production and Development on 2026-11-17; read-only Production catalog verification confirmed owner_direct_setup_madrasa_admin(UUID,TEXT,BOOLEAN) is absent.
- A further Production-only legacy path, public.owner_direct_provision_tenant(UUID,UUID), was found to have no catalog dependents and no current caller in the branch's Owner server actions. Migration 00052 drops it and adds database AAL2 guards to owner_activate_tenant, owner_issue_invitation, owner_review_application_document and owner_update_application_status.
- Migration 00052 was applied to the isolated Development project. The read-only regression script packages/database/tests/owner_rpc_aal2_security_smoke.sql then passed, confirming the legacy RPC is absent and all eleven reviewed privileged Owner RPCs carry a database AAL2 predicate.
- GitHub Actions CI Run #332 passed for the prior manual-admin branch head. The current branch adds migration 00052 and its regression test; its latest CI run must be checked before merge.
- The corrected AAL2 migration 00049 accepts functions already hardened by earlier migration order and validates each required function, avoiding a zero-replacement failure.

### Production status and remaining verification

- Production still has the baseline through 00044 plus emergency 00051; 00045–00050 and 00052 remain pending. Production still contains the legacy owner_direct_provision_tenant function and the older lifecycle RPCs have not yet received the new database-level AAL2 guards.
- Production application is not yet on the secure Owner UI. The legacy direct-provision button remains unavailable because its insecure RPC was retired; do not restore it.
- Real Supabase Auth E2E for create, .invalid login alias acceptance, first-login password change and Owner recovery remains NOT VERIFIED.
- Vercel Production still lacks the server-only Supabase Auth Admin key and MDI_EMAIL_TOKEN_HMAC_SECRET. Never put either in Git, browser variables or chat.
- Supabase Security Advisor reports additional SECURITY DEFINER/grant and leaked-password-protection warnings. Review each function's purpose and authorization individually; do not blanket-revoke.
- Production backup/restore readiness, final migration plan and live smoke test remain release gates.

This is a combined source/development verification record, not a penetration test or Production security certification.

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

# 27. Institutional Support, Audit & Background Job Protocol

**Status:** Security and operations target. Do not assume every mechanism described here is deployed.

## 1. Consent-based institutional support access

Support personnel must not obtain routine unrestricted access to confidential tenant records. Any future support elevation must be:
- explicitly authorized by the institution's designated administrator;
- scoped by tenant, purpose and permitted actions;
- short-lived with a fixed maximum duration;
- revocable immediately;
- visibly indicated throughout the session;
- re-authorized server-side for each protected operation;
- fully audited with actor, authorizer, purpose, scope, start, expiry and termination.

Support access must not permit payments, ledger posting/reversal, role promotion, owner identity management or other high-impact operations unless a separate documented approval model exists.

Do not claim impersonation or consent-based support is implemented merely because this protocol is documented.

## 2. Background job isolation

The repository includes an email outbox worker source. General worker architecture must be assessed per function and deployment. An asynchronous worker must never assume a human `auth.uid()` or operate across all tenant rows by default.

Required controls:
- authenticated, narrowly scoped job invocation;
- validated tenant/job payload;
- trusted transaction-local tenant context or dedicated tenant-scoped service authorization;
- least-privilege database grants;
- idempotent execution and concurrency-safe leases;
- bounded retries and dead-letter visibility;
- no cross-tenant bulk operations;
- redacted structured logs and audit correlation;
- explicit failure/rollback behavior.

A session setting alone is not a security boundary unless RLS policies and worker connection behavior enforce it.

## 3. Audit design

Record high-impact actions with actor/service identity, tenant, action, target entity, timestamp, correlation ID and approved change context. Sensitive payloads should be minimized or redacted.

Append-only behavior must be enforced by database grants and protections, not merely by hiding edit controls. Define retention, access, export and incident investigation procedures.

## 4. Operational acceptance

Before calling support access or a worker operational:
1. verify deployment target and exact version;
2. inspect function grants and database role;
3. test allowed and denied actions;
4. verify tenant isolation;
5. simulate expiry, revocation, retry and failure;
6. confirm audit events are written;
7. document monitoring and runbook ownership.

Production changes require explicit approval.

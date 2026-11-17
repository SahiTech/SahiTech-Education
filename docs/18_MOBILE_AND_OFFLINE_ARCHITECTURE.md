# 18. Mobile & Offline Architecture

**Status:** Target architecture; offline-first attendance is not verified as implemented in the inspected source tree.

## 1. Mobile-first principles

The application must work on modest Android devices, narrow viewports and intermittent connections. Mobile responsiveness is not the same as offline functionality. Do not claim offline support solely because a page is responsive or browser cache exists.

## 2. Offline capability tiers

Design workflows with explicit connectivity levels:

| Workflow | Intended offline posture | Guardrail |
|---|---|---|
| Attendance | Potential offline draft and later sync | Server confirms final accepted record |
| Exam marks | Local draft only, cloud submission | Publication/ratification is online and authorized |
| Student directory | Limited cached read-only data | Minimize sensitive data; protect device cache |
| Fee collection | Online-only unless a reviewed offline settlement model exists | Never issue final receipt without authoritative sequence |
| Sanad issuance/revocation | Online-only | Server-side authorization and verification required |
| Owner review/activation | Online-only | Mandatory MFA, current state and audit |

These are target behaviors, not claims of current implementation.

## 3. Safe offline sync design

A future sync engine must include:
- explicit queue schema and versioning;
- client-generated idempotency UUIDs;
- server-side tenant and actor revalidation on every sync;
- timestamp and clock-skew handling;
- per-record conflict policy;
- retry/backoff and dead-letter visibility;
- acknowledgement before local queue deletion;
- local encryption or equivalent protection appropriate to data sensitivity;
- logout/account-switch cache cleanup;
- maximum offline retention and remote revocation behavior.

Never use a generic last-write-wins strategy for grades, finances, ownership or sensitive identity changes. Conflict resolution must follow domain rules.

## 4. PWA and service worker requirements

Before adding a service worker:
- define exactly which routes/assets can be cached;
- never cache privileged HTML or sensitive API responses in a shared/public cache;
- version and invalidate caches;
- handle user sign-out and tenant switching;
- protect against stale authorization state;
- test update and rollback behavior.

No complete service worker, IndexedDB write queue or automatic attendance sync is claimed operational in this documentation snapshot.

## 5. Testing

- airplane-mode and flaky-network tests;
- duplicated/reordered sync delivery;
- expired session and membership revocation while offline;
- two devices editing the same record;
- tenant/account switch with cached data;
- low-storage/private-browsing behavior;
- server acknowledgement loss and retry;
- keyboard/touch and 320–430px viewport checks.

A local “saved” indicator must distinguish saved on device, queued for sync, accepted by server and rejected/conflicted.

# 27. Institutional Support, Audit & Background Job Protocol

**Program**: Madrasa Digitalization Initiative (MDI)  
**Parent Brand**: SahiTech  
**Division**: SahiTech Education  
**Standards**: Zero-Trust Tenant Isolation, Audited Support Access, Safe Background Processing  

---

## 1. Controlled Support Access & Impersonation Protocol

In a multi-tenant education SaaS, platform support engineers must never have unrestrained, back-door access to an institution's confidential records, student files, or financial balances.

```mermaid
sequenceDiagram
    autonumber
    actor MadrasaAdmin as Muhtamim / Madrasa Admin
    actor SupportTech as MDI Support Engineer
    participant System as Support Access Gateway
    participant Audit as Immutable Audit Log

    MadrasaAdmin->>System: Grants Support Access (Selects Scope: "Read-Only" or "Assisted Setup", Duration: "4 Hours")
    System->>Audit: Records Support Access Token Grant (Authorizer ID, Expiry, Tenant ID)
    SupportTech->>System: Requests Session Elevation for Tenant ID
    System->>System: Validates Active Non-Expired Grant & MFA on Support Account
    System->>Audit: Logs "Support Session Initiated" with Support Engineer ID & IP
    Note over SupportTech,System: Support Tech assists institution with prominent red visual banner in UI
    SupportTech->>System: Performs troubleshooting actions
    System->>Audit: Every individual action logged with actor="support_impersonation"
    alt Manual Revocation or Timeout Expiration
        MadrasaAdmin->>System: Revokes Access OR Timer reaches 4 hours
        System->>System: Invalidate Support Session Token immediately
        System->>Audit: Logs "Support Session Terminated"
    end
```

### Mandatory Support Access Rules:
1. **Consent Required**: Platform Super Admins **cannot** arbitrarily view tenant data without an active, explicit consent grant from the institution's primary administrator.
2. **Time-Bound**: Grants auto-expire after a maximum of 4 to 24 hours. No standing access permitted.
3. **Prominent UI Banner**: When an impersonated or support session is active, a persistent, un-dismissible high-visibility banner displays: *"Support Assistance Session Active — Authorized by Muhtamim. Actions are audited."*
4. **Zero Financial Mutation via Support**: Support access tokens are strictly barred from executing payments, transferring ledger funds, or changing bank account details.

---

## 2. Background Job Security & Tenant Isolation Protocol

In interactive HTTP requests, `auth.uid()` drives PostgreSQL Row Level Security (RLS) via `public.get_auth_tenant_ids()`. However, automated background workers (e.g. generating monthly fee invoices, sending batch SMS notifications, compiling daily attendance analytics) execute asynchronously without an active user session.

```mermaid
flowchart TD
    Queue[Background Job Queue: pgmq / Postgres Outbox Table] --> Worker[Worker Process]
    Worker --> ExtractPayload[Extract Job Payload: target_tenant_id, job_type]
    Worker --> BeginTx[BEGIN Transaction]
    BeginTx --> SetSession[SET LOCAL app.current_tenant_id = target_tenant_id]
    SetSession --> ExecLogic[Execute Job Logic with RLS Active]
    ExecLogic --> PolicyCheck{RLS Engine: Does row.tenant_id == app.current_tenant_id?}
    PolicyCheck -->|Yes| ProcessRow[Process & Update Job Status]
    PolicyCheck -->|No| RejectRow[Kernel Violation: Rollback & Alert]
    ProcessRow --> CommitTx[COMMIT Transaction]
```

### Technical Enforcement:
1. **Tenant-Scoped Transactions**: Background workers **must never** execute unbounded cross-tenant bulk updates in a single query.
2. **Transaction Local Context**: The worker sets a transaction-local session variable:
   ```sql
   SET LOCAL app.current_tenant_id = 'c4b8...';
   ```
3. **Worker RLS Policy**: Tables include worker-specific RLS policies that verify `app.current_tenant_id`:
   ```sql
   CREATE POLICY "Worker tenant policy"
   ON public.fee_invoices FOR ALL
   USING (
     (current_setting('app.current_tenant_id', true))::uuid = tenant_id
   );
   ```
4. **Failure Isolation**: An error or deadlock in Tenant A's background job rolls back Tenant A's transaction without impacting Tenant B's queued jobs.

---

## 3. Tamper-Evident Audit Logging Protocol

All high-impact institutional operations are recorded in an append-only, tamper-evident audit ledger:

```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role VARCHAR(50) NOT NULL,
    is_support_impersonation BOOLEAN NOT NULL DEFAULT false,
    action VARCHAR(100) NOT NULL, -- e.g., 'student.admission_approved', 'invoice.reversed'
    entity_name VARCHAR(100) NOT NULL, -- e.g., 'students', 'fee_invoices'
    entity_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### Immutable Security Constraints:
- `audit_logs` has **zero** `UPDATE` or `DELETE` permissions granted to any role.
- Triggers record the exact `previous_state` and `new_state` for exam result updates, fee reversals, and role promotions.
- Any attempt to truncate or delete audit records raises an uncatchable database alert.


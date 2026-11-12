# 11. Security Architecture & Threat Model

**Program**: Madrasa Digitalization Initiative (MDI)  
**Parent Brand**: SahiTech  
**Division**: SahiTech Education  

---

## 1. Threat Modeling (STRIDE Analysis)

MDI protects sensitive educational, demographic, and financial data using defense-in-depth principles:

| STRIDE Threat Category | Potential Attack Vector | MDI Architectural Defense |
| :--- | :--- | :--- |
| **Spoofing Identity** | Attacker crafts forged session cookies or fake JWTs. | Cryptographically signed HMAC-SHA256 JWTs with ephemeral expiration; session cookies marked `HttpOnly`, `Secure`, `SameSite=Lax`. |
| **Tampering with Data** | Student tampers with mark values or fee invoices via API requests. | All mutations executed exclusively via validated Next.js Server Actions with server-side Zod input schemas and database check constraints. |
| **Repudiation** | An accountant deletes a payment record or a dean alters an exam grade without a trail. | Immutable database audit trigger (`audit_log`) logs actor ID, IP address, timestamp, old state, and new state. Core financial and exam results are append-only. |
| **Information Disclosure** | Cross-tenant data leakage: Tenant A accesses Tenant B's student roster. | PostgreSQL 17 Row Level Security (RLS) filters rows inside the database engine. Zero client trust; queries return empty sets if tenant mismatch occurs. |
| **Denial of Service (DoS)** | Script kiddies flood admission forms or search endpoints. | Cloudflare WAF rate-limiting, IP reputation checks, bot mitigation, and PostgreSQL connection pooling via Supabase pooler. |
| **Elevation of Privilege** | Teacher attempts to grant themselves `madrasa_admin` role. | Roles are fetched server-side from `public.tenant_users` on each protected request. User role claims cannot be modified from client-side state. |

---

## 2. Row Level Security (RLS) Policy Architecture

All 15 public tables enforce Row Level Security:

```mermaid
flowchart TD
    Query[Incoming SQL Query] --> CheckAuth{Is auth.uid() present?}
    CheckAuth -->|No| PublicDenied[DENY: 0 rows returned]
    CheckAuth -->|Yes| ExecHelper[Execute public.get_auth_tenant_ids()]
    ExecHelper --> InspectMembership[Inspect tenant_users where user_id = auth.uid()]
    InspectMembership --> EvaluatePolicy{Does row.tenant_id match?}
    EvaluatePolicy -->|Yes| AllowRow[Return Authorized Row]
    EvaluatePolicy -->|No| SuppressRow[Filter Out / Return Empty]
```

### Write-Policy Security Standard:
- By default, unauthenticated or non-member mutations result in **DENY**.
- Mutation policies (`INSERT`, `UPDATE`, `DELETE`) are strictly separated from `SELECT` policies and require specific role memberships:
```sql
CREATE POLICY "Admins and deans can update classes"
ON public.classes FOR UPDATE
USING (
  tenant_id IN (
    SELECT tu.tenant_id FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid() 
      AND tu.role IN ('madrasa_admin', 'academic_dean')
      AND tu.is_active = true
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tu.tenant_id FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid() 
      AND tu.role IN ('madrasa_admin', 'academic_dean')
      AND tu.is_active = true
  )
);
```

---

## 3. Secret Management & Compliance
- **Zero Secrets in Source**: No API keys, service-role keys, or database passwords committed to Git. Scanned with automated pre-commit filters.
- **Environment Isolation**: `.env.local` strictly excluded via `.gitignore`.
- **Database Functions**: All security definer functions specify `SET search_path = public` to prevent malicious schema injection.


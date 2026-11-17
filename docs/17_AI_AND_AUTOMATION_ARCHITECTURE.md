# 17. AI & Automation Architecture — Privacy-First Target

**Status:** Target architecture. No user-facing AI/OCR workflow is confirmed as production-operational by the reviewed repository baseline.

## 1. Guiding principle: assistant, not authority

AI may help staff prepare, organize or summarize information. It must not independently:
- create or approve admissions;
- publish exam results or alter marks;
- issue, revoke or amend a Sanad;
- create, post, reverse or approve financial entries;
- change tenant, owner, staff or access privileges;
- determine religious eligibility or make a binding Shariah ruling.

A qualified human must review extracted or generated content before it becomes a record or communication.

## 2. Privacy and data governance

Before introducing a model or OCR provider:
- classify data and define a lawful purpose;
- minimize prompt/context to the fields required;
- identify provider retention/training policies contractually;
- use approved regional/data-transfer arrangements where required;
- redact direct identifiers where feasible;
- define retention/deletion and audit rules;
- restrict access to model outputs;
- do not include secrets or private student data in telemetry.

“Zero retention” must not be claimed unless provider contract/settings and runtime behavior prove it.

## 3. Potential workflows (planned)

### 3.1 Document field extraction
A future OCR workflow may extract candidate fields from a scanned admission form. Store the result as a draft with field-level confidence, source reference and review state. Never silently commit extraction output to a student record.

### 3.2 Notice drafting
A future language assistant may produce Bangla, English and Arabic notice drafts from staff-approved facts. A staff member must verify dates, amounts, religious references, audience and translation before publication.

### 3.3 Operational anomaly indicators
A future analytics workflow may surface patterns such as unusual attendance changes for human review. It must avoid stigmatizing labels, inferential diagnoses or automatic punitive actions. Explain the evidence behind each alert and permit review/correction.

## 4. Technical controls

- Use an explicit provider adapter and server-side secrets.
- Apply schema validation to inputs and structured outputs.
- Treat uploaded files, prompts and retrieved documents as untrusted data.
- Protect against prompt injection and data exfiltration.
- Enforce per-tenant authorization before retrieval and after generation.
- Track model/version, prompt template version, actor, source records and human disposition without storing unnecessary sensitive content.
- Add cost/rate limits and a provider kill switch.
- Keep critical data mutation in established application workflows.

## 5. Acceptance criteria before launch

- Privacy/security assessment approved.
- Tenant boundary and source-document access tested.
- Output validation and prompt-injection tests included.
- Human review and rejection/edit paths work.
- No autonomous critical mutation is possible.
- Retention, consent, cost and provider failure states are documented.
- Feature marked as operational only after real end-to-end verification.

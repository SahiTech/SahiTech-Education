# 26. Financial & Double-Entry Accounting Specification

**Status:** Target financial domain specification. Database-enforced production behavior must be verified independently.

## 1. Core accounting principles

MDI is designed around tenant-scoped accounting records and double-entry journal posting. Every posted journal entry should balance: total debits equal total credits. The accounting period, currency precision, rounding, receivable recognition, payment allocation and refund policies must be explicit.

## 2. Ledger lifecycle

Required lifecycle:
1. Create a draft voucher from an authorized business event.
2. Validate tenant, accounts, source document, currency and totals.
3. Validate restricted-fund rules and supporting documents.
4. Post debit and credit lines atomically in one database transaction.
5. Prevent direct edit/delete of posted entries.
6. Correct mistakes through a linked reversal and a new corrected entry.
7. Record actor, approver, timestamp, source and audit correlation.

Do not call a payment successful when the receipt or corresponding journal posting failed.

## 3. Tenant Chart of Accounts

Each tenant needs a configurable chart of accounts with account types and parent-child relationships. Avoid hard-coded assumptions that all madrasas use the same accounting categories, fiscal periods or cash/payment channels.

Amounts must use an explicit currency code and exact decimal/minor-unit representation; avoid floating-point arithmetic for money.

## 4. Restricted funds and Shariah review

MDI may model separate categories for general operating funds, Lillah, Zakat/Fitrah, Waqf and institution-specific restricted donations. Their eligibility, collection, custody, disbursement, transfer and administration-cost treatment must be defined by qualified Shariah advisors and the institution's governing policy.

No generic software rule should be presented as a universal fatwa. The exact rules in historical examples must be treated as illustrative policy until formally reviewed. Record the policy version and approving authority.

## 5. Database enforcement requirements

A production-grade implementation must provide:
- balanced posting enforced within a transaction;
- immutable posted journal entries and lines;
- unique tenant-scoped entry and receipt sequences;
- same-tenant account and source-document references;
- concurrency-safe and idempotent payment processing;
- append-only audit records;
- scoped access for accountant, admin, approver and support roles.

An application/domain validator is useful but can be bypassed by another database client or privileged routine. Do not claim a database invariant until a constraint, trigger, restricted RPC or equivalent database control and an integration test demonstrate it.

## 6. Reconciliation and reporting

Reconcile cash, bank, MFS provider settlement, fee invoices, donations, restricted balances and reversal entries. A report must show its as-of date, accounting basis, currency and filters. Keep raw source transactions and audit evidence available to authorized reviewers.

## 7. Production readiness checklist

- [ ] Institution accounting rules approved.
- [ ] Restricted fund rules reviewed by qualified authority.
- [ ] COA and fiscal-period setup versioned.
- [ ] Atomic posting and rollback tests pass.
- [ ] Posted-entry immutability is database enforced.
- [ ] Payment callbacks are signed, idempotent and reconciled.
- [ ] Cross-tenant account references are rejected.
- [ ] Receipt numbering is collision-safe and tenant/period scoped.
- [ ] Audit and permission model reviewed by finance stakeholders.

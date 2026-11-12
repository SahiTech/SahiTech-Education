# 07. Domain Architecture & Bounded Contexts

**Program**: Madrasa Digitalization Initiative (MDI)  
**Parent Brand**: SahiTech  
**Division**: SahiTech Education  

---

## 1. Domain-Driven Design (DDD) Bounded Contexts

```mermaid
graph TD
    subgraph TenancyContext[1. Tenancy Context]
        Tenant[Tenant Aggregate]
        Branch[Branch Entity]
        Subscription[Subscription Value Object]
    end

    subgraph IdentityContext[2. Identity & Access Context]
        User[User Entity]
        Profile[Profile Entity]
        TenantUser[Tenant Membership Entity]
        Role[Role & Permissions Value Object]
    end

    subgraph AcademicContext[3. Academic Context]
        Year[Academic Year Aggregate]
        Dept[Department Entity]
        ClassM[Class / Marhala Entity]
        Section[Section / Jamaat Entity]
        Subject[Subject / Kitab Entity]
    end

    subgraph StudentContext[4. Student SIS Context]
        Student[Student Aggregate]
        Enrollment[Enrollment Entity]
        Guardian[Guardian Value Object]
        StudentDoc[Document Entity]
    end

    subgraph EvaluationContext[5. Examination & Sanad Context]
        ExamTerm[Exam Term Aggregate]
        MarkRecord[Mark Record Entity]
        ResultSnapshot[Immutable Result Snapshot]
        SanadCert[Sanad Certificate Entity]
    end

    subgraph FinancialContext[6. Finance & Accounting Context]
        Invoice[Fee Invoice Aggregate]
        Payment[Payment Transaction Entity]
        LedgerEntry[Journal Entry Value Object]
        LillahFund[Restricted Welfare Sub-Ledger]
    end

    TenantContext --> AcademicContext
    TenantContext --> StudentContext
    IdentityContext --> TenantContext
    AcademicContext --> StudentContext
    AcademicContext --> EvaluationContext
    StudentContext --> EvaluationContext
    StudentContext --> FinancialContext
```

---

## 2. Aggregates & Domain Invariants

### 2.1 Academic Aggregate
- **Root**: `AcademicYear`
- **Invariants**:
  - `start_date` must precede `end_date`.
  - Only one `AcademicYear` can be marked as `is_current = true` per tenant at any given time.
  - A `Class` cannot exist without an active `Department`.
  - A `Section` capacity cannot be exceeded during enrollment without explicit administrative override.

### 2.2 Student Aggregate
- **Root**: `Student`
- **Invariants**:
  - `admission_no` must be unique within the tenant.
  - A student cannot have more than one active `Enrollment` in the same `AcademicYear`.
  - `is_residential = true` is a prerequisite for boarding room allocation.
  - `is_lillah_boarder = true` automatically marks the student eligible for subsidized meal funding.

### 2.3 Evaluation & Sanad Aggregate
- **Root**: `ExamTerm`
- **Invariants**:
  - Individual subject marks cannot exceed `total_marks` defined in the subject specification.
  - A `ResultSnapshot` becomes permanently immutable once marked as `ratified = true`.
  - A `Sanad` cannot be issued without an underlying ratified result snapshot.

### 2.4 Financial Aggregate
- **Root**: `FeeInvoice`
- **Invariants**:
  - `paid_amount + discount_amount` cannot exceed `amount`.
  - When `paid_amount == amount - discount_amount`, status transitions to `paid`.
  - Double-entry constraint: Total debits must equal total credits for every posted ledger transaction.


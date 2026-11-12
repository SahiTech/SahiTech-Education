# 18. Mobile & Offline-First Architecture

**Program**: Madrasa Digitalization Initiative (MDI)  
**Parent Brand**: SahiTech  
**Division**: SahiTech Education  

---

## 1. Progressive Web App (PWA) Foundation

Recognizing that classroom teachers in rural brick-and-mortar campuses often encounter weak or zero cellular reception, MDI implements a **Progressive Web App (PWA)** offline architecture:

```mermaid
sequenceDiagram
    actor Ustad as Ustad (In Classroom)
    participant PWA as MDI PWA Client
    participant IDB as IndexedDB Write Queue
    participant Cloud as PostgreSQL Cloud Database

    Note over Ustad,PWA: Offline / Cellular Network Dropped
    Ustad->>PWA: Opens Daily Attendance for Dawra Class
    PWA->>IDB: Fetches cached student roster
    Ustad->>PWA: Marks 3 students absent, clicks "Save"
    PWA->>IDB: Appends attendance payload to offline sync queue
    PWA-->>Ustad: UI Badge: "সংরক্ষিত (অফলাইন মোড)" (Saved Offline)

    Note over Ustad,PWA: Network Reconnected (e.g., in Staff Room)
    PWA->>PWA: Background service worker detects navigator.onLine = true
    PWA->>Cloud: Flushes queue via idempotent batch Server Action
    Cloud-->>PWA: 200 OK (Batch Committed & Audit Logged)
    PWA-->>Ustad: UI Badge updates to "ক্লাউডে সুসংগত" (Synced)
```

---

## 2. Offline-Safe Workflows vs Cloud-Mandatory Workflows

| Operational Domain | Offline Capability | Storage Mechanism | Conflict Resolution Standard |
| :--- | :--- | :--- | :--- |
| **Daily Attendance** | **100% Offline Capable** | Local IndexedDB | Idempotent client-generated batch UUID (`batch_id`). Last write wins for daily date. |
| **Exam Marks Entry Drafts** | **Offline Draft Capable** | Local IndexedDB | Drafts saved locally; formal submission and snapshot calculation require cloud sync. |
| **Student Directory Lookup** | **Read-Only Offline** | Service Worker Cache | Cached active student roster for the assigned class/marhala. |
| **Fee Collection & Cash** | **Cloud-Only (Online Required)**| None (Disabled offline) | Cash receipts create financial liability; strictly forbidden without verified server sequence number. |
| **Sanad & Certificate Issuance**| **Cloud-Only (Online Required)**| None (Disabled offline) | Cryptographic signature requires server-side private key verification. |

---

## 3. Conflict Handling & Idempotency Rules
1. **Client UUIDs**: Every offline-created attendance row assigns a `client_uuid = crypto.randomUUID()`.
2. **Deduplication**: When syncing to PostgreSQL, `ON CONFLICT (tenant_id, student_id, attendance_date) DO UPDATE` ensures no duplicate records are generated if retries occur.


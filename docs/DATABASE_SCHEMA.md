# MDI Database Schema & Security Specification

## 1. Overview
The Madrasa Digitalization Initiative (MDI) database is built on **PostgreSQL 17** via **Supabase**. It leverages strict Row Level Security (RLS) policies, foreign key integrity, and localized text fields.

---

## 2. Core Tables

### 2.1 Multi-Tenancy & Identity
- `tenants`: Primary entity representing an educational institution (Madrasa).
- `branches`: Physical locations/branches belonging to a Madrasa.
- `profiles`: User identity profiles linked 1:1 with Supabase `auth.users`.
- `tenant_users`: Join table representing user membership and assigned roles (`user_role`) per tenant.

### 2.2 Academic Structure
- `academic_years`: Calendar periods supporting both Gregorian and Hijri date tracking.
- `departments`: Divisions within a Madrasa (e.g., Kitab, Hifz, Nurani, Alia Ebtedayee).
- `classes`: Classes/Marhalas (e.g. Dawra-e-Hadith, Mishkat, Dakhil 10).
- `sections`: Physical groupings of students within a class.
- `subjects`: Kitabs / subjects taught within a class, with pass marks and total marks.

### 2.3 Students & Staff
- `students`: Central student profiles with biographical, residential, and lillah boarding indicators.
- `student_enrollments`: Historical and active student enrollments per academic year, class, section, and roll number.
- `teachers`: Educator profiles (Asatiza) with employee IDs, designations, and contact details.

### 2.4 Operations & Finance
- `attendance_records`: Daily/session attendance with status (`present`, `absent`, `late`, `excused`).
- `fee_categories`: Fee classification (Tuition, Admission, Exam, Hostel, Lillah Fund).
- `fee_invoices`: Financial invoices with payment status, discounts, and due dates.

---

## 3. Row Level Security (RLS) Verification
All tables have RLS enabled:
```sql
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
```
Access is governed by the security definer function:
```sql
CREATE OR REPLACE FUNCTION public.get_auth_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT tenant_id 
    FROM public.tenant_users 
    WHERE user_id = auth.uid() 
      AND is_active = true;
$$;
```
Every operational query executes within the tenant boundary of the authenticated user.


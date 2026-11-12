import { UserRole } from '../tenancy/types';
export type Permission = 'manage_tenant_settings' | 'manage_branches' | 'manage_staff' | 'manage_academic_calendar' | 'manage_curriculum' | 'manage_admissions' | 'view_student_records' | 'edit_student_records' | 'record_attendance' | 'input_marks' | 'generate_transcripts' | 'issue_sanad' | 'manage_fees' | 'collect_payments' | 'view_financial_reports' | 'manage_hostel' | 'view_own_attendance' | 'view_own_fees';
export declare const ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
export declare function hasPermission(role: UserRole, permission: Permission): boolean;

export const ROLE_PERMISSIONS = {
    super_admin: [
        'manage_tenant_settings',
        'manage_branches',
        'manage_staff',
        'manage_academic_calendar',
        'manage_curriculum',
        'manage_admissions',
        'view_student_records',
        'edit_student_records',
        'record_attendance',
        'input_marks',
        'generate_transcripts',
        'issue_sanad',
        'manage_fees',
        'collect_payments',
        'view_financial_reports',
        'manage_hostel',
        'view_own_attendance',
        'view_own_fees'
    ],
    madrasa_admin: [
        'manage_tenant_settings',
        'manage_branches',
        'manage_staff',
        'manage_academic_calendar',
        'manage_curriculum',
        'manage_admissions',
        'view_student_records',
        'edit_student_records',
        'record_attendance',
        'input_marks',
        'generate_transcripts',
        'issue_sanad',
        'manage_fees',
        'collect_payments',
        'view_financial_reports',
        'manage_hostel',
        'view_own_attendance',
        'view_own_fees'
    ],
    academic_dean: [
        'manage_academic_calendar',
        'manage_curriculum',
        'manage_admissions',
        'view_student_records',
        'edit_student_records',
        'record_attendance',
        'input_marks',
        'generate_transcripts',
        'issue_sanad'
    ],
    teacher: [
        'view_student_records',
        'record_attendance',
        'input_marks'
    ],
    accountant: [
        'view_student_records',
        'manage_fees',
        'collect_payments',
        'view_financial_reports'
    ],
    hostel_warden: [
        'view_student_records',
        'manage_hostel',
        'record_attendance'
    ],
    student: [
        'view_own_attendance',
        'view_own_fees'
    ],
    parent: [
        'view_own_attendance',
        'view_own_fees'
    ]
};
export function hasPermission(role, permission) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
}

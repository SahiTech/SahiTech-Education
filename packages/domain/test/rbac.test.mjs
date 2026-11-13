import { test } from 'node:test';
import assert from 'node:assert';
import { hasPermission } from '../src/index.js';

test('Deprecated super_admin is not a tenant role and has no permissions', () => {
  assert.strictEqual(hasPermission('super_admin', 'manage_tenant_settings'), false);
  assert.strictEqual(hasPermission('super_admin', 'manage_branches'), false);
  assert.strictEqual(hasPermission('super_admin', 'manage_staff'), false);
  assert.strictEqual(hasPermission('super_admin', 'manage_admissions'), false);
  assert.strictEqual(hasPermission('super_admin', 'collect_payments'), false);
});

test('Madrasa admin (Muhtamim) has executive institutional permissions', () => {
  assert.strictEqual(hasPermission('madrasa_admin', 'manage_tenant_settings'), true);
  assert.strictEqual(hasPermission('madrasa_admin', 'manage_branches'), true);
  assert.strictEqual(hasPermission('madrasa_admin', 'manage_staff'), true);
  assert.strictEqual(hasPermission('madrasa_admin', 'manage_admissions'), true);
  assert.strictEqual(hasPermission('madrasa_admin', 'manage_fees'), true);
  assert.strictEqual(hasPermission('madrasa_admin', 'collect_payments'), true);
});

test('Academic dean (Nazim-e-Taleemat) has curriculum permissions but no tenant admin', () => {
  assert.strictEqual(hasPermission('academic_dean', 'manage_curriculum'), true);
  assert.strictEqual(hasPermission('academic_dean', 'manage_academic_calendar'), true);
  assert.strictEqual(hasPermission('academic_dean', 'manage_admissions'), true);
  assert.strictEqual(hasPermission('academic_dean', 'issue_sanad'), true);

  // Must not have tenant setting or fee management permissions
  assert.strictEqual(hasPermission('academic_dean', 'manage_tenant_settings'), false);
  assert.strictEqual(hasPermission('academic_dean', 'manage_branches'), false);
  assert.strictEqual(hasPermission('academic_dean', 'manage_fees'), false);
  assert.strictEqual(hasPermission('academic_dean', 'collect_payments'), false);
});

test('Teacher (Ustad) has attendance and marks permissions only', () => {
  assert.strictEqual(hasPermission('teacher', 'record_attendance'), true);
  assert.strictEqual(hasPermission('teacher', 'input_marks'), true);
  assert.strictEqual(hasPermission('teacher', 'view_student_records'), true);

  // Must not manage admissions, curriculum, or finances
  assert.strictEqual(hasPermission('teacher', 'manage_admissions'), false);
  assert.strictEqual(hasPermission('teacher', 'manage_curriculum'), false);
  assert.strictEqual(hasPermission('teacher', 'manage_fees'), false);
  assert.strictEqual(hasPermission('teacher', 'manage_tenant_settings'), false);
});

test('Student and parent are strictly read-only for own records', () => {
  assert.strictEqual(hasPermission('student', 'view_own_attendance'), true);
  assert.strictEqual(hasPermission('student', 'view_own_fees'), true);
  assert.strictEqual(hasPermission('student', 'record_attendance'), false);
  assert.strictEqual(hasPermission('student', 'edit_student_records'), false);
  assert.strictEqual(hasPermission('student', 'manage_admissions'), false);

  assert.strictEqual(hasPermission('parent', 'view_own_attendance'), true);
  assert.strictEqual(hasPermission('parent', 'view_own_fees'), true);
  assert.strictEqual(hasPermission('parent', 'record_attendance'), false);
  assert.strictEqual(hasPermission('parent', 'manage_tenant_settings'), false);
});

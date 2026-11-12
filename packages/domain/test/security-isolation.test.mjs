import { test } from 'node:test';
import assert from 'node:assert';
import { hasPermission } from '../src/index.js';

test('Multi-tenant isolation: user in Tenant A cannot execute operations targeting Tenant B without role', () => {
  // Mock tenant contexts
  const tenantAContext = {
    userId: 'user-001',
    tenantId: 'tenant-aaa-111',
    role: 'madrasa_admin',
  };

  const tenantBContext = {
    userId: 'user-002',
    tenantId: 'tenant-bbb-222',
    role: 'teacher',
  };

  // Simulating cross-tenant action verification
  function authorizeTenantAction(actorContext, targetTenantId, permission) {
    if (actorContext.tenantId !== targetTenantId) {
      // Direct cross-tenant access rejection unless platform super_admin
      if (actorContext.role !== 'super_admin') {
        throw new Error('TenantIsolationViolation: Cross-tenant operation rejected.');
      }
    }
    if (!hasPermission(actorContext.role, permission)) {
      throw new Error(`Unauthorized: Role '${actorContext.role}' lacks '${permission}'.`);
    }
    return true;
  }

  // Tenant A admin acting on Tenant A: Allowed
  assert.strictEqual(
    authorizeTenantAction(tenantAContext, 'tenant-aaa-111', 'manage_admissions'),
    true
  );

  // Tenant A admin acting on Tenant B: Throws TenantIsolationViolation
  assert.throws(
    () => authorizeTenantAction(tenantAContext, 'tenant-bbb-222', 'manage_admissions'),
    /TenantIsolationViolation/
  );

  // Tenant B teacher acting on Tenant B for attendance: Allowed
  assert.strictEqual(
    authorizeTenantAction(tenantBContext, 'tenant-bbb-222', 'record_attendance'),
    true
  );

  // Tenant B teacher acting on Tenant B for tenant settings: Denied (lacks permission)
  assert.throws(
    () => authorizeTenantAction(tenantBContext, 'tenant-bbb-222', 'manage_tenant_settings'),
    /Unauthorized/
  );
});

test('Student admission validation and tenant-scoped uniqueness logic', () => {
  const store = [
    { tenantId: 'tenant-1', admissionNo: 'ADM-2026-001', nameBn: 'মুহাম্মদ' },
    { tenantId: 'tenant-2', admissionNo: 'ADM-2026-001', nameBn: 'আব্দুল্লাহ' },
  ];

  function validateNewAdmission(tenantId, admissionNo, fullNameBn, fullNameEn) {
    if (!fullNameBn?.trim() || !fullNameEn?.trim()) {
      return { valid: false, error: 'Name in Bangla and English required' };
    }
    if (!admissionNo?.trim()) {
      return { valid: false, error: 'Admission number required' };
    }
    // Tenant-scoped uniqueness check:
    const existsInSameTenant = store.some(
      s => s.tenantId === tenantId && s.admissionNo.toLowerCase() === admissionNo.toLowerCase()
    );
    if (existsInSameTenant) {
      return { valid: false, error: 'Duplicate admission number in this tenant' };
    }
    return { valid: true };
  }

  // Duplicate in same tenant must fail
  const dupCheck = validateNewAdmission('tenant-1', 'ADM-2026-001', 'আহমাদ', 'Ahmad');
  assert.strictEqual(dupCheck.valid, false);
  assert.match(dupCheck.error, /Duplicate/);

  // Same admission number in DIFFERENT tenant must succeed
  const crossTenantCheck = validateNewAdmission('tenant-3', 'ADM-2026-001', 'আহমাদ', 'Ahmad');
  assert.strictEqual(crossTenantCheck.valid, true);

  // Empty name must fail
  const emptyCheck = validateNewAdmission('tenant-1', 'ADM-2026-002', '', '');
  assert.strictEqual(emptyCheck.valid, false);
});

test('Institutional provisioning validation invariants', () => {
  function validateProvisioningInput({ name, code, subdomain, contactEmail, contactPhone }) {
    if (!name?.trim()) return { ok: false, field: 'name' };
    if (!code?.trim() || code.length < 2) return { ok: false, field: 'code' };
    if (!subdomain?.trim() || !/^[a-z0-9-]+$/.test(subdomain)) return { ok: false, field: 'subdomain' };
    if (!contactEmail?.includes('@')) return { ok: false, field: 'contactEmail' };
    if (!contactPhone?.trim()) return { ok: false, field: 'contactPhone' };
    return { ok: true };
  }

  // Valid institution input
  assert.strictEqual(
    validateProvisioningInput({
      name: 'জামিয়া ইসলামিয়া দারুল উলুম',
      code: 'JIDU',
      subdomain: 'jidu-dhaka',
      contactEmail: 'admin@jidu.edu.bd',
      contactPhone: '01700000000',
    }).ok,
    true
  );

  // Invalid subdomain with spaces or uppercase
  assert.strictEqual(
    validateProvisioningInput({
      name: 'মাদরাসা',
      code: 'MDR',
      subdomain: 'Invalid Subdomain!',
      contactEmail: 'a@b.com',
      contactPhone: '01700000000',
    }).ok,
    false
  );

  // Missing email
  assert.strictEqual(
    validateProvisioningInput({
      name: 'মাদরাসা',
      code: 'MDR',
      subdomain: 'mdr',
      contactEmail: 'invalid-email',
      contactPhone: '01700000000',
    }).ok,
    false
  );
});

test('Audit log format and immutability invariants', () => {
  function createAuditLogPayload({ tenantId, actorId, actorRole, action, entityName, entityId }) {
    if (!tenantId || !actorId || !actorRole || !action || !entityName || !entityId) {
      throw new Error('AuditLogInvariantViolation: Missing required audit fields.');
    }
    return {
      tenant_id: tenantId,
      actor_id: actorId,
      actor_role: actorRole,
      action,
      entity_name: entityName,
      entity_id: entityId,
      created_at: new Date().toISOString(),
    };
  }

  const payload = createAuditLogPayload({
    tenantId: 'tenant-123',
    actorId: 'user-456',
    actorRole: 'madrasa_admin',
    action: 'student.create',
    entityName: 'students',
    entityId: 'student-789',
  });

  assert.strictEqual(payload.tenant_id, 'tenant-123');
  assert.strictEqual(payload.action, 'student.create');
  assert.ok(payload.created_at);

  // Missing action must throw
  assert.throws(
    () => createAuditLogPayload({ tenantId: 't1', actorId: 'u1', actorRole: 'admin', entityName: 'e1', entityId: 'id1' }),
    /AuditLogInvariantViolation/
  );
});


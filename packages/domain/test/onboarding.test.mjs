import { test } from 'node:test';
import assert from 'node:assert';
import { QAWMI_MARHALAS, ALIA_CLASSES } from '../src/index.js';

test('Onboarding Step 1: Institutional profile and configurable policy validation', () => {
  function validateProfileStep(data) {
    if (!data.name?.trim()) return { ok: false, error: 'Name required' };
    if (!data.code?.trim() || data.code.length < 2) return { ok: false, error: 'Code min 2 chars' };
    if (!['qawmi', 'alia', 'hybrid'].includes(data.curriculumType)) {
      return { ok: false, error: 'Invalid curriculum type' };
    }
    if (!data.contactEmail?.includes('@')) return { ok: false, error: 'Invalid email' };
    if (!data.contactPhone?.trim()) return { ok: false, error: 'Phone required' };
    if (data.establishedYear && (data.establishedYear < 1800 || data.establishedYear > new Date().getFullYear())) {
      return { ok: false, error: 'Invalid established year' };
    }
    return { ok: true };
  }

  // Valid Qawmi profile
  assert.strictEqual(
    validateProfileStep({
      name: 'জামিয়া ইসলামিয়া দারুল উলুম',
      code: 'JIDU',
      curriculumType: 'qawmi',
      contactEmail: 'info@jidu.edu.bd',
      contactPhone: '01711000000',
      establishedYear: 1985,
    }).ok,
    true
  );

  // Invalid curriculum type
  assert.strictEqual(
    validateProfileStep({
      name: 'মাদরাসা',
      code: 'MDR',
      curriculumType: 'invalid_type',
      contactEmail: 'a@b.com',
      contactPhone: '01700000000',
    }).ok,
    false
  );

  // Future year
  assert.strictEqual(
    validateProfileStep({
      name: 'মাদরাসা',
      code: 'MDR',
      curriculumType: 'qawmi',
      contactEmail: 'a@b.com',
      contactPhone: '01700000000',
      establishedYear: 2099,
    }).ok,
    false
  );
});

test('Onboarding Step 2: Branch and campus infrastructure validation', () => {
  function validateBranches(mainBranch, additionalBranches = []) {
    if (!mainBranch?.name?.trim() || !mainBranch?.code?.trim()) {
      return { ok: false, error: 'Main branch name and code required' };
    }

    const codes = new Set([mainBranch.code.toUpperCase()]);
    for (const b of additionalBranches) {
      const codeUpper = b.code.toUpperCase();
      if (codes.has(codeUpper)) {
        return { ok: false, error: `Duplicate branch code: ${codeUpper}` };
      }
      codes.add(codeUpper);
    }
    return { ok: true };
  }

  // Valid single main branch
  assert.strictEqual(
    validateBranches({ name: 'মেইন ক্যাম্পাস', code: 'MAIN' }).ok,
    true
  );

  // Valid main + secondary campus
  assert.strictEqual(
    validateBranches(
      { name: 'মেইন ক্যাম্পাস', code: 'MAIN' },
      [{ name: 'মহিলা শাখা', code: 'FEMALE' }]
    ).ok,
    true
  );

  // Duplicate branch codes rejected
  assert.strictEqual(
    validateBranches(
      { name: 'মেইন ক্যাম্পাস', code: 'MAIN' },
      [{ name: 'শাখা ২', code: 'MAIN' }]
    ).ok,
    false
  );
});

test('Onboarding Step 3: Academic year date and calendar invariants', () => {
  function validateAcademicYear({ nameBn, startDate, endDate, hijriYear }) {
    if (!nameBn?.trim()) return { ok: false, error: 'Name required' };
    if (!startDate || !endDate) return { ok: false, error: 'Dates required' };
    if (new Date(startDate) >= new Date(endDate)) {
      return { ok: false, error: 'Start date must be before end date' };
    }
    if (!hijriYear?.trim()) return { ok: false, error: 'Hijri year required' };
    return { ok: true };
  }

  assert.strictEqual(
    validateAcademicYear({
      nameBn: '১৪৪৭-১৪৪৮ হিজরি শিক্ষাবর্ষ',
      startDate: '2026-06-01',
      endDate: '2027-05-31',
      hijriYear: '১৪৪৭-১৪৪৮',
    }).ok,
    true
  );

  // Inverted dates must fail
  assert.strictEqual(
    validateAcademicYear({
      nameBn: 'ভুল সেশন',
      startDate: '2027-06-01',
      endDate: '2026-05-31',
      hijriYear: '১৪৪৭',
    }).ok,
    false
  );
});

test('Onboarding Step 4: Curriculum department and canonical class generation mapping', () => {
  // Qawmi curriculum class generation mapping
  function generateClassesForCurriculum(curriculumType) {
    if (curriculumType === 'qawmi') {
      return QAWMI_MARHALAS.map(m => ({
        code: m.code,
        nameBn: m.name.bn,
        levelOrder: m.levelOrder,
      }));
    } else if (curriculumType === 'alia') {
      return ALIA_CLASSES.map(c => ({
        code: c.code,
        nameBn: c.name.bn,
        levelOrder: c.numericGradeEquivalent,
      }));
    }
    return [];
  }

  const qawmiClasses = generateClassesForCurriculum('qawmi');
  assert.ok(qawmiClasses.length >= 9, 'Qawmi must generate 9+ Marhalas');
  assert.strictEqual(qawmiClasses[0].code, 'NUR');
  assert.ok(qawmiClasses.some(c => c.code === 'TAK'));

  const aliaClasses = generateClassesForCurriculum('alia');
  assert.ok(aliaClasses.length >= 12, 'Alia must generate 12+ classes');
  assert.strictEqual(aliaClasses[0].code, 'EBT-1');
});

test('Onboarding Step 6: Completeness and verification gate', () => {
  function verifyOnboardingCompleteness({ tenant, branchCount, academicYearCount, departmentCount }) {
    if (!tenant?.name || !tenant?.code) return { verified: false, reason: 'Profile incomplete' };
    if (branchCount < 1) return { verified: false, reason: 'Missing branch' };
    if (academicYearCount < 1) return { verified: false, reason: 'Missing academic year' };
    if (departmentCount < 1) return { verified: false, reason: 'Missing department' };
    return { verified: true };
  }

  // Complete institution passes
  assert.strictEqual(
    verifyOnboardingCompleteness({
      tenant: { name: 'দারুল উলুম', code: 'DU' },
      branchCount: 1,
      academicYearCount: 1,
      departmentCount: 3,
    }).verified,
    true
  );

  // Missing departments fails verification
  assert.strictEqual(
    verifyOnboardingCompleteness({
      tenant: { name: 'দারুল উলুম', code: 'DU' },
      branchCount: 1,
      academicYearCount: 1,
      departmentCount: 0,
    }).verified,
    false
  );
});

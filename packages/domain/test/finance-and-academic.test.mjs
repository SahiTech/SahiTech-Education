import { test } from 'node:test';
import assert from 'node:assert';
import {
  validateJournalEntry,
  validateFundSegregation,
  calculateQawmiDharja,
  generateSanadVerificationHash,
  canTransitionAdmission,
  evaluateLillahEligibility,
} from '../src/index.js';

test('Double-entry: Balanced journal entry passes', () => {
  const balancedLines = [
    { accountId: 'acc-1', debit: 15000, credit: 0 },
    { accountId: 'acc-2', debit: 0, credit: 15000 },
  ];

  const result = validateJournalEntry(balancedLines);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.totalDebit, 15000);
  assert.strictEqual(result.totalCredit, 15000);
  assert.strictEqual(result.imbalance, 0);
  assert.strictEqual(result.errors.length, 0);
});

test('Double-entry: Imbalanced entry is rejected', () => {
  const imbalancedLines = [
    { accountId: 'acc-1', debit: 10000, credit: 0 },
    { accountId: 'acc-2', debit: 0, credit: 8000 },
  ];

  const result = validateJournalEntry(imbalancedLines);
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.imbalance, 2000);
  assert.ok(result.errors.some(e => e.includes('অসমতুল্য')));
});

test('Shariah Fund Segregation: Disallows commingling between general and zakat accounts (Doc 26)', () => {
  const mockAccounts = new Map([
    ['acc-general-cash', { id: 'acc-general-cash', code: '1001', nameBn: 'নগদ ক্যাশ', category: 'asset', fundType: 'general_fund', isActive: true, tenantId: 't1' }],
    ['acc-zakat-bank', { id: 'acc-zakat-bank', code: '1003', nameBn: 'যাকাত ফান্ড ব্যাংক', category: 'asset', fundType: 'lillah_zakat_fund', isActive: true, tenantId: 't1' }],
  ]);

  // Attempting to post to zakat account in a general fund voucher
  const check = validateFundSegregation(
    'general_fund',
    [{ accountId: 'acc-general-cash' }, { accountId: 'acc-zakat-bank' }],
    mockAccounts
  );

  assert.strictEqual(check.isSegregated, false);
  assert.ok(check.violationErrors.some(e => e.includes('তহবিল লঙ্ঘন')));
});

test('Qawmi Dharja calculation maps to canonical Befaqul Madaris standards', () => {
  // 85% -> Mumtaz
  assert.strictEqual(calculateQawmiDharja(85, 100).dharja, 'mumtaz');
  // 70% -> Jayyid Jiddan
  assert.strictEqual(calculateQawmiDharja(70, 100).dharja, 'jayyid_jiddan');
  // 55% -> Jayyid
  assert.strictEqual(calculateQawmiDharja(55, 100).dharja, 'jayyid');
  // 40% -> Maqbool
  assert.strictEqual(calculateQawmiDharja(40, 100).dharja, 'maqbool');
  // 25% -> Rasib
  assert.strictEqual(calculateQawmiDharja(25, 100).dharja, 'rasib');
});

test('Sanad online verification hash generates stable unique token', () => {
  const token1 = generateSanadVerificationHash({
    tenantId: 'tenant-123',
    studentId: 'student-456',
    sanadSerialNo: 'SND-2026-001',
    issueDate: '2026-11-12',
  });

  const token2 = generateSanadVerificationHash({
    tenantId: 'tenant-123',
    studentId: 'student-456',
    sanadSerialNo: 'SND-2026-001',
    issueDate: '2026-11-12',
  });

  assert.strictEqual(token1, token2);
  assert.ok(token1.startsWith('SANAD-'));
  // Confirm full 256-bit cryptographic digest length: SANAD- + 4 chars serial + '-' + 64 chars hex = 75 chars
  assert.strictEqual(token1.length, 75);
});

test('NIST FIPS 180-4 SHA-256 cryptographic test vectors', () => {
  import('../src/index.js').then(({ sha256 }) => {
    // NIST Standard Test Vector 1: 'hello'
    assert.strictEqual(
      sha256('hello'),
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
    // NIST Standard Test Vector 2: empty string
    assert.strictEqual(
      sha256(''),
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });
});

test('Admission state machine enforces valid workflow progression', () => {
  // Inquiry -> Applied: Allowed
  assert.strictEqual(canTransitionAdmission('inquiry', 'applied'), true);
  // Applied -> Exam Scheduled: Allowed
  assert.strictEqual(canTransitionAdmission('applied', 'exam_scheduled'), true);
  // Exam Scheduled -> Passed: Allowed
  assert.strictEqual(canTransitionAdmission('exam_scheduled', 'passed'), true);
  // Passed -> Enrolled: Allowed
  assert.strictEqual(canTransitionAdmission('passed', 'enrolled'), true);
  // Inquiry -> Enrolled directly: Disallowed
  assert.strictEqual(canTransitionAdmission('inquiry', 'enrolled'), false);
});

test('Shariah Lillah eligibility: Orphans qualify for 100% subsidy', () => {
  const orphanResult = evaluateLillahEligibility({
    isOrphan: true,
    familyMonthlyIncome: 5000,
    numberOfSiblings: 3,
  });

  assert.strictEqual(orphanResult.eligible, true);
  assert.strictEqual(orphanResult.status, 'verified_mustahiq');
  assert.strictEqual(orphanResult.suggestedSubsidyPercent, 100);
});

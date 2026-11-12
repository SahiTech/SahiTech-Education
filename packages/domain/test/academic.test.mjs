import { test } from 'node:test';
import assert from 'node:assert';
import { calculateAliaGpa, QAWMI_MARHALAS, ALIA_CLASSES } from '../src/index.js';

test('Alia GPA calculation matches Bangladesh Madrasa Education Board scale', () => {
  // 80-100: A+ (5.0)
  assert.strictEqual(calculateAliaGpa(100).grade, 'A+');
  assert.strictEqual(calculateAliaGpa(85).gradePoint, 5.0);

  // 70-79: A (4.0)
  assert.strictEqual(calculateAliaGpa(75).grade, 'A');
  assert.strictEqual(calculateAliaGpa(70).gradePoint, 4.0);

  // 60-69: A- (3.5)
  assert.strictEqual(calculateAliaGpa(63).grade, 'A-');
  assert.strictEqual(calculateAliaGpa(60).gradePoint, 3.5);

  // 50-59: B (3.0)
  assert.strictEqual(calculateAliaGpa(55).grade, 'B');
  assert.strictEqual(calculateAliaGpa(50).gradePoint, 3.0);

  // 40-49: C (2.0)
  assert.strictEqual(calculateAliaGpa(45).grade, 'C');
  assert.strictEqual(calculateAliaGpa(40).gradePoint, 2.0);

  // 33-39: D (1.0)
  assert.strictEqual(calculateAliaGpa(33).grade, 'D');
  assert.strictEqual(calculateAliaGpa(35).gradePoint, 1.0);

  // 0-32: F (0.0)
  assert.strictEqual(calculateAliaGpa(32).grade, 'F');
  assert.strictEqual(calculateAliaGpa(0).gradePoint, 0.0);
});

test('Qawmi Marhalas adhere to Befaqul Madaris canonical sequence', () => {
  assert.ok(QAWMI_MARHALAS.length >= 9, 'Must have at least 9 canonical Marhalas');

  // Verify order
  for (let i = 0; i < QAWMI_MARHALAS.length; i++) {
    assert.strictEqual(QAWMI_MARHALAS[i].levelOrder, i + 1);
    // Trilingual verification
    assert.ok(QAWMI_MARHALAS[i].name.bn.length > 0, 'Bangla name must not be empty');
    assert.ok(QAWMI_MARHALAS[i].name.en.length > 0, 'English name must not be empty');
    assert.ok(QAWMI_MARHALAS[i].canonicalKitabs.length > 0, 'Canonical Kitabs must be defined');
  }

  // Check Dawra-e-Hadith (equivalent to Masters) contains Sahih al-Bukhari
  const dawra = QAWMI_MARHALAS.find(m => m.id === 'takmil_dawra');
  assert.ok(dawra, 'Dawra-e-Hadith must exist');
  assert.ok(dawra.canonicalKitabs.some(k => k.includes('বুখারী') || k.includes('Bukhari')), 'Dawra must include Sahih al-Bukhari');
});

test('Alia classes cover Ebtedayee to Kamil tiers', () => {
  assert.ok(ALIA_CLASSES.length >= 12, 'Must cover 12+ class grades');
  const tiers = new Set(ALIA_CLASSES.map(c => c.tier));
  assert.ok(tiers.has('ebtedayee'), 'Must have Ebtedayee');
  assert.ok(tiers.has('dakhil'), 'Must have Dakhil');
  assert.ok(tiers.has('alim'), 'Must have Alim');
  assert.ok(tiers.has('fazil'), 'Must have Fazil');
  assert.ok(tiers.has('kamil'), 'Must have Kamil');
});

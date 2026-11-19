import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

const studentAction = read('src/app/actions/student.ts');
const newStudentForm = read('src/app/dashboard/students/new/new-student-form.tsx');
const navbar = read('src/components/Navbar.tsx');
const languageSwitcher = read('src/components/LanguageSwitcher.tsx');
const types = read('src/lib/i18n/types.ts');
const bn = read('src/lib/i18n/dictionaries/bn.ts');
const en = read('src/lib/i18n/dictionaries/en.ts');
const ar = read('src/lib/i18n/dictionaries/ar.ts');
const faculty = read('src/app/portals/faculty/page.tsx');
const admin = read('src/app/portals/admin/page.tsx');
const academic = read('src/app/portals/academic/page.tsx');
const bursar = read('src/app/portals/bursar/page.tsx');
const portalLayout = read('src/app/portals/layout.tsx');
const publicSiteShortcut = read('src/app/public-site/page.tsx');
const publicSiteRoute = read('src/app/m/[subdomain]/page.tsx');
const publicSiteView = read('src/app/public-site/public-site-view.tsx');
const admissionsAction = read('src/app/actions/admissions.ts');
const attendanceAction = read('src/app/actions/attendance.ts');
const attendanceView = read('src/app/dashboard/attendance/attendance-view.tsx');
const attendancePage = read('src/app/dashboard/attendance/page.tsx');
const admissionModal = read('src/app/dashboard/admissions/admission-modal.tsx');
const admissionPage = read('src/app/dashboard/admissions/page.tsx');
const examAction = read('src/app/actions/exams.ts');
const examView = read('src/app/dashboard/academic/exams/exam-management-views.tsx');

test('student create maps blood group to the real snake_case database column', () => {
  assert.ok(studentAction.includes('blood_group: input.bloodGroup'));
  assert.equal(studentAction.includes('bloodGroup: input.bloodGroup'), false);
  assert.ok(newStudentForm.includes('sectionId: formData.sectionId'));
  assert.ok(newStudentForm.includes('section.class_id === formData.classId'));
  assert.ok(studentAction.includes('Number.isSafeInteger(input.rollNo)'));
  assert.ok(studentAction.includes('এই সেকশনে রোল নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে'));
  assert.ok(studentAction.includes('roll_no: enrollment.rollNo'));
});

test('language selector is compact and exposes an accessible locale menu', () => {
  assert.ok(navbar.includes('<LanguageSwitcher />'));
  assert.ok(navbar.includes('isInstitutionPublicSite'));
  assert.ok(languageSwitcher.includes('aria-haspopup="menu"'));
  assert.ok(languageSwitcher.includes('role="menu"'));
  assert.ok(languageSwitcher.includes('setLocale(option.code)'));
  assert.ok(languageSwitcher.includes("event.key === 'Escape'"));
});

test('portal and public site translation contracts exist in all supported locales', () => {
  for (const dictionary of [bn, en, ar]) {
    assert.ok(dictionary.includes('portals:'));
    assert.ok(dictionary.includes('teacherLabel'));
    assert.ok(dictionary.includes('roleLabel'));
    assert.ok(dictionary.includes('publicSite:'));
    assert.ok(dictionary.includes('trackingInstruction'));
  }
  assert.ok(types.includes('portals: {'));
  assert.ok(types.includes('publicSite: {'));
});

test('teacher, admin, academic and bursar portals resolve server dictionaries', () => {
  for (const source of [faculty, admin, academic, bursar, portalLayout]) {
    assert.ok(source.includes('getServerDictionary'));
  }
  assert.ok(faculty.includes('dict.portals.faculty'));
  assert.ok(admin.includes('dict.portals.admin'));
  assert.ok(academic.includes('dict.portals.academic'));
  assert.ok(bursar.includes('dict.portals.bursar'));
});

test('institution public site is addressed by an exact active tenant slug', () => {
  assert.ok(publicSiteRoute.includes(".eq('subdomain', normalizedSlug)"));
  assert.ok(publicSiteRoute.includes(".eq('is_active', true)"));
  assert.ok(publicSiteRoute.includes(".eq('platform_status', 'active')"));
  assert.ok(publicSiteRoute.includes(".eq('tenant_id', tenant.id)"));
  assert.ok(publicSiteRoute.includes('notFound()'));
  assert.ok(publicSiteShortcut.includes('context.tenantSubdomain'));
  assert.ok(publicSiteShortcut.includes('redirect('));
  assert.ok(publicSiteRoute.includes('<LanguageSwitcher />'));
});

test('public notices use the actual bilingual database columns', () => {
  assert.ok(publicSiteRoute.includes('title_bn, title_en, content_bn, content_en'));
  assert.ok(publicSiteView.includes('notice.title_bn'));
  assert.ok(publicSiteView.includes('notice.title_en'));
  assert.ok(publicSiteView.includes('notice.content_bn'));
  assert.ok(publicSiteView.includes('notice.content_en'));
  assert.equal(publicSiteView.includes('n.title}'), false);
  assert.equal(publicSiteView.includes('n.content}'), false);
});

test('public admission submission revalidates tenant ID and slug server-side', () => {
  assert.ok(admissionsAction.includes('tenantSubdomain: string'));
  assert.ok(admissionsAction.includes(".eq('id', params.tenantId)"));
  assert.ok(admissionsAction.includes(".eq('subdomain', params.tenantSubdomain)"));
  assert.ok(admissionsAction.includes(".eq('is_active', true)"));
  assert.ok(publicSiteView.includes('tenantSubdomain: tenant.subdomain'));
});


test('student onboarding creates a linked guardian and cleans up failed enrollment', () => {
  assert.ok(studentAction.includes("from('student_guardians').insert"));
  assert.ok(studentAction.includes('guardianCleanupError'));
  assert.ok(studentAction.includes('blood_group: input.bloodGroup'));
});

test('attendance is limited to active enrolments in the selected section and year', () => {
  assert.ok(attendanceAction.includes("requirePermission('record_attendance')"));
  assert.ok(attendanceAction.includes(".eq('section_id', params.sectionId)"));
  assert.ok(attendanceAction.includes(".eq('academic_year_id', currentYear.id)"));
  assert.ok(attendanceAction.includes(".eq('is_active', true)"));
  assert.ok(attendanceAction.includes('isValidAttendanceDate'));
  assert.ok(attendanceView.includes('students.filter((student) => student.section_id === selectedSectionId)'));
  assert.ok(attendanceView.includes('loadSectionAttendance({ sectionId: selectedSectionId, attendanceDate: selectedDate })'));
  assert.ok(attendancePage.includes("hasPermission(context.role, 'record_attendance')"));
});

test('admission confirmation requires a valid class, section and roll and records guardian data', () => {
  assert.ok(admissionModal.includes('selectedClassId'));
  assert.ok(admissionModal.includes('selectedSectionId'));
  assert.ok(admissionModal.includes('sections={sections}') === false);
  assert.ok(admissionPage.includes('sections={sections}'));
  assert.ok(admissionsAction.includes("requirePermission('manage_admissions')"));
  assert.ok(admissionsAction.includes('sectionId: string'));
  assert.ok(admissionsAction.includes("relation_type: 'Guardian'"));
  assert.ok(admissionsAction.includes('.eq(\'status\', \'passed\')'));
});

test('exam actions validate subject totals, passing marks and enrollment before saving', () => {
  assert.ok(examAction.includes('passing_marks: passingMarks'));
  assert.ok(examAction.includes('calculateAliaGpa(percentage)'));
  assert.ok(examAction.includes('exam.is_published'));
  assert.ok(examAction.includes('.eq(\'class_id\', subject.class_id)'));
  assert.ok(examAction.includes("requirePermission('input_marks')"));
  assert.ok(examView.includes('canManageCurriculum && !exam.is_published'));
  assert.ok(examView.includes('canInputMarks && showMarksModal'));
  assert.ok(examView.includes('useI18n'));
});

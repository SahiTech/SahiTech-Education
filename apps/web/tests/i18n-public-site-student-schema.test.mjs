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

test('student create maps blood group to the real snake_case database column', () => {
  assert.ok(studentAction.includes('blood_group: input.bloodGroup'));
  assert.equal(studentAction.includes('bloodGroup: input.bloodGroup'), false);
  assert.ok(newStudentForm.includes('sectionId: formData.sectionId'));
  assert.ok(newStudentForm.includes('section.class_id === formData.classId'));
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

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
  assert.match(studentAction, /blood_group:\\s*input\\.bloodGroup/);
  assert.doesNotMatch(studentAction, /bloodGroup:\\s*input\\.bloodGroup/);
  assert.match(newStudentForm, /sectionId:\\s*formData\\.sectionId/);
  assert.match(newStudentForm, /sections\\.filter\\(\\(section\\) => section\\.class_id === formData\\.classId\\)/);
});

test('language selector is compact and exposes an accessible locale menu', () => {
  assert.match(navbar, /<LanguageSwitcher\\s*\\/>/);
  assert.match(languageSwitcher, /aria-haspopup="menu"/);
  assert.match(languageSwitcher, /role="menu"/);
  assert.match(languageSwitcher, /setLocale\\(option\\.code\\)/);
  assert.match(languageSwitcher, /event\\.key === 'Escape'/);
});

test('portal and public site translation contracts exist in all supported locales', () => {
  for (const dictionary of [bn, en, ar]) {
    assert.match(dictionary, /portals:/);
    assert.match(dictionary, /teacherLabel/);
    assert.match(dictionary, /roleLabel/);
    assert.match(dictionary, /publicSite:/);
    assert.match(dictionary, /trackingInstruction/);
  }
  assert.match(types, /portals:\\s*\\{/);
  assert.match(types, /publicSite:\\s*\\{/);
});

test('teacher, admin, academic and bursar portals resolve server dictionaries', () => {
  for (const source of [faculty, admin, academic, bursar, portalLayout]) {
    assert.match(source, /getServerDictionary/);
  }
  assert.match(faculty, /dict\\.portals\\.faculty/);
  assert.match(admin, /dict\\.portals\\.admin/);
  assert.match(academic, /dict\\.portals\\.academic/);
  assert.match(bursar, /dict\\.portals\\.bursar/);
});

test('institution public site is addressed by an exact active tenant slug', () => {
  assert.match(publicSiteRoute, /\\.eq\\('subdomain', normalizedSlug\\)/);
  assert.match(publicSiteRoute, /\\.eq\\('is_active', true\\)/);
  assert.match(publicSiteRoute, /\\.eq\\('platform_status', 'active'\\)/);
  assert.match(publicSiteRoute, /\\.eq\\('tenant_id', tenant\\.id\\)/);
  assert.match(publicSiteRoute, /notFound\\(\\)/);
  assert.match(publicSiteShortcut, /context\\.tenantSubdomain/);
  assert.match(publicSiteShortcut, /redirect\\(/);
  assert.match(publicSiteRoute, /<LanguageSwitcher \/>/);
  assert.match(navbar, /isInstitutionPublicSite/);
});

test('public notices use the actual bilingual database columns', () => {
  assert.match(publicSiteRoute, /title_bn, title_en, content_bn, content_en/);
  assert.match(publicSiteView, /notice\\.title_bn/);
  assert.match(publicSiteView, /notice\\.title_en/);
  assert.match(publicSiteView, /notice\\.content_bn/);
  assert.match(publicSiteView, /notice\\.content_en/);
  assert.doesNotMatch(publicSiteView, /\\bn\\.title\\b|\\bn\\.content\\b/);
});

test('public admission submission revalidates tenant ID and slug server-side', () => {
  assert.match(admissionsAction, /tenantSubdomain:\\s*string/);
  assert.match(admissionsAction, /\\.eq\\('id', params\\.tenantId\\)/);
  assert.match(admissionsAction, /\\.eq\\('subdomain', params\\.tenantSubdomain\\)/);
  assert.match(admissionsAction, /\\.eq\\('is_active', true\\)/);
  assert.match(publicSiteView, /tenantSubdomain:\\s*tenant\\.subdomain/);
});

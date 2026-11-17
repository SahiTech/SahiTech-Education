# MDI Public Website — International Islamic Design Specification

**Product:** Madrasa Digitalization Initiative (MDI)  
**Parent brand:** SahiTech  
**Division:** SahiTech Education  
**Primary implementation:** apps/web/src/app/page.tsx  
**Shared shell:** apps/web/src/app/layout.tsx and apps/web/src/components/Navbar.tsx  
**Status at review:** Existing homepage foundation is source-implemented; the enhanced visual and content direction below is the target contract. Dynamic prayer tools, newsletter delivery and a complete editorial site are planned extensions, not verified current features.  
**Reviewed:** 2026-11-17 against main commit aaaf802d4c4f85b7982410d346ece201201116b4

## 1. Purpose and audience

The public website introduces MDI to madrasa leaders, Muhtamims, academic administrators, teachers, families and institutional partners. It must communicate institutional value before technology. It is not the authenticated dashboard, Global Owner console, a developer status page or an online religious authority.

The experience should feel dignified, calm, credible, welcoming and internationally legible while remaining usable on modest Android devices and low-bandwidth connections in Bangladesh.

## 2. Brand hierarchy and protected names

- SahiTech — parent brand.
- SahiTech Education — education division of SahiTech.
- Madrasa Digitalization Initiative (MDI) — initiative under SahiTech Education.

Use “A SahiTech Education initiative” or “An initiative by SahiTech Education”. Do not imply a separate registered legal entity, government approval, board accreditation, religious endorsement or partnership unless independently documented.

Keep these brand strings exactly in English in every locale:
- SahiTech
- SahiTech Education
- Madrasa Digitalization Initiative
- MDI

Translate the surrounding descriptive copy naturally; do not transliterate these protected names.

## 3. Design principles

1. **Trust before spectacle:** restrained visual design, clear information hierarchy, real proof and no invented metrics.
2. **Islamic identity with respect:** use appropriate architecture, learning spaces, geometric texture and natural light. Never use Qur'anic text or sacred calligraphy as filler decoration.
3. **Readable first:** prioritize legible Bangla, English and Arabic typography, sufficient line-height and short copy.
4. **Progressive disclosure:** explain benefits first; keep advanced detail on relevant pages.
5. **Mobile-first:** no horizontal overflow, small tap targets, hover-only information or complex desktop-only interactions.
6. **Accessible by default:** semantic landmarks, keyboard support, visible focus, contrast, reduced-motion support and useful form feedback.
7. **Honest capability claims:** distinguish available, in-progress and planned capabilities. Never imply that a card is an operational service solely because the domain or database model exists.
8. **Performance-aware:** optimize image bytes, font loading and client JavaScript. Avoid adding dependencies for decorative effects.

## 4. Visual system

### 4.1 Palette

Use the existing emerald identity as the anchor and warm ivory as the public-site surface. Centralize values into semantic CSS variables before broad rollout; avoid repeating raw hex values across new components.

| Semantic token | Direction | Use |
|---|---|---|
| Brand primary | Emerald, aligned with existing #047857 | Primary actions, links, active states |
| Brand deep | Deep emerald, aligned with existing #064e3b | Hero overlay, footer, strong surfaces |
| Accent | Muted antique amber, aligned with existing #d97706 | Small highlights, icons and focus accents |
| Page canvas | Warm ivory, currently used as #fbfaf6 on homepage | Public content background |
| Surface | White / near-white | Cards, forms and readable content areas |
| Text | Slate / charcoal | Body and headings |
| Muted text | Accessible slate | Supporting copy, captions and metadata |
| Border | Warm neutral | Separation without heavy boxes |

Rules:
- Accent gold/amber must remain secondary; emerald defines the product.
- Use dark sections selectively (hero and footer), not for every card.
- Do not introduce a second competing brand palette. Qawmi/Alia colors may be used as contextual labels only and must not imply different product brands.
- Text and controls must meet WCAG 2.2 AA contrast. Test actual foreground/background pairs; do not infer compliance from color names.
- Prefer subtle borders and shadows over gradients and glass effects. Use existing visual assets only after checking visual quality and image rights.

### 4.2 Typography

- Bangla: choose a readable Unicode Bengali font with correct conjuncts and vowel marks; keep system fallbacks.
- English: clean system sans-serif or a deliberately optimized web font.
- Arabic: readable Arabic typeface with correct shaping, line-height and RTL behavior.
- Use a predictable type scale, moderate heading weights and comfortable paragraph line-height.
- Avoid loading multiple weights or fonts unnecessarily. Confirm local font assets/licences before bundling them.
- Do not encode text as images.

### 4.3 Layout and spacing

- Use a consistent centered content container with responsive side padding.
- Desktop content should have a deliberate maximum width; mobile should retain comfortable gutters.
- Keep sections visually distinct through spacing, subtle background shifts and headings.
- Use reusable card, button, badge, section-heading and form patterns rather than bespoke styling for each section.
- Do not force fixed heights on text containers; allow Bangla and Arabic text to wrap naturally.

## 5. Current implementation baseline (source inspection)

The current main-branch homepage:
- is an async server page and reads the locale dictionary via getServerDictionary();
- uses the existing campus and geometric-pattern assets under /images;
- displays an emerald photographic hero with two working route targets in source: /register-madrasa and /verify;
- presents three capability cards and a secondary three-item pathway area;
- uses shared Navbar and I18nProvider responsibilities from the root layout;
- renders a compact footer with verification, registration and login links.

The shared Navbar already handles public/workspace navigation, a locale control for bn/en/ar, mobile menu state and a session-aware destination. The root layout resolves lang and dir on the server and includes global CSS and Vercel Analytics.

The following are **not present in the inspected homepage implementation** and must not be described as live:
- live prayer-time calculation or location selection;
- Qibla compass/direction;
- Hijri calendar widget;
- newsletter subscription backend;
- blog/editorial publishing workflow;
- dynamic public institution metrics.

The current page and shared shell still contain hard-coded style values in addition to global CSS variables. The next design-system pass should centralize tokens incrementally without destabilizing authenticated dashboards.

## 6. Information architecture and section order

### Required public homepage foundation

1. **Shared header and navigation**
   - Preserve the shared Navbar; do not duplicate a second public navigation component inside the homepage.
   - Keep brand lockup and attribution clear.
   - Maintain public navigation links only to routes that exist.
   - Primary action: institution registration at /register-madrasa.
   - Secondary action: Sanad verification at /verify.
   - Login remains accessible but visually secondary.
   - Mobile navigation must expose the same functional destinations and locale controls.
2. **Hero**
   - Real educational/campus image with a legible overlay.
   - One benefit-led headline and concise supporting text.
   - Explicit audience: Qawmi and Alia institutions.
   - Primary and secondary actions must work.
   - Show attribution “A SahiTech Education initiative”.
   - No database versions, RLS counters, table counts, unsupported “enterprise-grade” claims or fabricated social proof.
3. **Institutional positioning**
   - Explain the problem MDI helps institutions organize and the practical outcomes.
   - Avoid claims of official approval, accreditation or partnerships.
4. **Core capabilities**
   - Present concise categories such as academic administration, student records, attendance/examinations, institutional operations and verifiable Sanad records.
   - Only describe a capability as available when its end-to-end workflow is implemented and verified.
   - Otherwise mark it as “in development” or omit it from public marketing.
5. **Qawmi and Alia pathways**
   - Explain each academic context respectfully and accurately.
   - Do not present a single universal curriculum or imply that one institution must use both engines.
6. **Trust and privacy**
   - Explain institution-scoped access and careful handling of records in plain language.
   - Avoid absolute promises such as “impossible to breach” or “guaranteed secure”.
7. **Institution registration / contact prompt**
   - Use existing working routes.
   - Do not create inert CTA buttons or placeholder contact details.
8. **Large footer**
   - Brand hierarchy, concise description, working navigation and only verified official contact/social/legal links.
   - Keep protected brand names in English.
   - Do not expose internal database, hosting or security implementation details.

### Optional future extensions — separate product decisions

These are not required for the first public-site optimization and must not block the core homepage:

- **Prayer-time panel:** only after selecting a reputable source or validated calculation library, explicit calculation method, timezone, location selection and a graceful unavailable state. Never infer precise location or invent prayer times.
- **Qibla utility:** only with a permission-aware compass/geolocation experience and manual fallback, with device limitations explained.
- **Hijri date/calendar:** disclose the selected calendar convention and allow for local moon-sighting differences where relevant.
- **Newsletter:** only after a secure server-side subscription store, explicit consent, duplicate handling, rate limiting, unsubscribe workflow, sender verification and actual delivery test exist. Signing up must not create an MDI account.
- **Blog/editorial:** only after a content owner, publishing permissions, moderation and source-of-truth workflow are defined.

Do not add a paid data provider, email provider, map, analytics or API dependency without explicit approval.

## 7. Content and localization contract

Supported locales:
- Bangla: bn (default)
- English: en
- Arabic: ar (RTL)

The implementation currently uses TypeScript dictionaries under apps/web/src/lib/i18n/dictionaries. Keep keys aligned across all three dictionaries and type definitions. The current shared provider persists the selected locale through the NEXT_LOCALE cookie.

Every visible public string must be localized:
- navigation and mobile menu;
- hero, buttons and capability copy;
- form labels, errors, loading, empty and success states;
- footer links, legal copy and metadata;
- future widgets, including unavailable/error states.

Brand names remain exactly in English. Arabic must set document direction to RTL; Bangla and English use LTR. Use CSS logical properties (margin-inline, padding-inline, inset-inline, text-align:start/end) and test actual component order. Wrap embedded mixed-direction names/tokens in bdi where punctuation may reorder.

Do not create a second dictionary source. If JSON files remain in the repository but are not imported by the active i18n modules, treat the imported TypeScript dictionaries as current runtime source until the architecture is intentionally changed.

## 8. Interaction, accessibility and responsive behavior

- Use semantic header, nav, main, section, form and footer elements.
- Every link must navigate; every button must perform an action.
- Do not use divs as controls without complete keyboard and ARIA behavior.
- Inputs require persistent labels, useful validation and programmatic error associations.
- Provide visible focus styles and maintain logical keyboard order.
- Respect prefers-reduced-motion; do not animate core content into view in a way that delays access.
- Set image dimensions/aspect ratio and responsive sizes to avoid layout shift.
- Test at minimum 320px, 360px, 390px, 768px, 1024px and 1440px widths, in bn/en/ar.
- Test Arabic RTL for header, mobile menu, buttons, icon direction, card order, footer and mixed Bangla/Arabic text.
- Keep critical content readable with zoom and larger font settings.

## 9. Performance and implementation boundaries

- Preserve the Next.js App Router and current server/client component boundaries.
- Keep static public content server-rendered where practical.
- Add client components only for actual interactions.
- Reuse the current Navbar and i18n provider; do not create duplicate shells.
- Optimize and compress images; prefer modern formats where supported and keep responsive image delivery.
- Avoid autoplay video, heavy carousels, parallax and large animation libraries.
- Do not add a new dependency for a simple interaction that can use browser-native behavior.
- External services stay behind server-side adapters and environment variables.
- Do not weaken authentication, tenant authorization, RLS, Storage policies or existing route behavior to add public features.

## 10. Delivery sequence

### P0 — Baseline polish and consistency
- Preserve working routes and shared shell.
- Remove unsupported or overly technical marketing language.
- Standardize visual tokens and reusable components incrementally.
- Verify all homepage strings across bn/en/ar.
- Check image crop, overlay contrast, typography and spacing on mobile and desktop.
- Check all buttons and footer links.

### P1 — Institutional content quality
- Improve capability descriptions and Qawmi/Alia explanation based on verified product scope.
- Add privacy/trust copy based on actual security behavior.
- Build a more balanced footer with only real destinations.

### P2 — Optional connected tools
- Decide and separately scope prayer times, Qibla, Hijri calendar, newsletter or editorial content.
- Implement each with reliable data, privacy and abuse controls.
- Do not ship placeholder UI as functional service.

### Release review
- Run typecheck, lint, automated tests and production build.
- Perform visual review at the required breakpoints and all locales.
- Validate links and real integrations.
- Deploy to Preview and inspect the exact commit.
- Production release requires separate explicit approval.

## 11. Acceptance criteria

- Brand hierarchy and protected names are consistent.
- The homepage describes the actual MDI product honestly.
- Only working routes and verified capabilities are promoted.
- The public page and shared Navbar feel like one coherent product.
- Bangla, English and Arabic are complete for the visible homepage; Arabic RTL is tested.
- No horizontal overflow or inaccessible interactions occur at supported widths.
- Contrast, focus, form feedback, reduced motion and image layout are checked.
- No prayer/newsletter/third-party service is claimed operational without live evidence.
- Build checks and Preview review are evidenced before release.

**Implementation rule:** This specification is a design contract, not proof that every section or integration already exists. When a requirement conflicts with current architecture or cannot be delivered safely, document the gap and propose the smallest safe change.


## Hero media performance implementation note

The homepage hero is the primary Largest Contentful Paint candidate. Keep the campus image on the critical path but avoid a separate large decorative texture request:
- Prioritize the hero image with Next.js image priority/fetch priority and explicit responsive sizing.
- Use a CSS-only geometric texture for decorative overlay rather than downloading a large background image.
- Keep the hero image quality responsive to visual inspection; the current implementation uses a reduced quality setting that must be checked on real mobile and desktop screenshots.
- Do not claim a PageSpeed/Core Web Vitals improvement until a fresh preview measurement is recorded for the same route, device profile and test conditions.

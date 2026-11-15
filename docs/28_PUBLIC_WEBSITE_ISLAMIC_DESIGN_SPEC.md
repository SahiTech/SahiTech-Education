# MDI Public Website — International Islamic Design & Homepage Specification

**Status:** Design specification — approved direction, implementation pending  
**Product:** Madrasa Digitalization Initiative (MDI)  
**Parent brand:** SahiTech  
**Division:** SahiTech Education  
**Repository:** `SahiTech/SahiTech-Education`  
**Primary route:** `apps/web/src/app/page.tsx`

---

## 1. Purpose

Redesign the public MDI homepage as a credible, international-standard Islamic education platform. The experience must feel calm, trustworthy, institutionally mature, culturally respectful, and easy to use across Bangladesh and international audiences.

This is a public-facing product and institutional website, not a developer dashboard. The homepage must explain the value of MDI in clear human language. Technical implementation details must not be used as marketing content.

This document is the source of truth for homepage design and the related public-site experience. Implementation must follow this specification rather than inventing a separate visual direction.

## 2. Brand hierarchy and naming

Use the following hierarchy consistently:

- **SahiTech** — parent brand.
- **SahiTech Education** — education division of SahiTech.
- **Madrasa Digitalization Initiative (MDI)** — initiative operated under SahiTech Education.

Preferred public attribution:
- “A SahiTech Education initiative”
- “An initiative by SahiTech Education”
- “Part of SahiTech Education”

Do not describe MDI as an independent company or imply a separate legal entity unless that status is formally confirmed.

### Protected brand strings

The following names are brand identifiers and must remain in English in every locale:

- `SahiTech`
- `SahiTech Education`
- `Madrasa Digitalization Initiative`
- `MDI`

Do not transliterate or translate these names into Bangla or Arabic. Surrounding descriptive text may be translated naturally. Keep brand spelling, capitalization, and spacing exact.

## 3. Design principles

1. **International quality:** polished typography, deliberate spacing, consistent components, strong accessibility, responsive layouts, and restrained motion.
2. **Islamic identity:** refined Islamic architectural photography, subtle geometric motifs, tasteful arabesque details, and a dignified visual tone.
3. **Institutional trust:** present MDI as dependable education infrastructure for madrasas, educators, students, and families.
4. **Clarity over density:** communicate outcomes and services; remove internal engineering details, vanity metrics, redundant copy, and unexplained acronyms.
5. **Respectful visual language:** avoid decorative misuse of Qur'anic text, sacred calligraphy, religious symbols, or prayer content.
6. **Mobile-first usability:** all sections, navigation, widgets, and forms must work on small screens and touch devices.
7. **Localization by design:** Bangla, English, and Arabic must be complete experiences, not partial text substitutions.

## 4. Visual identity

### 4.1 Core palette

Use a restrained palette inspired by Islamic architecture, gardens, parchment, and warm metals.

| Token | Hex | Intended use |
|---|---|---|
| Deep Emerald | `#123C32` | Primary brand surfaces, hero overlays, footer |
| Forest Green | `#1E5A46` | Primary buttons, links, active states |
| Muted Sage | `#A8B9A3` | Soft backgrounds, secondary accents |
| Warm Ivory | `#F7F4EA` | Main page background and cards |
| Parchment | `#EDE6D6` | Section backgrounds and dividers |
| Antique Gold | `#B89555` | Small highlights, borders, icons |
| Charcoal | `#202923` | Main body text |
| Muted Slate | `#66736B` | Secondary text |
| White | `#FFFFFF` | High-contrast surfaces |

Rules:
- Green is the primary identity; gold is an accent, never a dominant color.
- Prefer ivory and white content surfaces over large areas of dark backgrounds.
- Maintain WCAG AA contrast for text and interactive controls.
- Do not use bright neon green, excessive gradients, or multiple unrelated accent colors.
- Define palette values as shared design tokens/CSS variables rather than repeating arbitrary Tailwind colors.

### 4.2 Typography

- Use a clean, highly legible Latin sans-serif for English.
- Use a well-supported Bangla typeface with good readability at small sizes.
- Use a readable Arabic typeface with correct shaping and RTL support.
- Use consistent typographic scale, line-height, and weights across locales.
- Avoid oversized all-bold text blocks and decorative fonts for body content.
- Load fonts efficiently; use local or optimized font loading where practical.

### 4.3 Islamic visual language

- Use authentic, high-quality imagery: madrasa campuses, mosque courtyards, Islamic arches, libraries, learning spaces, geometric architecture, and educational settings.
- Use geometric patterns as subtle background texture, not as visual noise.
- Use architectural framing, arches, restrained ornamental borders, and natural light.
- Avoid generic stock imagery that feels unrelated to Islamic education.
- Avoid placing text over visually busy image areas; use a carefully tuned overlay.
- Do not use Qur'anic verses or sacred calligraphy as filler decoration.

## 5. Homepage information architecture

The homepage should tell a simple story: identity → purpose → capabilities → useful Islamic tools → stay connected → institutional footer.

Recommended section order:

1. **Header / Navigation**
   - Brand lockup: SahiTech Education and MDI relationship.
   - Clear navigation for About, Solutions/Features, For Institutions, Sanad Verification, and Contact (only where routes exist).
   - Language switcher for বাংলা, English, العربية.
   - Clear primary action for institution registration or getting started.
   - Login should be accessible but visually secondary to the public conversion action.
   - Mobile menu must expose the same destinations and language controls.

2. **Hero**
   - Strong Islamic educational visual, preferably a real campus/mosque/library image with an elegant arch or geometric treatment.
   - A concise headline describing the benefit of digital transformation for Islamic institutions.
   - Supporting copy explaining who MDI serves.
   - Primary CTA: register/apply an institution (use the actual supported route).
   - Secondary CTA: verify a Sanad (use the actual supported route).
   - Attribution line: “A SahiTech Education initiative”.
   - Avoid technical counters, database facts, or unsupported performance claims.

3. **Institutional trust / positioning**
   - Explain that MDI is developed under SahiTech Education.
   - Describe its role as a professionally managed digital initiative for madrasa administration and education.
   - Do not imply government approval, accreditation, partnerships, or legal status without evidence.

4. **Core capabilities**
   - Present capabilities in plain language: academic administration, student records, attendance and assessment, institutional finance, digital Sanad verification, and public institutional presence.
   - Only label a capability as available if it is implemented and verified. Otherwise mark it as planned or omit it.
   - Keep cards visually consistent and concise.

5. **Academic pathways**
   - Explain support for Qawmi and Alia contexts accurately.
   - Avoid overclaiming complete curriculum coverage if not verified.
   - Use culturally appropriate imagery and clear explanatory labels.

6. **Islamic utility and quick links**
   - Provide a compact, useful row/grid of shortcuts such as Prayer Times, Qibla direction, Islamic Calendar, and Sanad Verification.
   - Only show tools that have a working implementation or a clearly defined destination.
   - Do not present decorative/inert widgets as functional tools.

7. **Prayer and Islamic information panel**
   - Place above the newsletter and footer.
   - Show current local prayer context: next prayer, time remaining, and today's prayer schedule when reliable data is available.
   - Clearly identify the location used for prayer calculations. Offer manual city selection; do not silently assume a precise location.
   - Include calculation method and timezone handling in the implementation.
   - Refresh displayed time safely and avoid hydration mismatch.
   - Provide localized labels, dates, digits, and time formats.
   - If prayer-time data is unavailable, show a graceful localized fallback rather than fabricated times.
   - Additional Islamic widgets may include Hijri date and Qibla shortcut; do not add unsupported claims or unverified religious content.

8. **Newsletter subscription**
   - Place immediately before the main footer.
   - Heading should invite visitors to receive MDI news, educational updates, announcements, and new blog/article notifications.
   - Collect email only; keep the form short.
   - Include explicit consent language and a link to the privacy policy (create/confirm route before linking).
   - Provide localized validation, success, duplicate-subscription, and error states.
   - Store consent timestamp and source where supported.
   - Support unsubscribe in every marketing email.
   - Use a verified sender/domain and a compliant email provider. Do not claim a subscription succeeded until the backend confirms it.
   - Protect the endpoint with server-side validation, rate limiting, and bot/spam protection.
   - Newsletter signup must not create an application account or grant platform access.
   - Design for future editorial/blog announcements and permission-based email campaigns.

9. **Large institutional footer**
   - Use a deep emerald background with a tasteful Islamic geometric/architectural visual treatment.
   - Make it visually substantial, balanced, and easy to scan.
   - Include brand hierarchy and the attribution “A SahiTech Education initiative”.
   - Include concise MDI description, navigation links, institution links, contact details only if verified, social links only if official, and legal/privacy links only when routes exist.
   - Include language controls if useful, copyright, and a clear brand signature.
   - Do not include database versions, PostgreSQL, RLS, table counts, internal architecture labels, or other developer-facing details.
   - Do not translate protected brand names.

## 6. Localization and language quality

Supported locales: Bangla (`bn`), English (`en`), and Arabic (`ar`).

A language change must update the entire user-visible public experience, including:
- Header and mobile navigation.
- Hero headline, description, labels, and CTA text.
- All capability cards and section headings.
- Prayer widget labels, prayer names, date/time presentation, and location controls.
- Islamic utility shortcuts.
- Newsletter title, description, field labels, consent text, validation, and feedback.
- Footer navigation, legal labels, and copyright text where localized.
- Buttons, tooltips, accessible labels, empty states, loading states, and error messages.
- Metadata, page title, description, and locale alternates where appropriate.

Rules:
- No hardcoded Bangla/English/Arabic text in shared public components when a dictionary key should be used.
- Search for and remove mixed-language leftovers.
- Keep brand strings in English in all dictionaries and render them unchanged.
- Do not use machine-translated literal phrases where natural institutional language is required.
- Arabic must set RTL direction and mirror layout where appropriate; icons that indicate direction must also respect RTL.
- Bangla and English should use LTR direction.
- Verify locale persistence across navigation and refresh.
- Add a locale completeness check or a documented manual audit for missing dictionary keys.

## 7. Content and copy rules

- Write for madrasa leaders, administrators, teachers, students, parents, and institutional partners.
- Lead with institutional outcomes: better administration, accessible information, trusted records, and improved communication.
- Avoid developer-centric content such as database engine versions, RLS, schema, RPC, API, tables, or internal architecture.
- Avoid unsupported numerical claims (for example, number of modules, institutions, users, uptime, or security guarantees).
- Avoid repeated claims across hero, cards, and footer.
- Use concise, professional, respectful language in all three locales.

## 8. Interaction, accessibility, and responsive requirements

- Semantic landmarks: header, nav, main, section, form, footer.
- Keyboard-accessible navigation and forms with visible focus states.
- Correct labels and accessible error announcements.
- Minimum comfortable touch target sizing on mobile.
- Respect reduced-motion preferences.
- Avoid layout shifts from images, fonts, and dynamic widgets.
- Responsive testing at narrow mobile, tablet, laptop, and wide desktop widths.
- Prayer widget and newsletter must remain usable without horizontal scrolling.
- Use optimized images with explicit dimensions/aspect ratios and responsive delivery.
- Keep animation subtle and purposeful.

## 9. Technical implementation boundaries

- Preserve existing Next.js App Router conventions and current localization architecture unless a documented change is necessary.
- Reuse existing components and routes after inspecting them; do not create duplicate navigation or footer systems.
- Keep public marketing content separate from authenticated portal navigation.
- Do not weaken authentication, tenant authorization, or RLS to support public widgets or newsletter signup.
- Prayer times must use a reputable data source or a validated calculation library with explicit calculation settings. Do not hardcode live times.
- Newsletter must use a server-side integration and secure storage; do not expose provider API keys to the browser.
- Do not add a new paid service or subscription without explicit approval.
- Keep external integrations behind typed service boundaries and environment variables.
- Do not introduce fake functionality, placeholder links, or success messages without real behavior.

## 10. Current code observations (baseline)

The existing homepage at `apps/web/src/app/page.tsx` currently:
- Uses a dark slate/emerald hero with a campus image and geometric pattern.
- Has three main capability cards and a secondary capability strip.
- Contains hardcoded Bangla labels inside an otherwise dictionary-driven page.
- Displays technical/implementation metrics such as “RLS Data Isolation”, “Postgres 17 Tables”, and “Academic Modules”.
- Includes a small footer with a technical database label.
- Does not currently show the requested prayer-time panel or newsletter subscription section.

The root layout renders a shared `Navbar` and wraps the app in the existing `I18nProvider`. The redesign must inspect and preserve the shared navigation/i18n responsibilities rather than duplicating them in the homepage.

Existing image assets include `/images/hero-campus.jpg` and `/images/islamic-pattern.jpg`; inspect their actual appearance and quality before deciding whether to retain, replace, or supplement them.

## 11. Implementation plan

### Phase A — Design foundation
- [ ] Review existing design-system and localization documentation.
- [ ] Inspect current homepage, shared Navbar, dictionaries, and existing image assets.
- [ ] Finalize design tokens, typography, spacing, component variants, and imagery direction.
- [ ] Map every homepage section and every visible string to locale dictionary keys.

### Phase B — Homepage redesign
- [ ] Rebuild hero and institutional positioning.
- [ ] Rework capability cards and academic pathways.
- [ ] Add useful Islamic shortcuts.
- [ ] Add a real prayer-time widget with location and calculation transparency.
- [ ] Add newsletter UI connected to a secure backend workflow.
- [ ] Build a large, international-quality Islamic footer.
- [ ] Remove technical vanity metrics and unsupported claims.

### Phase C — Localization and quality
- [ ] Complete Bangla, English, and Arabic copy.
- [ ] Verify brand names remain English in all locales.
- [ ] Verify Arabic RTL layout and icon direction.
- [ ] Test all visible strings, validation, loading, empty, and error states.
- [ ] Test mobile/tablet/desktop and keyboard accessibility.
- [ ] Run lint, typecheck, tests, and production build.
- [ ] Verify links and integrations; document anything blocked by missing credentials or provider setup.

### Phase D — Review and release
- [ ] Create a preview deployment.
- [ ] Review screenshots at mobile and desktop widths.
- [ ] Fix visual regressions and accessibility issues.
- [ ] Obtain review before merging to `main` or promoting to Production.
- [ ] Verify the production site after release.

## 12. Acceptance criteria

The redesign is not complete until all of the following are true:

- [ ] The homepage has a coherent international Islamic visual identity.
- [ ] Brand hierarchy is clear and “SahiTech” / “SahiTech Education” remain English in Bangla and Arabic.
- [ ] No developer-facing database/security metrics appear on the public homepage.
- [ ] The hero clearly explains MDI and offers working primary actions.
- [ ] The page is balanced, uncluttered, responsive, and accessible.
- [ ] Prayer information is real, localized, location-aware, and transparent about its calculation settings.
- [ ] Islamic shortcuts lead to real tools or valid destinations.
- [ ] Newsletter subscription uses a real secure backend, clear consent, and unsubscribe support.
- [ ] The footer is visually substantial and fully localized except protected brand names.
- [ ] Switching between Bangla, English, and Arabic changes every visible string and handles RTL correctly.
- [ ] No unsupported institutional, security, or feature claims are introduced.
- [ ] Automated checks pass and preview review is complete before production release.

---

**Implementation rule:** Treat this document as the design contract. If the current code, an existing component, or an integration cannot satisfy a requirement safely, document the gap and propose the smallest safe change rather than silently shipping a fake or partial feature.

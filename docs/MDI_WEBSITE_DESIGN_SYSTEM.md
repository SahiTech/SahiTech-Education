# MDI Public Website Design System
## SahiTech Education · Madrasa Digitalization Initiative (MDI)

**Status:** Approved design direction for implementation  
**Scope:** Public homepage, shared site navigation, public-facing footer, public-site localization, prayer-time experience, and newsletter subscription entry point.  
**Brand ownership:** SahiTech is the parent brand. SahiTech Education is an education division of SahiTech. MDI is an initiative by SahiTech Education.

---

## 1. Brand hierarchy and naming rules

The public website must communicate the organization hierarchy clearly and consistently:

1. **SahiTech** — parent brand.
2. **SahiTech Education** — education division of SahiTech.
3. **Madrasa Digitalization Initiative (MDI)** — an initiative by SahiTech Education.

Use these exact English brand spellings in every language:
- `SahiTech`
- `SahiTech Education`
- `Madrasa Digitalization Initiative (MDI)`

These are protected brand strings. Never transliterate, translate, or render them in Bengali or Arabic script. Surrounding explanatory copy may be localized, but the protected brand names remain English.

Approved relationship wording:
- English: “SahiTech Education is an education division of SahiTech.”
- English: “MDI is an initiative by SahiTech Education.”
- Bengali and Arabic versions should communicate the same hierarchy while preserving all three protected brand strings exactly.

Do not describe SahiTech Education as a separate parent company, independent parent organization, or legally registered entity unless that status is separately confirmed.

## 2. Design direction

Create an international-standard Islamic education technology identity: calm, dignified, scholarly, contemporary, trustworthy, and welcoming to Qawmi and Alia institutions.

The result should feel like a professional education institution and digital platform—not a generic SaaS landing page, crypto dashboard, or technology vendor template.

### Visual principles
- Use Islamic visual references with restraint and purpose: geometric arabesque, arches, subtle mihrab-inspired framing, refined architectural photography, and carefully composed ornamental separators.
- Make the Islamic visual character immediately visible in the hero and especially in the footer.
- Use authentic institutional imagery and the existing campus / Islamic-pattern assets where suitable. Avoid random stock imagery and overly decorative effects.
- Give content room to breathe. Use a strong editorial grid, generous spacing, clear hierarchy, consistent radii, and accessible contrast.
- No fabricated metrics, unverifiable claims, or technical infrastructure badges on the public homepage.

### Design tokens

| Token | Value | Use |
|---|---|---|
| Deep Emerald | `#123D32` | Primary brand surfaces, hero/footer |
| Forest Green | `#0B2B24` | Deep backgrounds and overlays |
| Heritage Gold | `#B89455` | Fine accents, icons, rules and highlights |
| Warm Ivory | `#F7F4EC` | Main page background |
| Parchment | `#EEE8DA` | Secondary panels and cards |
| Ink | `#202B27` | Primary text |
| Muted Slate | `#69736E` | Secondary text |
| White | `#FFFFFF` | Surface and contrast |

Gold is an accent, not a large-area background. Green should remain the dominant brand hue. Keep the palette consistent across bn/en/ar.

### Typography
- Bengali: a legible Bengali-capable sans-serif stack; never use a Latin-only font for Bengali.
- English: a clean, professional sans-serif stack.
- Arabic: a readable Arabic/Naskh stack with correct shaping and RTL spacing.
- Keep the same typographic hierarchy across locales while allowing natural line wrapping and locale-specific spacing.

## 3. Public homepage information architecture

### A. Shared site header
- A refined light/ivory header with a compact geometric brand mark.
- Brand lockup must show `SahiTech` and `SahiTech Education` in English.
- A small localized relationship line explains “an education division of SahiTech”.
- MDI is identified as the initiative, not as the parent brand.
- Desktop navigation remains concise. Mobile navigation must be easy to operate.
- Language selector supports Bengali, English and Arabic. Arabic selection must set RTL direction.
- Login and Madrasa registration actions remain visible and clearly distinguished.

### B. Hero
- A strong two-column editorial layout on desktop, stacked on mobile.
- Use the existing campus image with an architectural/mihrab-inspired frame and subtle geometric ornament.
- Place a short localized eyebrow identifying MDI as an initiative by SahiTech Education.
- Use one clear headline focused on helping Islamic educational institutions manage teaching and administration.
- Supporting paragraph should describe outcomes in plain language, not database or software internals.
- Primary CTA: explore the platform / sign in (destination must match the implemented flow).
- Secondary CTA: register a Madrasa.
- Tertiary text link: verify a digital Sanad.
- Avoid unsupported “global”, “100% secure”, “real-time” or numerical performance claims.

### C. Institutional capabilities
Present the actual product scope in human terms:
- Qawmi education and Dars-e-Nizami academic structure.
- Alia and board-affiliated academic structure.
- Student admissions, records, attendance and examinations.
- Finance, fee collection and Shariah fund separation where the corresponding module is available.
- Digital Sanad issuance and public verification.
- Institution-specific public presence / information portal, if enabled.

Do not expose implementation details such as PostgreSQL version, RLS, table counts, API names, framework versions, or raw architecture labels in public marketing content.

### D. How MDI supports an institution
Explain a short user-facing journey:
1. Institution submits its registration application.
2. The platform team reviews the application and documents.
3. An approved institution receives an invitation.
4. The institution completes its workspace setup.
5. Authorized staff use role-appropriate work areas.

Do not imply that application submission instantly creates an active institution workspace.

### E. Islamic utility area
Place a distinct Islamic utility section in the lower part of the homepage, above the newsletter and footer.

The section should contain:
- Daily prayer-time panel for the selected city.
- Current/next prayer indicator and a live countdown calculated in the browser.
- Prayer schedule for Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha.
- City selector with Dhaka, Bangladesh as the initial default; users may choose another supported city.
- Quick links for Qur’an, Qibla finder, public Sanad verification, and Madrasa registration.
- Clear loading, unavailable, and stale-data states.
- No fabricated times or placeholder values presented as live.

**Prayer-time calculation defaults:** use AlAdhan's University of Islamic Sciences, Karachi method (method 1) as the initial Bangladesh-friendly setting and Hanafi Asr school (school 1). Expose the method/location in implementation notes and keep the city configurable. The displayed schedule is an API calculation and may differ from the local mosque or official authority; show a short disclaimer and encourage users to follow their local authority where appropriate. Do not claim official endorsement by AlAdhan or any religious authority.

### F. Newsletter subscription
Place the subscription block immediately above the main footer.

Purpose:
- Collect consent-based email subscriptions for future MDI announcements, product updates, articles and blog posts.
- Use a clear value proposition, email field, submit action, and concise privacy/consent copy.
- Support bn/en/ar fully.
- Validate email and show localized success/error states.
- Prevent silent failure and never tell a visitor they are subscribed unless persistence confirms it.
- Prefer double opt-in. Email delivery must use the established server-side outbox/Resend pattern; never expose provider keys in client code.
- Until the sender domain and provider secrets are configured and delivery is verified, the UI must not falsely claim a confirmation email was sent.
- Do not automatically subscribe application contacts or institution users to marketing.

Newsletter content should be suitable for future announcements and blog digest campaigns. Full campaign management, unsubscribe flows and content-triggered delivery must be explicitly tested before being described as operational.

### G. Main footer
The footer must become a strong visual signature, not a thin generic strip.

- Use a full-width deep emerald/forest-green surface.
- Use a large but low-contrast Islamic geometric/architectural visual treatment.
- Include a dignified brand lockup with exact English brand names.
- Explain the SahiTech → SahiTech Education → MDI hierarchy.
- Provide compact navigation, public utility links, and contact/policy placeholders only where real URLs/content exist.
- Include language-aware layout and correct RTL ordering.
- Remove technical stack/version details from the footer.
- Use an accessible contrast ratio and avoid visual clutter.

## 4. Localization and translation acceptance criteria

Locales:
- Bengali: `bn`
- English: `en`
- Arabic: `ar`

For every public homepage component:
- All visible labels, helper text, button labels, placeholders, validation states, date labels, prayer names, newsletter responses, and shortcut labels must come from the active locale dictionary.
- No hard-coded Bengali or English prose should remain in localized public-page components.
- Protected brand strings remain exactly English in all locales.
- Switching language updates every visible region, not just the navigation.
- Locale preference persists and is applied on server render to avoid language flashes.
- Arabic switches the document to RTL; layout, icons, alignment, and mobile menus must respect RTL.
- Never silently fall back to Bengali for a missing English/Arabic key. Add complete keys and add an automated or manual missing-key check.
- Locale changes must not discard the user's current route or form context.

This specification governs the public-facing homepage/header/footer work. The broader dashboard and portal translation audit should be tracked separately and completed route-by-route; do not claim the entire application is fully translated until that audit passes.

## 5. Accessibility, responsiveness and performance

- Mobile-first layout from 360px wide and above.
- Semantic heading order, landmarks and button/link roles.
- Keyboard-operable navigation and forms; visible focus states.
- Proper labels and error associations for all form fields.
- Respect reduced-motion preferences; animation must be subtle and nonessential.
- Optimize hero image loading and use responsive image sizes.
- Lazy-load below-the-fold imagery.
- Avoid heavy client bundles for static marketing sections.
- Prayer countdown updates must not trigger repeated network requests; fetch daily schedule once and tick locally.
- Cache prayer-time data conservatively and provide a refresh/retry state.

## 6. Content and trust rules

- Remove public-facing technical badges such as “PostgreSQL 17”, “RLS Data Isolation”, database table counts, and framework/version information.
- Do not invent registered Madrasa, student, teacher, Sanad or adoption counts.
- Do not claim a module is fully operational just because a route, permission or database object exists.
- Distinguish product capabilities from features that are still in development.
- Avoid religious claims, religious rulings, or official endorsements unless approved and sourced.
- Respect the dignity and diversity of Qawmi and Alia institutions.

## 7. Implementation mapping

| Requirement | Primary files / systems |
|---|---|
| Design tokens and page-wide styling | `apps/web/src/app/globals.css` |
| Public header / language selector | `apps/web/src/components/Navbar.tsx` |
| Homepage structure and localized content | `apps/web/src/app/page.tsx` |
| Translation contract | `apps/web/src/lib/i18n/types.ts` |
| Bengali/English/Arabic dictionaries | `apps/web/src/lib/i18n/dictionaries/{bn,en,ar}.ts` |
| Locale cookie and server rendering | `apps/web/src/lib/i18n/index.tsx`, `server.ts`, `apps/web/src/app/layout.tsx` |
| Prayer time server endpoint | `apps/web/src/app/api/prayer-times/route.ts` |
| Prayer time display/countdown | `apps/web/src/components/home/PrayerTimesWidget.tsx` |
| Newsletter form / server action | `apps/web/src/components/home/NewsletterForm.tsx`, `apps/web/src/app/actions/newsletter.ts` |
| Newsletter persistence and token verification | new forward-only migration under `packages/database/migrations/` |
| Transactional email delivery | `supabase/functions/process-email-outbox/index.ts`, existing Resend setup documentation |
| Public site metadata | `apps/web/src/app/layout.tsx` |

## 8. Delivery sequence

1. Commit this design specification first.
2. Implement the public homepage, shared brand lockup, visual tokens and large Islamic footer against this specification.
3. Complete bn/en/ar copy for every homepage region and lock protected brand strings in English.
4. Implement prayer-time endpoint and localized widget with clear source/method limitations.
5. Implement consent-based newsletter subscription persistence and delivery integration without exposing secrets.
6. Run typecheck, lint and production build.
7. Review the diff and open a Pull Request; deploy only after build and production-safe review.
8. Verify the live site in bn, en and ar, including mobile layout, RTL, prayer data, newsletter persistence and footer.

## 9. Definition of done

- [ ] The public homepage no longer displays technical infrastructure badges or unverified metrics.
- [ ] A polished Islamic institutional visual language is consistent from header through footer.
- [ ] Brand hierarchy is clear and all protected brand names remain in English in bn/en/ar.
- [ ] Homepage content is complete in Bengali, English and Arabic.
- [ ] Changing locale changes every public homepage region.
- [ ] Arabic layout uses RTL correctly.
- [ ] Prayer times are fetched for the chosen city and show source/method context.
- [ ] The next-prayer indicator/countdown is calculated from fetched schedule without repeated requests.
- [ ] Newsletter form validates and records consent safely; no false delivery-success claim.
- [ ] Footer is visually substantial, localized and free of technology badges.
- [ ] Mobile, keyboard, contrast and reduced-motion checks pass.
- [ ] Automated checks and production build pass before merge/deployment.

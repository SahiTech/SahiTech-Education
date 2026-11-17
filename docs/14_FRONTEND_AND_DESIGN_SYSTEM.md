# 14. Frontend Architecture & Design System

**Program:** Madrasa Digitalization Initiative (MDI)  
**Parent brand:** SahiTech  
**Division:** SahiTech Education  
**Status:** Shared frontend standards; implementation details must be checked against current source

## 1. Frontend topology

The current web application is in `apps/web` and uses Next.js App Router, React, TypeScript and Tailwind CSS. Shared components currently live under `apps/web/src/components`; app-specific design and global CSS live under `apps/web/src/app`.

There is no separate `@sahitech/ui` workspace package in the reviewed repository. Do not import or document it as an existing package. Extract shared UI into a package only when reuse and release boundaries justify it, with an ADR and migration plan.

Keep public marketing pages, tenant workspace views and the restricted Global Platform Owner console as distinct experiences, while reusing appropriate primitives and design tokens.

## 2. Brand and visual tokens

The public MDI identity uses emerald, warm neutral surfaces and restrained amber accents. Align new work with the existing CSS variables in `apps/web/src/app/globals.css` and centralize tokens before adding new one-off values.

| Token | Current baseline | Intended use |
|---|---|---|
| `--brand-primary` | `#047857` | Primary action and active state |
| `--brand-dark` | `#064e3b` | Deep brand surface and contrast |
| `--brand-accent` | `#d97706` | Restrained highlight |
| `--background` | `#f8fafc` | Global base background |
| `--foreground` | `#0f172a` | Default foreground |

The public homepage currently also uses warm ivory surfaces and an emerald photographic hero. The full direction and section contract are documented in [Document 28](28_PUBLIC_WEBSITE_ISLAMIC_DESIGN_SPEC.md).

Rules:
- Emerald is the primary identity; amber/gold is a secondary accent.
- Avoid competing accent systems. Qawmi/Alia colors may be contextual labels, not separate brands.
- Use semantic tokens for surfaces, text, borders, focus and status colors.
- Do not assume color contrast; test each foreground/background pair for WCAG 2.2 AA.
- Avoid hard-coded raw color values in newly created shared components. Migrate existing values incrementally.

## 3. Typography and localization

Runtime locale dictionaries are TypeScript modules at `apps/web/src/lib/i18n/dictionaries/{bn,en,ar}.ts`. Locale type, dictionary keys and server/client resolution live alongside them in `apps/web/src/lib/i18n`.

- Bangla: readable Unicode Bengali font with correct conjuncts and vowel marks.
- English: clean sans-serif stack.
- Arabic: Arabic typeface with shaping and RTL correctness.
- Preserve line-height and natural wrapping across languages.
- Do not add font packages or bundle files without checking licensing, rendering and performance.
- All new user-facing text must be represented in all supported locales.

See [Document 15](15_LOCALIZATION_AND_RTL.md) for the locale contract.

## 4. Component and interaction standards

Use existing project conventions and dependencies. Do not claim that shadcn/ui, Radix UI, React Hook Form or Zod are installed unless current manifests and imports confirm them.

- Use semantic HTML and native controls where practical.
- Use reusable buttons, form fields, cards, dialogs, status indicators and page headers.
- Every control must have an explicit purpose, accessible name and working behavior.
- Forms need server-side validation; client validation is supplemental.
- Keep loading, empty, success, validation and error states explicit and localized.
- Confirm irreversible actions and explain consequences.
- Avoid hover-only content and inert decorative buttons.

## 5. Responsive data presentation

- Use readable tables on desktop and an accessible compact alternative on narrow screens.
- Avoid forcing fixed left/right columns when RTL or small screens make them unusable.
- Prefer responsive card/list transformations or a clearly labelled horizontal scroll region.
- Keep important identifiers available without relying on hover tooltips.
- Use CSS logical properties for spacing and positioning.

## 6. Accessibility and interaction

Target WCAG 2.2 AA:
- Semantic landmarks and correctly nested headings.
- Complete keyboard operation and visible focus state.
- Meaningful labels, descriptions and associated validation messages.
- Sufficient contrast, text resizing and reflow.
- Comfortable touch targets.
- Respect `prefers-reduced-motion`.
- Announce async validation and status changes to assistive technology.
- Ensure dialog focus management, escape behavior and return focus.

## 7. Performance

- Prefer server components for static/read-oriented content.
- Introduce client components only for interactions that require client state.
- Keep client bundles small; do not assert a bundle-size target as achieved without a current measured build artifact.
- Optimize image formats, dimensions, responsive sizes and loading priority.
- Avoid unnecessary dependencies, client-side data waterfalls and repeated queries.
- Use pagination/filtering for large data collections.
- Measure Core Web Vitals on realistic low-end Android/mobile conditions before setting public performance claims.

## 8. Verification matrix

For visual or component changes, inspect:
- Widths: 320, 360, 390, 768, 1024 and 1440 px.
- Locales: bn, en, ar.
- Direction: LTR and RTL.
- Input modes: keyboard, touch and screen-reader-friendly labels.
- States: loading, empty, error, validation, success, long content and slow network.

There is no browser E2E/viewport suite confirmed in the current workflow review. Add one before describing these checks as automated gates.

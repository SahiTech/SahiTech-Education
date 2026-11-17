# 15. Localization & RTL Architecture

**Supported locales:** `bn` (default), `en`, `ar`  
**Runtime source:** TypeScript dictionary modules under `apps/web/src/lib/i18n/dictionaries`

## 1. Current implementation

The inspected runtime imports dictionaries from:
- `apps/web/src/lib/i18n/dictionaries/bn.ts`
- `apps/web/src/lib/i18n/dictionaries/en.ts`
- `apps/web/src/lib/i18n/dictionaries/ar.ts`

The locale types, client provider and server resolvers live under `apps/web/src/lib/i18n`. The root layout resolves the locale and direction and renders them as the document `lang` and `dir` attributes. The selected locale is persisted using the `NEXT_LOCALE` cookie.

JSON locale files also exist under `apps/web/src/messages`, but the inspected i18n runtime imports the TypeScript dictionaries. Do not edit only the JSON files and assume the displayed application changes. Before changing the source-of-truth approach, search every import and add an ADR if the architecture changes.

## 2. Locale requirements

- Bangla (`bn`) is the default.
- English (`en`) is available for international users and reporting.
- Arabic (`ar`) must use right-to-left document direction and appropriate text shaping.
- All user-facing dictionary keys should exist across all locales.
- Protected brand strings remain in English: SahiTech, SahiTech Education, Madrasa Digitalization Initiative, MDI.
- Dates, numbers, currency, phone formats and academic terminology require explicit locale-aware formatting policies.

## 3. Dictionary quality and completeness

- Keep dictionary structure compatible with `Translations` types.
- Add new keys to all three locales in the same change.
- Avoid silent fallback that hides missing translations during development.
- Add an automated key-parity check or test when practical.
- Review long Bangla/Arabic labels, form validation, empty/loading/error states and metadata.
- Do not translate official names, identifiers, serials or brand terms unless the product owner approves a canonical translation.

## 4. RTL and bidirectional text

- Set `dir="rtl"` for Arabic and `dir="ltr"` for Bangla/English.
- Prefer CSS logical properties: `margin-inline`, `padding-inline`, `inset-inline`, `text-align: start/end`, and Tailwind logical/start-end utilities where supported.
- Avoid left/right-specific layout assumptions in reusable components.
- Mirror directional navigation icons where direction implies forward/back.
- Use `<bdi>` for mixed-direction tokens, names, Arabic text, phone numbers and identifiers where punctuation could reorder.
- Numbers, dates, Latin identifiers and QR/Sanad tokens need explicit direction isolation when necessary.

## 5. Persistence, rendering and hydration

- Server and client must agree on locale before initial render wherever possible.
- Avoid a flash of one locale followed by another during hydration.
- Validate cookie input against the supported locale union; never reflect arbitrary cookie values into document attributes.
- Locale switching must update document properties and persist safely.
- Metadata, alternate-language URLs and document direction should follow the selected route/locale strategy.

## 6. Verification

Test all visible routes and states in all locales:
- desktop, mobile and zoomed views;
- navigation and sidebar placement;
- forms, dialogs, tables, badges and empty/error states;
- long text and mixed Arabic/Bangla/English content;
- keyboard order and screen reader labels;
- date/number/currency display and copy/paste behavior.

The presence of dictionary modules and RTL CSS is source evidence only. Do not claim full application-wide translation or verified RTL quality until browser-based route coverage is completed.

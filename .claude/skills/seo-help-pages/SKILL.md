---
name: seo-help-pages
description: SEO and structured data (FAQPage / HowTo JSON-LD) for Zeffyr Music /help pages — adding a help page, the PAGE_META / HOWTO_STEPS / FAQ_DATA constants, and the SeoService JSON-LD API. Use when editing files under src/app/help.
---

# SEO for Help Pages

> How `/help` and `/help/:page` achieve rich results in Google.
> Read this before adding or modifying help pages.

## Why `/help/issues` gets rich results

Google displays rich results when it finds **complete** structured data:

- `FAQPage` needs `mainEntity[]` with `Question` + `Answer` objects
- `HowTo` needs `step[]` with `HowToStep` objects (name + text, optionally image)
- A bare `{ "@type": "HowTo", "name": "…" }` without `step[]` is **not eligible**

## Architecture

```
/help            → HelpComponent        → CollectionPage + BreadcrumbList + OG
/help/:page      → HelpPageComponent    → FAQPage | HowTo + BreadcrumbList + OG
```

All structured data is driven by **constants** in `help-page.component.ts`:

| Constant           | Purpose                                     |
| ------------------ | ------------------------------------------- |
| `PAGE_META`        | Title/description i18n keys + schema type   |
| `FAQ_DATA_BY_PAGE` | FAQ question/answer i18n keys per page      |
| `HOWTO_STEPS`      | HowTo step title/content i18n keys per page |
| `HOWTO_IMAGES`     | Optional hero image URL per page            |

## Adding a new help page

### 1. Add translation keys in `src/assets/i18n/fr.json` (and `en.json`)

```
"help_mypage_title": "Mon titre",
"help_mypage_description": "Ma description pour la meta",
"help_mypage_step_1_title": "Étape 1",
"help_mypage_step_1_content1": "Contenu...",
"help_mypage_step_1_content2": "Suite...",
"help_mypage_step_2_title": "Étape 2",
"help_mypage_step_2_content1": "..."
```

### 2. Register in `PAGE_META`

```typescript
// In help-page.component.ts
const PAGE_META = {
  // ...existing pages...
  'my-page': {
    title: 'help_mypage_title',
    description: 'help_mypage_description',
    schema: 'howto', // or 'faq'
  },
};
```

### 3. Add step data

**For HowTo pages** — add to `HOWTO_STEPS`:

```typescript
const HOWTO_STEPS = {
  // ...existing pages...
  'my-page': [
    ['help_mypage_step_1_title', 'help_mypage_step_1_content1', 'help_mypage_step_1_content2'],
    ['help_mypage_step_2_title', 'help_mypage_step_2_content1'],
  ],
};
```

Each entry is `[stepTitleKey, ...stepContentKeys]`. Content keys are joined with spaces for `step.text`.

If the page has screenshots, add to `HOWTO_IMAGES`:

```typescript
const HOWTO_IMAGES = {
  // ...existing pages...
  'my-page': 'assets/img/help/my_page_1.jpg',
};
```

**For FAQ pages** — add to `FAQ_DATA_BY_PAGE`:

```typescript
const FAQ_DATA_BY_PAGE = {
  // ...existing pages...
  'my-page': [
    ['help_mypage_q1_title', 'help_mypage_q1_answer1', 'help_mypage_q1_answer2'],
    ['help_mypage_q2_title', 'help_mypage_q2_answer1'],
  ],
};
```

Each entry is `[questionKey, ...answerKeys]`. Answer keys are joined with spaces for `acceptedAnswer.text`.

### 4. Add the template `@case` block

In `help-page.component.html`, add inside the `@switch (page)`:

```html
@case ('my-page') {
<h2>{{ 'help_mypage_title' | transloco }}</h2>
<section class="help-steps">
  <h3>{{ 'help_mypage_step_1_title' | transloco }}</h3>
  <ul>
    <li>{{ 'help_mypage_step_1_content1' | transloco }}</li>
  </ul>
</section>
}
```

### 5. Add the card in `help.component.html`

```html
<a
  [routerLink]="['/help', 'my-page']"
  class="help-card"
  [attr.aria-label]="'help_mypage_title' | transloco"
>
  <div class="help-card-icon" aria-hidden="true">
    <span class="material-icons">icon_name</span>
  </div>
  <p class="help-card-title">{{ 'help_mypage_title' | transloco }}</p>
</a>
```

### 6. Update `hasPart` in `help.component.ts`

Add `'my-page'` to the `hasPart` array in the CollectionPage JSON-LD.

### 7. Add tests

In `help-page.component.spec.ts`:

- Add the slug to the `it.each` title test
- Add a test verifying the correct schema type (FAQPage or HowTo with step[])

## Schema type guidelines

| Content type          | Schema  | Example pages                   |
| --------------------- | ------- | ------------------------------- |
| Step-by-step tutorial | `howto` | install-android, listen, export |
| Question & Answer     | `faq`   | issues, legal, download         |
| Neither (pure info)   | omit    | (none currently)                |

Prefer `faq` when the page title is a question ("Is it legal?", "Can I download?").

## SEO checklist for each help page

- [ ] `PAGE_META` entry with title, description, schema type
- [ ] Step data in `HOWTO_STEPS` or `FAQ_DATA_BY_PAGE`
- [ ] `@case` block in template
- [ ] Card in help index template
- [ ] Slug in `hasPart[]` array (help.component.ts)
- [ ] Title test in `it.each`
- [ ] Schema type test
- [ ] Validate with [Google Rich Results Test](https://search.google.com/test/rich-results)

## SeoService API

| Method                       | JSON-LD ID                   | Purpose                          |
| ---------------------------- | ---------------------------- | -------------------------------- |
| `setJsonLd(data)`            | `structured-data-json-ld`    | Main schema (FAQPage/HowTo/…)    |
| `setBreadcrumbJsonLd(items)` | `structured-data-breadcrumb` | BreadcrumbList (separate script) |
| `removeJsonLd()`             | both                         | Cleanup on ngOnDestroy           |

Both scripts coexist in `<head>` — this is recommended by Google.

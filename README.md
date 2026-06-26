# Acme Co. Content Site

A markdown-driven content site for Acme Co.'s marketing team. URLs map directly
to folders in `src/content/`, so the marketing team can publish new pages by
adding a folder with an `index.md` file &mdash; no code changes required.

For example, `src/content/about-page/index.md` is served at `/about-page`, and
`src/content/blog/june/company-update/index.md` is served at
`/blog/june/company-update`.

## Features

- **Folder-based content** &mdash; add a folder under `src/content/` with an
  `index.md`, push, and the page appears at the matching URL after the next
  deploy. The catch-all route renders on demand, so no per-page code or static
  generation is required.
- **Home page** &mdash; ships with a default branded landing page that lists
  every available page. Each entry shows the page's title (first markdown `#`
  heading) when one is present, and falls back to the folder path when it
  isn't. Marketing can override the landing page entirely by adding
  `src/content/index.md`, which is then served as the home page instead.
- **Titles when available** &mdash; a page's display title is taken from its
  first markdown H1 heading, falling back to the slug path so untitled pages
  still render and link sensibly.
- **Optional frontmatter** &mdash; an optional `---` YAML-style frontmatter
  block is validated and stripped before rendering. Malformed frontmatter is
  treated as a content error and surfaces a 500 page (see below).
- **404 and 500 handling** &mdash; unknown URLs render a friendly 404 page;
  content that exists but cannot be parsed (e.g. broken frontmatter) renders a
  500 error page via the route's error boundary, instead of leaking a stack
  trace.
- **Responsive design** &mdash; the layout adapts to mobile and desktop
  viewports.
- **Safe by default** &mdash; slug resolution guards against path traversal, so
  a crafted URL cannot read files outside `src/content/`.

## Why Next.js

- **React on the front end** to match Acme's other websites, as required.
- A single **catch-all route** (`/[...slug]`) maps any URL depth onto the
  content folder tree, so arbitrary nesting works with no per-page wiring.
- **Server-side rendering on demand** (`force-dynamic`) &mdash; pages are
  rendered at request time from the content on disk, so no per-page routes or
  static generation are needed. New content still requires a deploy to reach
  production (the markdown files are part of the deployment), but marketing can
  add folders without any application code changes.
- Built-in conventions for **error/`not-found` boundaries, metadata, and image
  optimization** keep the MVP small while staying production-grade.
- **First-class Vercel deployment** gives us a zero-config hosting target with
  a clean CI/CD story.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # ESLint (Next.js core-web-vitals + TypeScript rules)
npm test           # build, boot a production server, then run the suite
```

To add a page, create a folder under `src/content/` with an `index.md` file.
The URL mirrors the folder path (e.g. `src/content/blog/june/index.md` is
served at `/blog/june`). Locally, add the folder and refresh &mdash; no server
restart or code changes needed. In production, push to `main` and the gated
CI/CD pipeline deploys the new content.

## Testing

Tests live in `tests/` and run with [Vitest](https://vitest.dev/).

- **Unit tests** (`tests/content.test.ts`) cover the content library: slug
  resolution, frontmatter stripping, title extraction, and page listing.
- **Integration tests** (`tests/readme.test.ts`) boot a real production server
  against a temporary fixture content directory and assert that:
  - valid URLs return **200**,
  - the response body contains the HTML generated from the relevant
    `index.md`,
  - unknown URLs return **404**,
  - content that exists but cannot be parsed returns **500**.

The integration tests use their own temp fixtures (`CONTENT_DIR` is overridden
in `tests/global-setup.ts`), so they are **independent of the real
`src/content/` folders** and won't break as marketing changes content.

Because `npm test` performs a full `next build` and boots `next start` before
exercising the suite, it also validates that the app builds, type-checks, and
serves correctly.

## Linting

ESLint is configured via a flat config (`eslint.config.mjs`) using Next.js's
`core-web-vitals` and `typescript` rule sets. Run it locally with
`npm run lint`. It also runs in CI as part of the `test` job, so a lint failure
blocks the deploy.

## CI/CD

`.github/workflows/ci.yml` defines a **test-gated deployment pipeline**:

- **`test`** runs on every push to `main` and every pull request. It lints,
  then runs the full suite (which includes the production build).
- **`deploy`** runs only for pushes to `main`, and only after `test` succeeds
  (`needs: test`). It builds and deploys to production via the Vercel CLI.

This means **tests run automatically on every push to `main`, and a deploy only
happens if those tests pass**. The marketing team can push new content freely,
but a broken change blocks the deploy &mdash; production is only updated when
nothing is broken. Pull requests are tested but not deployed.

## Deployment (Vercel)

The app deploys to Vercel through the gated GitHub Actions pipeline above.
Vercel's native auto-deploy on `main` is disabled (see `vercel.json`) so
deployments happen exclusively through the test-gated workflow.

### Getting the live URL

Each successful deploy publishes its URL in the **`Deploy to Vercel
(production)`** job of the GitHub Actions run. Open the latest run on the
`main` branch, expand the **`Deploy prebuilt artifacts to Vercel`** step, and
use the **Production** URL it prints (for example,
`https://<project>-<hash>-<org>.vercel.app`).

> The deploy also "aliases" a stable-looking project URL, but on the free tier
> that alias still belongs to a Vercel-generated domain. A **custom static
> domain** (a fixed, branded URL that never changes between deploys) could be
> configured in the Vercel project settings, but that requires a paid plan, so
> for now the URL is read from the action output as described above.

### One-time setup

1. Push this repository to GitHub.
2. Create the Vercel project and link it locally:
   ```bash
   npm install --global vercel
   vercel link          # creates .vercel/project.json
   ```
3. Add three repository secrets in GitHub
   (**Settings &rarr; Secrets and variables &rarr; Actions**):
   - `VERCEL_TOKEN` &mdash; a [Vercel access token](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` &mdash; `orgId` from `.vercel/project.json`
   - `VERCEL_PROJECT_ID` &mdash; `projectId` from `.vercel/project.json`

From then on, every push to `main` runs the gated pipeline and deploys to
production when tests pass.

## Project structure

```
src/
  app/
    layout.tsx          # shared header/footer + site metadata
    page.tsx            # home page (default landing or content/index.md)
    [...slug]/page.tsx  # catch-all content route
    not-found.tsx       # 404 page
    error.tsx           # 500 / error boundary
    globals.css         # styles (responsive)
  content/              # marketing-owned markdown content
  lib/
    content.ts          # slug resolution, frontmatter, title extraction
tests/                  # unit + integration tests
eslint.config.mjs       # ESLint flat config (Next.js rules)
```

## Iterating from here

- Add richer frontmatter (e.g. SEO description, social image) and wire it into
  per-page `generateMetadata`.
- Add a sitemap and per-page `<title>` derived from the markdown heading.
- Introduce caching/ISR if content volume grows and on-demand rendering becomes
  a bottleneck.
- Configure a custom domain once a paid Vercel plan is available.
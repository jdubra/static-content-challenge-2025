# Static Content challenge

**NB: Please do not fork this repository, to avoid your solution being visible from this repository's GitHub page. Please clone this repository and submit your solution as a separate repository.**

Business Scenario: Acme Co's marketing department want a simple content management system and you've been tasked with building the MVP.

The challenge here is to create a full-stack JavaScript application that returns webpages at URLs that match the paths of the folders and sub-folders in the `content` folder. The content of these pages should come from a combination of the template HTML file and a markdown file containing the content.

For example, for a folder called `about-page`, a request to `/about-page` would return a HTML page created from the `template.html` template and the `about-page/index.md` content file. The `template.html` file contains a `{{content}}` placeholder that would be replaced by the content for each page. A request to `/blog/june/company-update` would return a HTML page using the content file at `blog/june/company-update/index.md`.

As a modern full-stack JavaScript app MVP, the application should use an effective mix of technologies, although there is a requirement to use React on the front-end to fit in with Acme Co's other websites.

Acme's marketing department should be able to add extra folders to the `content` folder and the application should work with those without any requiring any code changes.

This repository contains a `template.html` template file and a sample `content` folder with sub-folders containing `index.md` markdown files (or other sub-folders).

Your application may make use of open-source code libraries and other third-party tools. It is entirely up to you how the application performs the challenge. As the use of LLMs is widespread in software engineering, you are permitted to use AI as you wish.

## Testing

The application should be shipped with at minimum three tests, although your testing strategy should effectively test your application:

- one that verifies that requests to valid URLs return a 200 HTTP status code
- one that verifies that requests to valid URLs return a body that contains the HTML generated from the relevant `index.md` markdown file
- one that verifies that requests to URLs that do not match content folders return a 404 HTTP status code
- NB: the tests should not depend on the existing sub-folders in the `content` folder, so the tests do not break as the content changes

## Bonus credit

**NB: This is only relevant if completing this task in your own time, i.e. NOT in a pairing interview**

In this MVP sprint, there are several opportunities to deliver nice-to-have tickets. The marketing team recognise that in a post-LLM world sprint velocity may be higher.

- The generated HTML page should be styled in a pleasing way
- The MVP's GitHub repository should be configured for hosting on a cloud hosting service, and include a link to a live deployment
- The repository should include documentation describing how to both use the application and how to iterate it from here
- Overall, you should do everything you think is necessary to make this application MVP production-ready

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # build + boot a production server, then run the test suite
```

Add content by creating a folder under `src/content/` with an `index.md`
file. The URL mirrors the folder path (e.g. `src/content/blog/june/index.md`
is served at `/blog/june`). No code change is required.

## Deployment (Vercel)

The app deploys to Vercel through a **test-gated pipeline**: on every push to
`main`, GitHub Actions runs the full test suite first and only deploys to
production if it passes. Vercel's native auto-deploy on `main` is disabled (see
`vercel.json`) so deployments happen exclusively through this gated workflow.

**Live deployment:** _<add your Vercel URL here once connected>_

### One-time setup

1. Push this repository to GitHub.
2. Create the Vercel project and link it locally:
   ```bash
   npm install --global vercel
   vercel link          # creates .vercel/project.json
   ```
3. Read the project/org IDs from `.vercel/project.json` and create a
   [Vercel access token](https://vercel.com/account/tokens), then add three
   repository secrets in GitHub (**Settings → Secrets and variables → Actions**):
   - `VERCEL_TOKEN` — the access token
   - `VERCEL_ORG_ID` — `orgId` from `.vercel/project.json`
   - `VERCEL_PROJECT_ID` — `projectId` from `.vercel/project.json`

From then on, the `deploy` job in `.github/workflows/ci.yml` builds and ships
to production via the Vercel CLI, but only after the `test` job succeeds.

### How content is served in production

The content routes read `src/content/**/index.md` at request time using
**dynamic** file paths, which Next.js's output file tracing cannot detect
statically. Without help, those markdown files would not be bundled into the
serverless functions and every content page would 404 in production.

`next.config.ts` fixes this via `outputFileTracingIncludes`, which forces the
markdown files into the function bundles for the `/` and `/[...slug]` routes.
Because the content lives in the repo, adding or editing a page is a normal
git push, which both ships the new content and triggers the redeploy.

### CI/CD pipeline

`.github/workflows/ci.yml` defines two jobs:

- **`test`** — runs on every push to `main` and every pull request. It runs
  `npm test`, which produces a production build and boots `next start` before
  exercising the suite, so it validates the build, type-checks, and runtime
  behaviour together.
- **`deploy`** — runs only for pushes to `main`, and only after `test`
  succeeds (`needs: test`). It builds and deploys to production via the Vercel
  CLI. Because deploys depend on the test job, a failing test blocks the
  deployment.

Pull requests run the `test` job only — they are validated but not deployed.

// Shared between the global setup (which writes these into a temp content dir)
// and the tests (which assert against them). Deliberately independent of the
// real src/content sub-folders, per the README requirement.

export const PORT = 3456;
export const BASE_URL = `http://localhost:${PORT}`;

export interface Fixture {
  slug: string;
  markdown: string;
  /** A snippet of HTML that should appear in the rendered page. */
  expectedHtml: string;
}

export const FIXTURES: Fixture[] = [
  {
    slug: "test-page",
    markdown: "# Test Page Heading\n\nFixture body for the test page.\n",
    expectedHtml: "<h1>Test Page Heading</h1>",
  },
  {
    slug: "nested/deep/page",
    markdown: "# Nested Heading\n\nNested fixture body lives here.\n",
    expectedHtml: "<h1>Nested Heading</h1>",
  },
];

export interface InvalidFixture {
  slug: string;
  /** Markdown that exists on disk but cannot be parsed, so the route 500s. */
  markdown: string;
}

// Files that exist (so the route is NOT a 404) but throw during parsing, which
// the route's error boundary surfaces as a 500.
export const INVALID_FIXTURES: InvalidFixture[] = [
  {
    slug: "invalid/missing-closing-delimiter",
    markdown: "---\ntitle: Broken\n\n# Body with no closing delimiter\n",
  },
  {
    slug: "invalid/bad-frontmatter-line",
    markdown:
      "---\ntitle: Broken\nthis line has no colon so it is invalid\n---\n\n# Body\n",
  },
];

export const MISSING_SLUG = "this/path/definitely/does/not/exist";

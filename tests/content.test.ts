import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// content.ts reads CONTENT_DIR once at import time, so the env var must be set
// and the module dynamically imported only after the temp fixture dir exists.
type ContentModule = typeof import("../src/lib/content");

let contentDir: string;
let mod: ContentModule;

async function writePage(slug: string[], markdown: string): Promise<void> {
  const dir = path.join(contentDir, ...slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.md"), markdown, "utf8");
}

beforeAll(async () => {
  contentDir = await fs.mkdtemp(path.join(os.tmpdir(), "scc-unit-"));
  process.env.CONTENT_DIR = contentDir;

  await writePage(["docs", "intro"], "# Intro Heading\n\nWelcome.\n");
  await writePage(
    ["with-frontmatter"],
    "---\ntitle: Hello\nauthor: Acme\n---\n\n# Body Heading\n\nBody text.\n",
  );
  await writePage(
    ["broken"],
    "---\ntitle: ok\nnope no colon here\n---\n\n# Broken\n",
  );
  await writePage(["unterminated"], "---\ntitle: ok\n\n# Never closed\n");
  await writePage(["nested", "no-title"], "Just a paragraph, no heading.\n");

  mod = await import("../src/lib/content");
});

afterAll(async () => {
  await fs.rm(contentDir, { recursive: true, force: true });
});

describe("stripFrontmatter", () => {
  it("returns the input unchanged when there is no frontmatter block", () => {
    const raw = "# Title\n\nNo frontmatter here.\n";
    expect(mod.stripFrontmatter(raw)).toBe(raw);
  });

  it("strips a valid frontmatter block", () => {
    const raw = "---\ntitle: Hi\nauthor: Acme\n---\n\n# Body\n";
    expect(mod.stripFrontmatter(raw)).toBe("\n# Body\n");
  });

  it("allows blank lines inside the frontmatter block", () => {
    const raw = "---\ntitle: Hi\n\nauthor: Acme\n---\nBody\n";
    expect(mod.stripFrontmatter(raw)).toBe("Body\n");
  });

  it("throws when the closing delimiter is missing", () => {
    expect(() => mod.stripFrontmatter("---\ntitle: Hi\n\n# Body\n")).toThrow(
      /missing closing/i,
    );
  });

  it("throws when a line is not a key: value pair", () => {
    expect(() =>
      mod.stripFrontmatter("---\ntitle: Hi\nnope\n---\nBody\n"),
    ).toThrow(/expected "key: value"/i);
  });
});

describe("extractTitle", () => {
  it("returns the first H1 heading", () => {
    expect(mod.extractTitle("# Hello World\n\nbody")).toBe("Hello World");
  });

  it("trims surrounding whitespace from the heading", () => {
    expect(mod.extractTitle("#   Spaced Title   \n")).toBe("Spaced Title");
  });

  it("returns the first H1 when several headings exist", () => {
    expect(mod.extractTitle("## sub\n# Main\n# Other")).toBe("Main");
  });

  it("returns null when there is no H1", () => {
    expect(mod.extractTitle("## Only an h2\n\ntext")).toBeNull();
  });
});

describe("resolveContentFile", () => {
  it("resolves a slug to its index.md inside the content dir", () => {
    expect(mod.resolveContentFile(["docs", "intro"])).toBe(
      path.join(contentDir, "docs", "intro", "index.md"),
    );
  });

  it("returns null for a slug that escapes the content dir via ..", () => {
    expect(mod.resolveContentFile(["..", "..", "etc"])).toBeNull();
  });
});

describe("getPageMarkdown", () => {
  it("returns the markdown body for an existing file", async () => {
    expect(await mod.getPageMarkdown(["docs", "intro"])).toBe(
      "# Intro Heading\n\nWelcome.\n",
    );
  });

  it("strips frontmatter from the returned markdown", async () => {
    const md = await mod.getPageMarkdown(["with-frontmatter"]);
    expect(md).toBe("\n# Body Heading\n\nBody text.\n");
    expect(md).not.toContain("title: Hello");
  });

  it("returns null when the file does not exist", async () => {
    expect(await mod.getPageMarkdown(["does", "not", "exist"])).toBeNull();
  });

  it("returns null when the slug escapes the content dir", async () => {
    expect(await mod.getPageMarkdown(["..", "secret"])).toBeNull();
  });

  it("throws for a file with a malformed frontmatter line", async () => {
    await expect(mod.getPageMarkdown(["broken"])).rejects.toThrow(
      /expected "key: value"/i,
    );
  });

  it("throws for a file with an unterminated frontmatter block", async () => {
    await expect(mod.getPageMarkdown(["unterminated"])).rejects.toThrow(
      /missing closing/i,
    );
  });
});

describe("listPages", () => {
  it("lists slugs with titles, falling back to the slug path without an H1", async () => {
    const pages = await mod.listPages();
    const titleBySlug = Object.fromEntries(
      pages.map((p) => [p.slug.join("/"), p.title]),
    );

    expect(titleBySlug["docs/intro"]).toBe("Intro Heading");
    expect(titleBySlug["with-frontmatter"]).toBe("Body Heading");
    expect(titleBySlug["nested/no-title"]).toBe("nested / no-title");
  });

  it("returns the pages sorted by slug path", async () => {
    const slugs = (await mod.listPages()).map((p) => p.slug.join("/"));
    expect(slugs).toEqual(
      [...slugs].sort((a, b) => a.localeCompare(b)),
    );
  });
});

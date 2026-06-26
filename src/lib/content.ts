import { promises as fs } from "node:fs";
import path from "node:path";

// Resolvable via CONTENT_DIR so tests can point at a temp fixture folder
// instead of depending on the real src/content sub-folders.
export const CONTENT_DIR = process.env.CONTENT_DIR
  ? path.resolve(process.env.CONTENT_DIR)
  : path.join(process.cwd(), "src", "content");

/**
 * Resolve a URL slug (e.g. ["blog", "june", "company-update"]) to the absolute
 * path of its index.md, guarding against path traversal outside CONTENT_DIR.
 * Returns null if the slug escapes the content directory.
 */
export const resolveContentFile = (slug: string[]): string | null => {
  const target = path.join(CONTENT_DIR, ...slug, "index.md");
  const relative = path.relative(CONTENT_DIR, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return target;
}

/**
 * Validate and strip an optional `---` frontmatter block from the document.
 *
 * Markdown itself is extremely permissive, so a malformed frontmatter block is
 * one of the few ways a content file can be genuinely "incorrectly formatted".
 * Throws when a block is opened with `---` but is missing its closing `---`, or
 * when a line inside the block is not a `key: value` pair. Documents without a
 * leading `---` are returned unchanged.
 */
export const stripFrontmatter = (raw: string): string => {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    return raw;
  }

  const closingIndex = lines.findIndex(
    (line, i) => i > 0 && line.trim() === "---",
  );
  if (closingIndex === -1) {
    throw new Error("Malformed frontmatter: missing closing '---' delimiter.");
  }

  for (let i = 1; i < closingIndex; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    if (!/^[A-Za-z0-9_-]+\s*:\s*.*$/.test(line)) {
      throw new Error(
        `Malformed frontmatter: expected "key: value" but got "${lines[i]}".`,
      );
    }
  }

  return lines.slice(closingIndex + 1).join("\n");
}

/**
 * Read the markdown for a given slug.
 *
 * Returns null only when the page genuinely does not exist (so callers can
 * render a 404). If the file exists but cannot be read or parsed (e.g. a
 * malformed markdown file, permission issue, or other I/O failure), the error
 * is rethrown so the route's error boundary can surface a 500 page instead.
 */
export const getPageMarkdown = async (slug: string[]): Promise<string | null> => {
  const filePath = resolveContentFile(slug);
  if (!filePath) return null;

  let markdown: string;
  try {
    markdown = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }

  return stripFrontmatter(markdown);
}

export interface PageInfo {
  slug: string[];
  /** First markdown H1 heading, falling back to the slug path. */
  title: string;
}

/**
 * Extract the first markdown H1 (`# Heading`) from a document.
 * Returns null when the document has no top-level heading.
 */
export const extractTitle = (markdown: string): string | null => {
  const match = markdown.match(/^#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

/**
 * Recursively list every slug under CONTENT_DIR that has an index.md,
 * along with a display title (markdown H1 if present, else the slug path).
 * Used for the home page index and for generating links.
 */
export const listPages = async (): Promise<PageInfo[]> => {
  const pages: PageInfo[] = [];

  async function walk(dir: string, slug: string[]): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    const hasIndex = entries.some((e) => e.isFile() && e.name === "index.md");
    if (hasIndex && slug.length > 0) {
      const fallback = slug.join(" / ");
      let title = fallback;
      try {
        const markdown = await fs.readFile(
          path.join(dir, "index.md"),
          "utf8",
        );
        title = extractTitle(markdown) ?? fallback;
      } catch {
        // keep the fallback path title
      }
      pages.push({ slug, title });
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await walk(path.join(dir, entry.name), [...slug, entry.name]);
      }
    }
  }

  await walk(CONTENT_DIR, []);
  return pages.sort((a, b) =>
    a.slug.join("/").localeCompare(b.slug.join("/")),
  );
}

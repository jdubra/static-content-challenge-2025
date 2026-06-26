import { describe, it, expect } from "vitest";
import {
  BASE_URL,
  FIXTURES,
  INVALID_FIXTURES,
  MISSING_SLUG,
} from "./fixtures";

describe("README requirements", () => {
  it("returns a 200 status code for valid URLs", async () => {
    for (const fixture of FIXTURES) {
      const res = await fetch(`${BASE_URL}/${fixture.slug}`);
      expect(res.status).toBe(200);
    }
  });

  it("returns a body containing the HTML generated from the index.md", async () => {
    for (const fixture of FIXTURES) {
      const res = await fetch(`${BASE_URL}/${fixture.slug}`);
      const body = await res.text();
      expect(body).toContain(fixture.expectedHtml);
    }
  });

  it("returns a 404 status code for URLs that do not match content folders", async () => {
    const res = await fetch(`${BASE_URL}/${MISSING_SLUG}`);
    expect(res.status).toBe(404);
  });

  it("returns a 500 status code for content files that exist but cannot be parsed", async () => {
    for (const fixture of INVALID_FIXTURES) {
      const res = await fetch(`${BASE_URL}/${fixture.slug}`);
      expect(res.status).toBe(500);
    }
  });
});

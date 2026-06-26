import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { spawn, type ChildProcess } from "node:child_process";

import { BASE_URL, PORT, FIXTURES, INVALID_FIXTURES } from "./fixtures";

const execFileAsync = promisify(execFile);
const TEST_DIST_DIR = ".next-test";

let server: ChildProcess | undefined;

async function writeFixtures(contentDir: string): Promise<void> {
  const all = [...FIXTURES, ...INVALID_FIXTURES];
  for (const fixture of all) {
    const dir = path.join(contentDir, ...fixture.slug.split("/"));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.md"), fixture.markdown, "utf8");
  }
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status > 0) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Test server did not become ready within ${timeoutMs}ms`);
}

export async function setup(): Promise<() => Promise<void>> {
  const contentDir = await fs.mkdtemp(path.join(os.tmpdir(), "scc-content-"));
  await writeFixtures(contentDir);

  const env = {
    ...process.env,
    CONTENT_DIR: contentDir,
    NEXT_DIST_DIR: TEST_DIST_DIR,
  };

  // Production start avoids Next.js's single dev-server lock.
  await execFileAsync("npx", ["next", "build"], {
    cwd: process.cwd(),
    env,
  });

  server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
    detached: true,
  });

  await waitForServer(BASE_URL);

  return async () => {
    if (server?.pid) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        server.kill("SIGTERM");
      }
    }
    await fs.rm(contentDir, { recursive: true, force: true });
    await fs.rm(path.join(process.cwd(), TEST_DIST_DIR), {
      recursive: true,
      force: true,
    });
  };
}

import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stagingRoot = mkdtempSync(join(tmpdir(), "portfolio-pages-"));
const outputPath = join(projectRoot, "github-pages-output");
const omittedPaths = new Set([
  "src/app/api",
  "src/app/u",
  "src/app/aff-configs",
  "src/app/url-shortener",
  "src/app/ui/url-shortener",
  "src/app/untuk-nia",
  "public/untuk-nia",
]);

try {
  if (existsSync(outputPath)) {
    throw new Error("github-pages-output already exists; refusing to overwrite it.");
  }

  cpSync(projectRoot, stagingRoot, {
    recursive: true,
    filter(source) {
      const path = relative(projectRoot, source).split(sep).join("/");
      if (!path) return true;
      if ([".git", ".next", "out", "github-pages-output"].includes(path)) return false;
      if (path.startsWith(".env")) return false;
      return ![...omittedPaths].some((omitted) => path === omitted || path.startsWith(`${omitted}/`));
    },
  });

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const basePath = repositoryName ? `/${repositoryName}` : "";
  const result = spawnSync(
    process.execPath,
    [join(stagingRoot, "node_modules", "next", "dist", "bin", "next"), "build", "--webpack"],
    {
      cwd: stagingRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        GITHUB_PAGES: "true",
        NEXT_PUBLIC_BASE_PATH: basePath,
      },
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
  else cpSync(join(stagingRoot, "out"), outputPath, { recursive: true });
} finally {
  rmSync(stagingRoot, { recursive: true, force: true });
}
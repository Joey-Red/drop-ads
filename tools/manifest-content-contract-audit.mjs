import { readFile, stat } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { CANONICAL_CONTENT_SCRIPTS, CANONICAL_CONTENT_SCRIPT_FILES } from "./manifest-content-contract.mjs";

const root = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(root, "src");
const violations = [];

if (CANONICAL_CONTENT_SCRIPTS.length !== 2) violations.push("canonical content contract must contain exactly two groups");
if (new Set(CANONICAL_CONTENT_SCRIPT_FILES).size !== CANONICAL_CONTENT_SCRIPT_FILES.length) violations.push("canonical content scripts must be unique");

for (const file of CANONICAL_CONTENT_SCRIPT_FILES) {
  if (typeof file !== "string" || !file.endsWith(".js") || file.startsWith("/") || file.includes("\\") || file.includes(":") || file.split("/").includes("..")) {
    violations.push(`invalid local content-script path: ${String(file)}`);
    continue;
  }
  const path = resolve(sourceRoot, file);
  const rel = relative(sourceRoot, path);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`)) {
    violations.push(`content-script path escapes src: ${file}`);
    continue;
  }
  try {
    const info = await stat(path);
    if (!info.isFile()) violations.push(`content-script path is not a regular file: ${file}`);
  } catch {
    violations.push(`content-script file is missing: ${file}`);
  }
}

for (const browser of ["chromium", "firefox"]) {
  const manifest = JSON.parse(await readFile(resolve(root, `manifests/${browser}.json`), "utf8"));
  if (JSON.stringify(manifest.content_scripts) !== JSON.stringify(CANONICAL_CONTENT_SCRIPTS)) {
    violations.push(`${browser}: content_scripts differ from canonical contract`);
  }
}

if (violations.length) {
  console.error("Manifest content contract audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Manifest content contract audit passed: canonical local script paths and both browser manifests are exact.");
}

import { lstat, readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { RELEASE_TOOL_PATHS } from "./release-tool-contract.mjs";

const REQUIRED_RELEASE_TOOLS = Object.freeze([
  "tools/artifact-audit.mjs",
  "tools/atomic-output-temp.mjs",
  "tools/build-output-verify.mjs",
  "tools/deterministic-zip.mjs",
  "tools/package.mjs",
  "tools/release-archive-contract.mjs",
  "tools/release-manifest.mjs",
  "tools/release-output-io.mjs",
  "tools/release-package-identity.mjs",
  "tools/verify-release.mjs",
  "tools/verify-reproducible.mjs",
  "tools/zip-verify.mjs"
]);

function canonicalToolPath(path) {
  if (typeof path !== "string" || !path || path.length > 256 || isAbsolute(path) || path.includes("\\") || path.includes("\0")) {
    throw new TypeError("release tool contract contains a non-canonical/non-local path");
  }
  const parts = path.split("/");
  if (parts.some((part) => !part || part === "." || part === "..") || parts[0] !== "tools" || !path.endsWith(".mjs")) {
    throw new TypeError("release tool contract contains a non-canonical/non-local path");
  }
  return path;
}

export async function auditReleaseToolContract(rootDirectory) {
  const root = resolve(rootDirectory);
  const seen = new Set();
  for (const rawPath of RELEASE_TOOL_PATHS) {
    const path = canonicalToolPath(rawPath);
    if (seen.has(path)) throw new TypeError(`release tool contract contains duplicate path: ${path}`);
    seen.add(path);
    const absolute = resolve(root, path);
    const child = relative(root, absolute);
    if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) {
      throw new TypeError("release tool contract path escapes repository");
    }
    const stat = await lstat(absolute);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new TypeError(`release tool must be a regular non-symlink file: ${path}`);
  }

  for (const required of REQUIRED_RELEASE_TOOLS) {
    if (!seen.has(required)) throw new Error(`reviewed release tool is missing from provenance contract: ${required}`);
  }

  const manifestSource = await readFile(resolve(root, "tools/release-manifest.mjs"), "utf8");
  if (!manifestSource.includes('import { RELEASE_TOOL_PATHS } from "./release-tool-contract.mjs";') ||
      !manifestSource.includes("export const PACKAGING_TOOL_PATHS = RELEASE_TOOL_PATHS;")) {
    throw new Error("release manifest is not bound to canonical release tool provenance");
  }

  return Object.freeze({ tools: Object.freeze([...seen].sort()) });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const root = resolve(import.meta.dirname, "..");
  const result = await auditReleaseToolContract(root);
  console.log(`Release tool contract audit passed (${result.tools.length} tools)`);
}

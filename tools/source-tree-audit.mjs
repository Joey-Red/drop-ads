import { lstat, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const SOURCE_TREE_ROOTS = Object.freeze(["src", "lists", "manifests", "tools"]);
export const SOURCE_TREE_FILES = Object.freeze([".gitattributes", "package.json", "package-lock.json"]);

export function validateSourceEntry(path, type) {
  if (type === "directory" || type === "file") return null;
  return `${path}: ${type || "unknown"} filesystem entry is forbidden in release inputs`;
}

function direntType(entry) {
  if (entry.isSymbolicLink()) return "symlink";
  if (entry.isDirectory()) return "directory";
  if (entry.isFile()) return "file";
  if (entry.isSocket?.()) return "socket";
  if (entry.isFIFO?.()) return "fifo";
  if (entry.isBlockDevice?.()) return "block-device";
  if (entry.isCharacterDevice?.()) return "character-device";
  return "unknown";
}

function statType(stat) {
  if (stat.isSymbolicLink()) return "symlink";
  if (stat.isDirectory()) return "directory";
  if (stat.isFile()) return "file";
  if (stat.isSocket?.()) return "socket";
  if (stat.isFIFO?.()) return "fifo";
  if (stat.isBlockDevice?.()) return "block-device";
  if (stat.isCharacterDevice?.()) return "character-device";
  return "unknown";
}

function repoPath(root, path) {
  return relative(root, path).split(sep).join("/");
}

export async function auditSourceTree(rootDirectory) {
  const root = resolve(rootDirectory);
  const violations = [];
  let regularFiles = 0;

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const path = join(directory, entry.name);
      const type = direntType(entry);
      const display = repoPath(root, path);
      const violation = validateSourceEntry(display, type);
      if (violation) violations.push(violation);
      if (type === "directory") await walk(path);
      else if (type === "file") regularFiles += 1;
    }
  }

  for (const name of SOURCE_TREE_ROOTS) {
    const path = resolve(root, name);
    const type = statType(await lstat(path));
    if (type !== "directory") {
      violations.push(`${name}: required source root must be a real directory, found ${type}`);
      continue;
    }
    await walk(path);
  }

  for (const name of SOURCE_TREE_FILES) {
    const path = resolve(root, name);
    const type = statType(await lstat(path));
    if (type !== "file") violations.push(`${name}: required top-level release input must be a regular file, found ${type}`);
    else regularFiles += 1;
  }

  if (violations.length) throw new Error(`Source tree audit failed:\n${violations.map((item) => `- ${item}`).join("\n")}`);
  return Object.freeze({ regularFiles });
}

function isMainModule(moduleUrl, argvPath) {
  if (!argvPath) return false;
  try { return moduleUrl === pathToFileURL(resolve(argvPath)).href; }
  catch { return false; }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const root = resolve(import.meta.dirname, "..");
  auditSourceTree(root)
    .then((result) => console.log(`Source tree audit passed (${result.regularFiles} regular release-input files).`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}

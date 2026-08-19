import { readdir, lstat } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  COMMON_GENERATED_EXTENSION_FILES,
  generatedExtensionFilesForBrowser
} from "./generated-extension-contract.mjs";

const GENERATED_ONLY = new Set(["build-info.json", "manifest.json"]);
const LIST_FILES = Object.freeze(["lists/default.meta.json", "lists/default.txt"]);

function normalize(path) { return path.split(sep).join("/"); }
function isCanonicalLocalPath(path) {
  return typeof path === "string" && path.length > 0 && path === normalize(path) &&
    !path.startsWith("/") && !path.startsWith("./") && !path.includes("\\") &&
    !path.split("/").includes("..") && !/^[a-z][a-z0-9+.-]*:/i.test(path);
}

async function collectRegularFiles(root, directory) {
  const files = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const absolute = join(current, entry.name);
      const path = normalize(relative(root, absolute));
      if (entry.isSymbolicLink()) throw new Error(`${path}: symbolic links are forbidden in generated-contract release inputs`);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile()) files.push(path);
      else throw new Error(`${path}: non-regular generated-contract release input is forbidden`);
    }
  }
  await walk(directory);
  return files.sort();
}

function same(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

export async function auditGeneratedExtensionContract(rootDirectory) {
  const root = resolve(rootDirectory);
  const violations = [];
  const chromium = generatedExtensionFilesForBrowser("chromium");
  const firefox = generatedExtensionFilesForBrowser("firefox");

  for (const [browser, files] of [["chromium", chromium], ["firefox", firefox]]) {
    if (new Set(files).size !== files.length) violations.push(`${browser}: generated extension contract contains duplicate paths`);
    for (const path of files) if (!isCanonicalLocalPath(path)) violations.push(`${browser}: non-canonical/non-local generated path: ${path}`);
  }

  if (!same(chromium, COMMON_GENERATED_EXTENSION_FILES)) violations.push("chromium: contract must equal the common generated file set exactly");
  const firefoxOnly = firefox.filter((path) => !chromium.includes(path));
  if (!same(firefoxOnly, ["rules/static.json"])) violations.push("firefox: rules/static.json must remain the only browser-only generated file");

  const srcFiles = await collectRegularFiles(root, resolve(root, "src"));
  const contractedSourceFiles = firefox
    .filter((path) => !GENERATED_ONLY.has(path) && !LIST_FILES.includes(path))
    .map((path) => `src/${path}`);
  if (!same(srcFiles, contractedSourceFiles)) {
    const sourceSet = new Set(srcFiles);
    const contractSet = new Set(contractedSourceFiles);
    for (const path of srcFiles) if (!contractSet.has(path)) violations.push(`${path}: source file is not present in generated extension contract`);
    for (const path of contractedSourceFiles) if (!sourceSet.has(path)) violations.push(`${path}: generated extension contract references a missing source file`);
  }

  const listsStat = await lstat(resolve(root, "lists"));
  if (!listsStat.isDirectory() || listsStat.isSymbolicLink()) violations.push("lists: release list input must remain a real directory");
  else {
    const listFiles = await collectRegularFiles(root, resolve(root, "lists"));
    if (!same(listFiles, LIST_FILES)) violations.push(`lists: release list inputs changed; expected exactly ${LIST_FILES.join(", ")}`);
  }

  if (violations.length) throw new Error(`Generated extension contract audit failed:\n${violations.map((value) => `- ${value}`).join("\n")}`);
  return Object.freeze({ sourceFiles: srcFiles.length, chromiumFiles: chromium.length, firefoxFiles: firefox.length });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "..");
  auditGeneratedExtensionContract(root)
    .then((result) => console.log(`Generated extension contract audit passed: ${result.sourceFiles} source files map exactly to ${result.chromiumFiles}/${result.firefoxFiles} Chromium/Firefox generated files.`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}

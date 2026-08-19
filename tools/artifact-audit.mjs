import { lstat, opendir } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  COMMON_GENERATED_EXTENSION_FILES,
  generatedExtensionFilesForBrowser
} from "./generated-extension-contract.mjs";

// Compatibility exports remain available to older focused regressions while the
// canonical source of truth lives in generated-extension-contract.mjs.
export const COMMON_ALLOWED_FILES = COMMON_GENERATED_EXTENSION_FILES;
export const BROWSER_ONLY_ALLOWED_FILES = Object.freeze({
  chromium: Object.freeze([]),
  firefox: Object.freeze(["rules/static.json"])
});

export const MAX_GENERATED_TREE_ENTRIES = 4096;
export const MAX_GENERATED_TREE_DIRECTORIES = 4096;
export const MAX_GENERATED_TREE_DIRECTORY_ENTRIES = 4096;
export const MAX_GENERATED_TREE_ALLOWLIST_FILES = 4096;
export const MAX_GENERATED_TREE_PATH_BYTES = 1024;
export const MAX_GENERATED_TREE_VIOLATIONS = 128;

const GENERATED_TREE_BROWSERS = Object.freeze(["chromium", "firefox"]);
const REPOSITORY_ONLY_ROOTS = /^(?:tools|tests|docs|\.github|coverage|tmp|temp|qualification|fixtures?)(?:\/|$)/i;
const SENSITIVE_FILE = /(?:^|\/)(?:\.env(?:\..*)?|id_rsa|credentials?(?:\..*)?|secrets?(?:\..*)?)$|(?:\.map|\.pem|\.key|\.p12|\.pfx|\.crt|\.cer|\.log|\.sqlite3?|\.db|\.swp|\.swo|\.bak|\.tmp|\.zip|\.xpi|\.tar|\.tgz|\.gz|\.7z|~)$/i;
const GENERATED_PATH_CONTROL_TEXT = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/u;
const STRING_IS_WELL_FORMED = String.prototype.isWellFormed;
const STRING_NORMALIZE = String.prototype.normalize;

export function compareGeneratedPathCodeUnits(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function sortedGeneratedPathMembershipHas(sortedPaths, value) {
  let low = 0;
  let high = sortedPaths.length - 1;
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const comparison = compareGeneratedPathCodeUnits(sortedPaths[middle], value);
    if (comparison === 0) return true;
    if (comparison < 0) low = middle + 1;
    else high = middle - 1;
  }
  return false;
}

function assertGeneratedTreeBrowser(browser) {
  if (browser !== "chromium" && browser !== "firefox") {
    throw new TypeError("Generated tree browser must be exact chromium or firefox");
  }
  return browser;
}

function snapshotGeneratedDirectoryIdentity(stats, browser) {
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new TypeError(`${browser} generated extension directory must remain a real non-symlink directory`);
  }
  return Object.freeze({
    dev: stats.dev,
    ino: stats.ino,
    size: stats.size,
    mtimeMs: stats.mtimeMs,
    ctimeMs: stats.ctimeMs
  });
}

function assertGeneratedDirectoryIdentityUnchanged(before, after, browser) {
  const current = snapshotGeneratedDirectoryIdentity(after, browser);
  for (const key of ["dev", "ino", "size", "mtimeMs", "ctimeMs"]) {
    if (current[key] !== before[key]) {
      throw new Error(`${browser} generated extension directory changed during enumeration`);
    }
  }
}

function assertGeneratedSubtreeDirectoryIdentityUnchanged(before, after, browser) {
  const current = snapshotGeneratedDirectoryIdentity(after, browser);
  for (const key of ["dev", "ino", "size", "mtimeMs", "ctimeMs"]) {
    if (current[key] !== before[key]) {
      throw new Error(`${browser} generated extension directory changed during subtree traversal`);
    }
  }
}

function assertGeneratedRootIdentityUnchanged(before, after, browser) {
  const current = snapshotGeneratedDirectoryIdentity(after, browser);
  for (const key of ["dev", "ino", "size", "mtimeMs", "ctimeMs"]) {
    if (current[key] !== before[key]) {
      throw new Error(`${browser} generated extension root changed during tree audit`);
    }
  }
}

function assertGeneratedUnicodeText(value, browser, label) {
  if (typeof value !== "string") throw new TypeError(`${browser} generated extension ${label} must be text`);
  if (typeof STRING_IS_WELL_FORMED !== "function" || !STRING_IS_WELL_FORMED.call(value)) {
    throw new TypeError(`${browser} generated extension ${label} must be well-formed Unicode`);
  }
  if (STRING_NORMALIZE.call(value, "NFC") !== value) {
    throw new TypeError(`${browser} generated extension ${label} must use NFC Unicode`);
  }
  if (GENERATED_PATH_CONTROL_TEXT.test(value)) {
    throw new TypeError(`${browser} generated extension ${label} contains forbidden control text`);
  }
  return value;
}

function normalizePath(value) { return value.split(sep).join("/").replace(/^\.\//, ""); }
function assertCanonicalGeneratedPath(value, browser) {
  const source = assertGeneratedUnicodeText(value, browser, "path");
  const normalized = normalizePath(source);
  const segments = normalized.split("/");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.includes("\0") ||
    normalized.includes("\\") ||
    segments.some((segment) => !segment || segment === "." || segment === "..") ||
    normalizePath(normalized) !== normalized
  ) {
    throw new TypeError(`${browser} generated extension path is not canonical`);
  }
  return normalized;
}

export function assertGeneratedEntryName(value, browser) {
  const name = assertGeneratedUnicodeText(value, browser, "directory entry name");
  if (!name || name === "." || name === ".." || name.includes("/") || name.includes("\\") || name.includes("\0")) {
    throw new TypeError(`${browser} generated extension directory entry name is not canonical`);
  }
  if (Buffer.byteLength(name, "utf8") > MAX_GENERATED_TREE_PATH_BYTES) {
    throw new RangeError(`${browser} generated extension directory entry name exceeds ${MAX_GENERATED_TREE_PATH_BYTES} UTF-8 bytes`);
  }
  return name;
}

function snapshotGeneratedAllowlistSource(source, browser) {
  if (!Array.isArray(source)) throw new TypeError(`${browser} generated extension allowlist must be an array`);
  const keys = Reflect.ownKeys(source);
  if (keys.length === 0 || keys.length > MAX_GENERATED_TREE_ALLOWLIST_FILES + 1) {
    throw new RangeError(`${browser} generated extension allowlist descriptor ceiling exceeded`);
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(source, "length");
  if (!lengthDescriptor || !("value" in lengthDescriptor) || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value <= 0 || lengthDescriptor.value > MAX_GENERATED_TREE_ALLOWLIST_FILES) {
    throw new RangeError(`${browser} generated extension allowlist file ceiling exceeded`);
  }
  const length = lengthDescriptor.value;
  for (const key of keys) {
    if (key === "length") continue;
    if (typeof key !== "string" || !/^(?:0|[1-9]\d*)$/.test(key)) {
      throw new TypeError(`${browser} generated extension allowlist contains unsupported own key`);
    }
    const index = Number(key);
    if (!Number.isSafeInteger(index) || index < 0 || index >= length || String(index) !== key) {
      throw new TypeError(`${browser} generated extension allowlist index is not canonical`);
    }
  }
  if (keys.length !== length + 1) throw new TypeError(`${browser} generated extension allowlist must be dense and field-exact`);
  const snapshot = new Array(length);
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(source, String(index));
    if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "string") {
      throw new TypeError(`${browser} generated extension allowlist entries must be string data fields`);
    }
    snapshot[index] = descriptor.value;
  }
  return Object.freeze(snapshot);
}

function createGeneratedAllowlistSnapshot(browser) {
  const targetBrowser = assertGeneratedTreeBrowser(browser);
  const source = snapshotGeneratedAllowlistSource(generatedExtensionFilesForBrowser(targetBrowser), targetBrowser);
  const files = [];
  const seen = new Set();
  const directories = new Set();
  for (let index = 0; index < source.length; index += 1) {
    const file = assertCanonicalGeneratedPath(source[index], targetBrowser);
    if (Buffer.byteLength(file, "utf8") > MAX_GENERATED_TREE_PATH_BYTES) {
      throw new RangeError(`${targetBrowser} generated extension allowlist path exceeds ${MAX_GENERATED_TREE_PATH_BYTES} UTF-8 bytes`);
    }
    if (seen.has(file)) throw new TypeError(`${targetBrowser} generated extension allowlist contains duplicate path: ${file}`);
    seen.add(file);
    files.push(file);
    let current = dirname(file).split(sep).join("/");
    while (current && current !== ".") {
      const directory = assertCanonicalGeneratedPath(current, targetBrowser);
      if (Buffer.byteLength(directory, "utf8") > MAX_GENERATED_TREE_PATH_BYTES) {
        throw new RangeError(`${targetBrowser} generated extension allowlist directory exceeds ${MAX_GENERATED_TREE_PATH_BYTES} UTF-8 bytes`);
      }
      directories.add(directory);
      current = dirname(current).split(sep).join("/");
    }
  }
  files.sort(compareGeneratedPathCodeUnits);
  const directoryList = [...directories].sort(compareGeneratedPathCodeUnits);
  return Object.freeze({ files: Object.freeze(files), directories: Object.freeze(directoryList) });
}

const GENERATED_TREE_ALLOWLISTS = Object.freeze(Object.fromEntries(
  GENERATED_TREE_BROWSERS.map((browser) => [browser, createGeneratedAllowlistSnapshot(browser)])
));

export function snapshotGeneratedAllowlist(browser) {
  return GENERATED_TREE_ALLOWLISTS[assertGeneratedTreeBrowser(browser)];
}

export function allowedFilesForBrowser(browser) {
  return [...snapshotGeneratedAllowlist(browser).files];
}

function allowlistMembership(browser) {
  return snapshotGeneratedAllowlist(browser);
}

function unexpectedReason(path) {
  if (REPOSITORY_ONLY_ROOTS.test(path)) return "repository/development-only path is forbidden";
  if (SENSITIVE_FILE.test(path)) return "sensitive or non-runtime file class is forbidden";
  return "path is not in the generated extension allowlist";
}

function validateGeneratedEntryAgainstMembership(path, type, membership) {
  const normalized = normalizePath(path);
  if (!normalized) return null;
  if (type === "directory") return sortedGeneratedPathMembershipHas(membership.directories, normalized) ? null : `${normalized}: ${unexpectedReason(normalized)}`;
  if (type !== "file") return `${normalized}: non-regular filesystem entry (${type}) is forbidden`;
  if (sortedGeneratedPathMembershipHas(membership.files, normalized)) return null;
  return `${normalized}: ${unexpectedReason(normalized)}`;
}

export function validateGeneratedEntry(path, type, browser) {
  const targetBrowser = assertGeneratedTreeBrowser(browser);
  const normalized = assertCanonicalGeneratedPath(path, targetBrowser);
  return validateGeneratedEntryAgainstMembership(normalized, type, allowlistMembership(targetBrowser));
}

function generatedEntryType(stats) {
  if (stats.isSymbolicLink()) return "symlink";
  if (stats.isDirectory()) return "directory";
  if (stats.isFile()) return "file";
  return "other";
}

async function readGeneratedDirectoryBounded(current, browser) {
  const before = snapshotGeneratedDirectoryIdentity(await lstat(current), browser);
  const entries = [];
  const directory = await opendir(current);
  for await (const entry of directory) {
    if (entries.length >= MAX_GENERATED_TREE_DIRECTORY_ENTRIES) {
      throw new RangeError(`${browser} generated extension per-directory entry ceiling exceeded`);
    }
    assertGeneratedEntryName(entry?.name, browser);
    entries.push(entry);
  }
  assertGeneratedDirectoryIdentityUnchanged(before, await lstat(current), browser);
  entries.sort((a, b) => compareGeneratedPathCodeUnits(a.name, b.name));
  return entries;
}

export async function auditGeneratedTree(directory, browser) {
  const targetBrowser = assertGeneratedTreeBrowser(browser);
  const root = resolve(directory);
  const rootStats = await lstat(root);
  if (rootStats.isSymbolicLink() || !rootStats.isDirectory()) {
    throw new TypeError(`${targetBrowser} generated extension root must be a real non-symlink directory`);
  }
  const rootIdentity = snapshotGeneratedDirectoryIdentity(rootStats, targetBrowser);
  const allowlist = snapshotGeneratedAllowlist(targetBrowser);
  const membership = allowlistMembership(targetBrowser);
  const expected = allowlist.files;
  const seen = new Set();
  const violations = [];
  const recordViolation = (violation) => {
    if (violations.length >= MAX_GENERATED_TREE_VIOLATIONS) {
      throw new RangeError(`${targetBrowser} generated extension violation ceiling exceeded`);
    }
    violations.push(violation);
  };
  let entryCount = 0;
  let directoryCount = 0;
  async function walk(current) {
    directoryCount += 1;
    if (directoryCount > MAX_GENERATED_TREE_DIRECTORIES) throw new RangeError(`${targetBrowser} generated extension directory ceiling exceeded`);
    const subtreeIdentity = snapshotGeneratedDirectoryIdentity(await lstat(current), targetBrowser);
    const entries = await readGeneratedDirectoryBounded(current, targetBrowser);
    for (const entry of entries) {
      entryCount += 1;
      if (entryCount > MAX_GENERATED_TREE_ENTRIES) throw new RangeError(`${targetBrowser} generated extension entry ceiling exceeded`);
      const absolute = join(current, entry.name);
      const relativePath = assertCanonicalGeneratedPath(relative(root, absolute), targetBrowser);
      if (Buffer.byteLength(relativePath, "utf8") > MAX_GENERATED_TREE_PATH_BYTES) {
        throw new RangeError(`${targetBrowser} generated extension path exceeds ${MAX_GENERATED_TREE_PATH_BYTES} UTF-8 bytes`);
      }
      const type = generatedEntryType(await lstat(absolute));
      const violation = validateGeneratedEntryAgainstMembership(relativePath, type, membership);
      if (violation) recordViolation(violation);
      if (type === "directory") await walk(absolute);
      else if (type === "file") seen.add(relativePath);
    }
    assertGeneratedSubtreeDirectoryIdentityUnchanged(subtreeIdentity, await lstat(current), targetBrowser);
  }
  await walk(root);
  for (const path of expected) if (!seen.has(path)) recordViolation(`${path}: required generated extension file is missing`);
  assertGeneratedRootIdentityUnchanged(rootIdentity, await lstat(root), targetBrowser);
  if (violations.length) throw new Error(`${targetBrowser} generated extension contents audit failed:\n${violations.map((item) => `- ${item}`).join("\n")}`);
  return { browser: targetBrowser, files: [...seen].sort(compareGeneratedPathCodeUnits) };
}

export async function auditBuiltExtensions(rootDirectory) {
  const root = resolve(rootDirectory);
  const results = [];
  for (const browser of GENERATED_TREE_BROWSERS) results.push(await auditGeneratedTree(resolve(root, "dist", browser), browser));
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "..");
  auditBuiltExtensions(root)
    .then((results) => { for (const result of results) console.log(`${result.browser} generated contents audit passed (${result.files.length} files)`); })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}

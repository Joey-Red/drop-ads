import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { lstat, open, readdir } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { BUILD_PACKAGE_MAX_BYTES } from "./build-info.mjs";
import { readBoundedJsonFile } from "./bounded-json-file.mjs";
import { snapshotReleasePackageIdentity } from "./release-package-identity.mjs";

const SNAPSHOT_CHUNK_BYTES = 64 * 1024;
const BLOCKED_REPRODUCIBILITY_ENV = Object.freeze(new Set([
  "NODE_OPTIONS",
  "NODE_PATH",
  "NODE_REPL_EXTERNAL_MODULE",
  "NODE_ICU_DATA"
]));

export const REPRODUCIBILITY_LIMITS = Object.freeze({
  maxFiles: 4_096,
  maxDirectories: 4_096,
  maxFileBytes: 64 * 1024 * 1024,
  maxTotalBytes: 256 * 1024 * 1024,
  maxPathBytes: 1_024
});

function repoPath(root, path) {
  const value = relative(root, path).split(sep).join("/");
  if (!value || Buffer.byteLength(value, "utf8") > REPRODUCIBILITY_LIMITS.maxPathBytes) {
    throw new Error("Reproducibility snapshot path exceeds supported limit");
  }
  return value;
}

function sameIdentity(before, opened) {
  if (before.size !== opened.size) return false;
  if (Number.isSafeInteger(before.dev) && Number.isSafeInteger(opened.dev) && before.dev !== opened.dev) return false;
  if (Number.isSafeInteger(before.ino) && Number.isSafeInteger(opened.ino) && before.ino !== opened.ino) return false;
  return true;
}

function sameSnapshot(left, right) {
  return left.size === right.size && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;
}

async function requireRealDirectory(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Reproducibility snapshot requires a real directory: ${path}`);
}

async function expectedDistTopLevel(root) {
  const packageJson = await readBoundedJsonFile(resolve(root, "package.json"), {
    maxBytes: BUILD_PACKAGE_MAX_BYTES,
    label: "package.json"
  });
  const identity = snapshotReleasePackageIdentity(packageJson?.name, packageJson?.version, "package.json");
  return Object.freeze([
    Object.freeze({ name: "chromium", type: "directory" }),
    Object.freeze({ name: "firefox", type: "directory" }),
    Object.freeze({ name: `${identity.name}-${identity.version}-chromium.zip`, type: "file" }),
    Object.freeze({ name: `${identity.name}-${identity.version}-firefox.xpi`, type: "file" }),
    Object.freeze({ name: "release-manifest.json", type: "file" })
  ].sort((left, right) => left.name.localeCompare(right.name)));
}

async function validateDistTopLevel(root, dist) {
  await requireRealDirectory(dist);
  const expected = await expectedDistTopLevel(root);
  const entries = await readdir(dist, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  if (entries.length !== expected.length || entries.some((entry, index) => entry.name !== expected[index].name)) {
    throw new Error(`Reproducibility dist top-level set is invalid: expected=${expected.map((entry) => entry.name).join(",")} actual=${entries.map((entry) => entry.name).join(",")}`);
  }
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const descriptor = expected[index];
    const path = resolve(dist, entry.name);
    const stat = await lstat(path);
    if (entry.isSymbolicLink() || stat.isSymbolicLink()) throw new Error(`Reproducibility dist top-level rejects symbolic link: ${repoPath(root, path)}`);
    if (descriptor.type === "directory" && (!entry.isDirectory() || !stat.isDirectory())) {
      throw new Error(`Reproducibility dist top-level requires directory: ${repoPath(root, path)}`);
    }
    if (descriptor.type === "file" && (!entry.isFile() || !stat.isFile())) {
      throw new Error(`Reproducibility dist top-level requires regular file: ${repoPath(root, path)}`);
    }
  }
}

export async function hashReproducibilityFile(path, maxBytes = REPRODUCIBILITY_LIMITS.maxFileBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new TypeError("reproducibility maxBytes must be a positive safe integer");
  const before = await lstat(path);
  if (before.isSymbolicLink() || !before.isFile()) throw new Error(`Reproducibility snapshot rejects non-regular file: ${path}`);
  if (before.size > maxBytes) throw new Error(`Reproducibility file exceeds byte limit: ${path}`);
  const handle = await open(path, "r");
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || !sameIdentity(before, opened)) throw new Error(`Reproducibility file changed before hashing: ${path}`);
    if (opened.size > maxBytes) throw new Error(`Reproducibility file exceeds byte limit: ${path}`);
    const hash = createHash("sha256");
    let bytes = 0;
    const buffer = Buffer.allocUnsafe(Math.min(SNAPSHOT_CHUNK_BYTES, maxBytes));
    while (true) {
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      bytes += bytesRead;
      if (bytes > opened.size || bytes > maxBytes) throw new Error(`Reproducibility file grew while hashing: ${path}`);
      hash.update(buffer.subarray(0, bytesRead));
    }
    if (bytes !== opened.size) throw new Error(`Reproducibility file size changed while hashing: ${path}`);
    const after = await handle.stat();
    if (!after.isFile() || !sameSnapshot(opened, after)) throw new Error(`Reproducibility file changed while hashing: ${path}`);
    return Object.freeze({ bytes, sha256: hash.digest("hex") });
  } finally {
    await handle.close();
  }
}

export async function snapshotDist(rootDirectory) {
  const root = resolve(rootDirectory);
  const dist = resolve(root, "dist");
  await validateDistTopLevel(root, dist);
  const files = [];
  let directories = 0;
  let totalBytes = 0;

  async function walk(directory) {
    directories += 1;
    if (directories > REPRODUCIBILITY_LIMITS.maxDirectories) throw new Error("Reproducibility snapshot directory count exceeds supported limit");
    await requireRealDirectory(directory);
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = resolve(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Reproducibility snapshot rejects symbolic link: ${repoPath(root, path)}`);
      if (entry.isDirectory()) {
        await walk(path);
        continue;
      }
      if (!entry.isFile()) throw new Error(`Reproducibility snapshot rejects non-regular entry: ${repoPath(root, path)}`);
      if (files.length >= REPRODUCIBILITY_LIMITS.maxFiles) throw new Error("Reproducibility snapshot file count exceeds supported limit");
      const stat = await lstat(path);
      if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`Reproducibility snapshot rejects non-regular entry: ${repoPath(root, path)}`);
      if (stat.size > REPRODUCIBILITY_LIMITS.maxFileBytes) throw new Error(`Reproducibility file exceeds byte limit: ${repoPath(root, path)}`);
      const nextTotalBytes = totalBytes + stat.size;
      if (!Number.isSafeInteger(nextTotalBytes) || nextTotalBytes > REPRODUCIBILITY_LIMITS.maxTotalBytes) {
        throw new Error("Reproducibility snapshot aggregate bytes exceed supported limit");
      }
      const descriptor = await hashReproducibilityFile(path, REPRODUCIBILITY_LIMITS.maxFileBytes);
      totalBytes = nextTotalBytes;
      files.push({
        path: repoPath(root, path),
        bytes: descriptor.bytes,
        sha256: descriptor.sha256
      });
    }
  }

  await walk(dist);
  files.sort((left, right) => left.path.localeCompare(right.path));
  return files;
}

export function compareSnapshots(first, second) {
  const left = new Map((Array.isArray(first) ? first : []).map((entry) => [entry.path, entry]));
  const right = new Map((Array.isArray(second) ? second : []).map((entry) => [entry.path, entry]));
  const paths = [...new Set([...left.keys(), ...right.keys()])].sort();
  const differences = [];

  for (const path of paths) {
    const a = left.get(path);
    const b = right.get(path);
    if (!a) {
      differences.push({ path, reason: "missing-from-first-pass", first: null, second: b });
      continue;
    }
    if (!b) {
      differences.push({ path, reason: "missing-from-second-pass", first: a, second: null });
      continue;
    }
    if (a.bytes !== b.bytes || a.sha256 !== b.sha256) {
      differences.push({ path, reason: "bytes-differ", first: a, second: b });
    }
  }
  return differences;
}

export function formatSnapshotDifferences(differences) {
  return differences.map((difference) => {
    if (difference.reason === "missing-from-first-pass") return `${difference.path}: only present in second pass`;
    if (difference.reason === "missing-from-second-pass") return `${difference.path}: only present in first pass`;
    return `${difference.path}: first ${difference.first.bytes} bytes sha256:${difference.first.sha256}; second ${difference.second.bytes} bytes sha256:${difference.second.sha256}`;
  });
}

export function reproducibilityChildEnv(source = process.env) {
  if (!source || typeof source !== "object") throw new TypeError("reproducibility environment must be an object");
  const result = Object.create(null);
  for (const key of Object.keys(source)) {
    if (BLOCKED_REPRODUCIBILITY_ENV.has(key)) continue;
    const value = source[key];
    if (typeof value === "string") result[key] = value;
  }
  return Object.freeze(result);
}

async function runNodeTool(root, relativePath) {
  const script = resolve(root, relativePath);
  const env = reproducibilityChildEnv(process.env);
  await new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [script], {
      cwd: root,
      stdio: "inherit",
      env
    });
    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${relativePath} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

export async function runVerifiedBuildPass(rootDirectory) {
  const root = resolve(rootDirectory);
  await runNodeTool(root, "tools/build.mjs");
  // package.mjs reruns the generated-contents audit, verifies generated bytes,
  // creates deterministic ZIP/XPI + release manifest, then invokes verifyRelease.
  await runNodeTool(root, "tools/package.mjs");
  return snapshotDist(root);
}

export async function verifyReproducible(rootDirectory) {
  const root = resolve(rootDirectory);
  const first = await runVerifiedBuildPass(root);
  const second = await runVerifiedBuildPass(root);
  const differences = compareSnapshots(first, second);
  if (differences.length) {
    throw new Error(`Same-source reproducibility failed:\n${formatSnapshotDifferences(differences).map((line) => `- ${line}`).join("\n")}`);
  }
  return second;
}

function isMainModule(moduleUrl, argvPath) {
  if (!argvPath) return false;
  try { return moduleUrl === pathToFileURL(resolve(argvPath)).href; }
  catch { return false; }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const root = resolve(import.meta.dirname, "..");
  try {
    const snapshot = await verifyReproducible(root);
    console.log(`Same-source reproducibility passed (${snapshot.length} generated/package files byte-identical across two verified passes).`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

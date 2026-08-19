import { lstat, open, rename, rm } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import {
  assertAtomicOutputParentUnchanged,
  assertAtomicOutputPublished,
  createAtomicOutputTempPath,
  snapshotAtomicOutputParent
} from "./atomic-output-temp.mjs";

export const BUILD_OUTPUT_TEXT_MAX_BYTES = 8 * 1024 * 1024;
export const BUILD_OUTPUT_BINARY_MAX_BYTES = 16 * 1024 * 1024;
export const BUILD_OUTPUT_PATH_MAX_BYTES = 1_024;
export const BUILD_OUTPUT_MAX_DIRECTORY_DEPTH = 32;

function outputPath(rootDirectory, relativePath) {
  const root = resolve(rootDirectory);
  if (typeof relativePath !== "string" || !relativePath || isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.includes("\0")) {
    throw new TypeError("Build output path must be a repository-relative path");
  }
  if (Buffer.byteLength(relativePath, "utf8") > BUILD_OUTPUT_PATH_MAX_BYTES) {
    throw new RangeError("Build output path exceeds its UTF-8 byte ceiling");
  }
  const parts = relativePath.split("/");
  if (parts.length < 2 || parts[0] !== "dist" || parts.some((part) => !part || part === "." || part === "..")) {
    throw new TypeError("Build output path must be canonical under dist/");
  }
  const absolute = resolve(root, relativePath);
  const child = relative(root, absolute);
  if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) throw new TypeError("Build output path escapes the repository");
  const normalized = child.split(sep).join("/");
  if (normalized !== relativePath || !normalized.startsWith("dist/")) throw new TypeError("Build output path must stay under dist/");
  return absolute;
}

async function requireRealDirectory(path, label) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new TypeError(`${label} must be a real directory`);
}

async function requireRealBuildOutputAncestry(rootDirectory, output) {
  const root = resolve(rootDirectory);
  await requireRealDirectory(root, "Build repository root");
  const parent = dirname(output);
  const child = relative(root, parent);
  if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) {
    throw new TypeError("Build output parent escapes the repository");
  }
  const segments = child.split(sep);
  if (segments.length > BUILD_OUTPUT_MAX_DIRECTORY_DEPTH) throw new RangeError("Build output directory ancestry exceeds its depth ceiling");
  let current = root;
  for (const segment of segments) {
    current = resolve(current, segment);
    await requireRealDirectory(current, "Build output directory ancestry");
  }
}

export async function writeBuildOutputTextAtomic(rootDirectory, relativePath, text) {
  if (typeof text !== "string") throw new TypeError("Build output text must be a string");
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes <= 0 || bytes > BUILD_OUTPUT_TEXT_MAX_BYTES) throw new TypeError("Build output text size is invalid");

  const output = outputPath(rootDirectory, relativePath);
  await requireRealBuildOutputAncestry(rootDirectory, output);
  const parent = dirname(output);
  const parentSnapshot = await snapshotAtomicOutputParent(parent);

  const temp = createAtomicOutputTempPath(output);
  let handle;
  try {
    handle = await open(temp, "wx", 0o600);
    await handle.writeFile(text, { encoding: "utf8" });
    await handle.sync();
    await handle.close();
    handle = null;
    await assertAtomicOutputParentUnchanged(parentSnapshot);
    await rename(temp, output);
    await assertAtomicOutputPublished(output, bytes);
  } catch (error) {
    try { await handle?.close(); } catch { /* best-effort cleanup */ }
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }

  return Object.freeze({ path: output, bytes });
}

export async function writeBuildOutputBinaryAtomic(rootDirectory, relativePath, data) {
  if (!Buffer.isBuffer(data) && !(data instanceof Uint8Array)) throw new TypeError("Build output binary data is required");
  const bytes = data.byteLength;
  if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > BUILD_OUTPUT_BINARY_MAX_BYTES) {
    throw new TypeError("Build output binary size is invalid");
  }

  const output = outputPath(rootDirectory, relativePath);
  await requireRealBuildOutputAncestry(rootDirectory, output);
  const parent = dirname(output);
  const parentSnapshot = await snapshotAtomicOutputParent(parent);

  const temp = createAtomicOutputTempPath(output);
  let handle;
  try {
    handle = await open(temp, "wx", 0o600);
    await handle.writeFile(data);
    await handle.sync();
    await handle.close();
    handle = null;
    await assertAtomicOutputParentUnchanged(parentSnapshot);
    await rename(temp, output);
    await assertAtomicOutputPublished(output, bytes);
  } catch (error) {
    try { await handle?.close(); } catch { /* best-effort cleanup */ }
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }

  return Object.freeze({ path: output, bytes });
}

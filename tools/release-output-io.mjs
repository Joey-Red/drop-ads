import { lstat, open, rename, rm } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import {
  assertAtomicOutputParentUnchanged,
  assertAtomicOutputPublished,
  createAtomicOutputTempPath,
  snapshotAtomicOutputParent
} from "./atomic-output-temp.mjs";

export const RELEASE_OUTPUT_TEXT_MAX_BYTES = 8 * 1024 * 1024;

function releaseOutputPath(stageDirectory, relativePath) {
  const stage = resolve(stageDirectory);
  if (typeof relativePath !== "string" || !relativePath || isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.includes("\0")) {
    throw new TypeError("Release output path must be stage-relative");
  }
  const output = resolve(stage, relativePath);
  const child = relative(stage, output);
  if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) {
    throw new TypeError("Release output path escapes the staging directory");
  }
  if (child.split(sep).some((part) => !part || part === "." || part === "..")) {
    throw new TypeError("Release output path must be canonical");
  }
  return output;
}

async function requireRealDirectory(path, label) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new TypeError(`${label} must be a real directory`);
}

export async function writeReleaseOutputTextAtomic(stageDirectory, relativePath, text) {
  if (typeof text !== "string") throw new TypeError("Release output text must be a string");
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes <= 0 || bytes > RELEASE_OUTPUT_TEXT_MAX_BYTES) throw new TypeError("Release output text size is invalid");

  const stage = resolve(stageDirectory);
  await requireRealDirectory(stage, "Release staging directory");
  const output = releaseOutputPath(stage, relativePath);
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

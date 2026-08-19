import { randomBytes } from "node:crypto";
import { lstat } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

function sameFilesystemIdentity(left, right) {
  if (Number.isSafeInteger(left.dev) && Number.isSafeInteger(right.dev) && left.dev !== right.dev) return false;
  if (Number.isSafeInteger(left.ino) && Number.isSafeInteger(right.ino) && left.ino !== right.ino) return false;
  return true;
}

export async function snapshotAtomicOutputParent(parentPath) {
  const path = resolve(parentPath);
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new TypeError("Atomic output parent must be a real directory");
  return Object.freeze({ path, stat });
}

export async function assertAtomicOutputParentUnchanged(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || typeof snapshot.path !== "string" || !snapshot.stat) {
    throw new TypeError("Atomic output parent snapshot is invalid");
  }
  const current = await lstat(snapshot.path);
  if (current.isSymbolicLink() || !current.isDirectory() || !sameFilesystemIdentity(snapshot.stat, current)) {
    throw new Error("Atomic output parent changed before publish");
  }
  return true;
}

export async function assertAtomicOutputPublished(outputPath, expectedBytes) {
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes <= 0) throw new TypeError("Atomic output expected byte size is invalid");
  const path = resolve(outputPath);
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Atomic output publish did not produce a regular file");
  if (stat.size !== expectedBytes) throw new Error("Atomic output published byte size is invalid");
  return true;
}

export function createAtomicOutputTempPath(outputPath) {
  if (typeof outputPath !== "string" || !outputPath) throw new TypeError("Atomic output path is required");
  const output = resolve(outputPath);
  const parent = dirname(output);
  const name = basename(output);
  const suffix = randomBytes(16).toString("hex");
  return resolve(parent, `.${name}.${process.pid}.${suffix}.tmp`);
}

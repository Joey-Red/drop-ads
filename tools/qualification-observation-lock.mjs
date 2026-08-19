import { lstat, mkdir, rmdir } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import {
  revalidateQualificationObservationArtifactsDirectory,
  revalidateQualificationObservationRepositoryRoot,
  snapshotQualificationObservationArtifactsDirectory,
  snapshotQualificationObservationRepositoryRoot
} from "./qualification-observation-path.mjs";

const LOCK_DIRECTORY = ".qualification-observation.lock";

function assertCanonicalAbsolutePath(value, label) {
  if (typeof value !== "string" || !value || !isAbsolute(value) || resolve(value) !== value) {
    throw new TypeError(`${label} must be a canonical absolute path`);
  }
  return value;
}

function snapshotLockIdentity(identity) {
  if (!identity || typeof identity !== "object" || Array.isArray(identity) || !Object.isFrozen(identity)) {
    throw new TypeError("qualification observation lock identity must be a frozen plain data object");
  }
  const prototype = Object.getPrototypeOf(identity);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("qualification observation lock identity must be a frozen plain data object");
  }
  const expectedKeys = ["dev", "ino", "mode", "nlink"];
  const keys = Reflect.ownKeys(identity);
  if (keys.length !== expectedKeys.length || expectedKeys.some((key) => !keys.includes(key)) || keys.some((key) => typeof key !== "string")) {
    throw new TypeError("qualification observation lock identity has an invalid field set");
  }
  const values = Object.create(null);
  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(identity, key);
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError(`qualification observation lock identity.${key} must be an enumerable own data field`);
    }
    if (typeof descriptor.value !== "number" || !Number.isFinite(descriptor.value) || descriptor.value < 0) {
      throw new TypeError(`qualification observation lock identity.${key} must be a non-negative finite number`);
    }
    values[key] = descriptor.value;
  }
  return Object.freeze({ dev: values.dev, ino: values.ino, mode: values.mode, nlink: values.nlink });
}

function snapshotLockState(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot) || !Object.isFrozen(snapshot)) {
    throw new TypeError("qualification observation lock snapshot must be a frozen plain data object");
  }
  const prototype = Object.getPrototypeOf(snapshot);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("qualification observation lock snapshot must be a frozen plain data object");
  }
  const keys = Reflect.ownKeys(snapshot);
  if (keys.length !== 2 || !keys.includes("path") || !keys.includes("identity") || keys.some((key) => typeof key !== "string")) {
    throw new TypeError("qualification observation lock snapshot has an invalid field set");
  }
  const pathDescriptor = Object.getOwnPropertyDescriptor(snapshot, "path");
  const identityDescriptor = Object.getOwnPropertyDescriptor(snapshot, "identity");
  for (const [key, descriptor] of [["path", pathDescriptor], ["identity", identityDescriptor]]) {
    if (!descriptor || !("value" in descriptor) || "get" in descriptor || "set" in descriptor || !descriptor.enumerable) {
      throw new TypeError(`qualification observation lock snapshot.${key} must be an enumerable own data field`);
    }
  }
  const path = assertCanonicalAbsolutePath(pathDescriptor.value, "qualification observation lock snapshot.path");
  return Object.freeze({ path, identity: snapshotLockIdentity(identityDescriptor.value) });
}

export function qualificationObservationLockPath(rootDirectory) {
  const root = assertCanonicalAbsolutePath(rootDirectory, "qualification observation lock root");
  return resolve(root, "artifacts", LOCK_DIRECTORY);
}

export async function snapshotQualificationObservationLockDirectory(lockPath) {
  const canonicalLockPath = assertCanonicalAbsolutePath(lockPath, "qualification observation lock path");
  const stat = await lstat(canonicalLockPath);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new TypeError("qualification observation lock must be a real directory");
  }
  return Object.freeze({
    path: canonicalLockPath,
    identity: Object.freeze({ dev: stat.dev, ino: stat.ino, mode: stat.mode, nlink: stat.nlink })
  });
}

export async function revalidateQualificationObservationLockDirectory(snapshot) {
  const safe = snapshotLockState(snapshot);
  const stat = await lstat(safe.path);
  if (!stat.isDirectory() || stat.isSymbolicLink()
    || stat.dev !== safe.identity.dev || stat.ino !== safe.identity.ino
    || stat.mode !== safe.identity.mode || stat.nlink !== safe.identity.nlink) {
    throw new Error("qualification observation lock changed during operation");
  }
  return true;
}

export async function withQualificationObservationLock(rootDirectory, task) {
  if (typeof task !== "function") throw new TypeError("qualification observation lock requires a task");

  const rootSnapshot = await snapshotQualificationObservationRepositoryRoot(rootDirectory);
  const artifactsSnapshot = await snapshotQualificationObservationArtifactsDirectory(rootDirectory);
  const lockPath = qualificationObservationLockPath(rootDirectory);
  let lockSnapshot;
  try {
    await mkdir(lockPath, { mode: 0o700 });
    lockSnapshot = await snapshotQualificationObservationLockDirectory(lockPath);
    await revalidateQualificationObservationRepositoryRoot(rootSnapshot);
    await revalidateQualificationObservationArtifactsDirectory(artifactsSnapshot);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(
        "qualification observation lock exists; another qualification command may be running. "
        + "Confirm no qualification command is active before removing artifacts/.qualification-observation.lock"
      );
    }
    throw error;
  }

  let taskFailed = false;
  try {
    return await task();
  } catch (error) {
    taskFailed = true;
    throw error;
  } finally {
    let rootStable = false;
    let parentStable = false;
    let lockStable = false;
    try {
      await revalidateQualificationObservationRepositoryRoot(rootSnapshot);
      rootStable = true;
      await revalidateQualificationObservationArtifactsDirectory(artifactsSnapshot);
      parentStable = true;
      await revalidateQualificationObservationLockDirectory(lockSnapshot);
      lockStable = true;
    } catch (error) {
      if (!taskFailed) throw error;
    }
    if (rootStable && parentStable && lockStable) {
      try {
        await rmdir(lockPath);
      } catch (error) {
        if (!taskFailed && error?.code !== "ENOENT") throw error;
      }
    }
  }
}

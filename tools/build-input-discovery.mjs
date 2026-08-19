import { lstat, opendir } from "node:fs/promises";
import { isAbsolute, join, normalize, posix, relative, sep } from "node:path";

export const MAX_BUILD_INPUT_TRAVERSAL_ENTRIES = 100_000;
export const MAX_BUILD_INPUT_ROOT_DIRECTORIES = 4_096;
export const MAX_BUILD_INPUT_DIRECTORY_ENTRIES = 8_192;
export const MAX_BUILD_INPUT_PATH_BYTES = 1_024;

const UNSAFE_BUILD_INPUT_PATH_TEXT = /[\u0000-\u001f\u007f\u2028\u2029]/;

function isWellFormedBuildInputText(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}

export function compareBuildInputText(left, right) {
  if (typeof left !== "string" || typeof right !== "string") throw new TypeError("Build input sort values must be strings");
  return left < right ? -1 : left > right ? 1 : 0;
}

export function assertCanonicalBuildInputPath(value) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError("Build input path is invalid");
  if (!isWellFormedBuildInputText(value)) throw new TypeError("Build input path must be well-formed Unicode");
  if (value.normalize("NFC") !== value) throw new TypeError("Build input path must use NFC Unicode normalization");
  if (UNSAFE_BUILD_INPUT_PATH_TEXT.test(value)) throw new TypeError("Build input path contains unsafe control text");
  if (Buffer.byteLength(value, "utf8") > MAX_BUILD_INPUT_PATH_BYTES) throw new RangeError("Build input path exceeds its UTF-8 byte ceiling");
  if (value.startsWith("/") || value.includes("\\")) throw new TypeError("Build input path is invalid");
  const parts = value.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) throw new TypeError("Build input path is invalid");
  if (posix.normalize(value) !== value) throw new TypeError("Build input path is not canonical");
  return value;
}

function repoPath(rootDirectory, absolutePath) {
  const value = relative(rootDirectory, absolutePath).split(sep).join("/");
  return assertCanonicalBuildInputPath(value);
}

function sameDirectoryIdentity(left, right) {
  if (left.size !== right.size || left.mtimeMs !== right.mtimeMs || left.ctimeMs !== right.ctimeMs) return false;
  if (Number.isSafeInteger(left.dev) && Number.isSafeInteger(right.dev) && left.dev !== right.dev) return false;
  if (Number.isSafeInteger(left.ino) && Number.isSafeInteger(right.ino) && left.ino !== right.ino) return false;
  return true;
}

function assertAbsoluteNormalizedDirectoryPath(value, label) {
  if (typeof value !== "string" || value.length === 0 || !isAbsolute(value) || normalize(value) !== value) {
    throw new TypeError(`${label} must be an absolute normalized path`);
  }
  return value;
}

async function requireDirectory(path, expected = null) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new TypeError(`Build input directory is unsafe: ${path}`);
  if (expected && !sameDirectoryIdentity(expected, stat)) throw new Error(`Build input directory identity changed before traversal: ${path}`);
  return stat;
}

async function readBoundedDirectory(path) {
  const directory = await opendir(path);
  const entries = [];
  try {
    while (true) {
      const entry = await directory.read();
      if (entry === null) break;
      if (entries.length >= MAX_BUILD_INPUT_DIRECTORY_ENTRIES) throw new RangeError(`Build input directory exceeds ${MAX_BUILD_INPUT_DIRECTORY_ENTRIES} entries: ${path}`);
      entries.push(entry);
    }
  } finally {
    await directory.close();
  }
  entries.sort((a, b) => compareBuildInputText(a.name, b.name));
  return entries;
}

async function classifyFreshEntry(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) throw new TypeError(`Build input entry is a symbolic link: ${path}`);
  if (stat.isDirectory()) return Object.freeze({ type: "directory", stat });
  if (stat.isFile()) return Object.freeze({ type: "file", stat });
  throw new TypeError(`Build input entry type is unsupported: ${path}`);
}

function createDiscoveryState() {
  return { entries: 0, directories: 0 };
}

function snapshotBuildInputRootDirectories(directories) {
  let isArray;
  let keys;
  let lengthDescriptor;
  try {
    isArray = Array.isArray(directories);
    keys = Reflect.ownKeys(directories);
    lengthDescriptor = Object.getOwnPropertyDescriptor(directories, "length");
  } catch {
    throw new TypeError("Build input root directory set is not safely inspectable");
  }
  if (!isArray || !lengthDescriptor || !("value" in lengthDescriptor) || !Number.isSafeInteger(lengthDescriptor.value)) {
    throw new TypeError("Build input root directory set must be a dense data array");
  }
  const length = lengthDescriptor.value;
  if (length <= 0 || length > MAX_BUILD_INPUT_ROOT_DIRECTORIES) throw new TypeError("Build input root directory set is invalid");
  const keySet = new Set(keys);
  if (keySet.size !== length + 1 || !keySet.has("length")) throw new TypeError("Build input root directory set must not contain holes or extra fields");

  const result = [];
  const seen = new Set();
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    if (!keySet.has(key)) throw new TypeError("Build input root directory set must not contain holes");
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(directories, key); }
    catch { throw new TypeError(`Build input root directory ${index} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`Build input root directory ${index} must be an enumerable data field`);
    }
    const value = assertAbsoluteNormalizedDirectoryPath(descriptor.value, `Build input root directory ${index}`);
    if (seen.has(value)) throw new TypeError(`Duplicate build input root directory: ${value}`);
    seen.add(value);
    result.push(value);
  }
  return Object.freeze(result);
}

async function discoverBuildInputFilesWithState(rootDirectory, directory, state) {
  const result = [];
  repoPath(rootDirectory, directory);

  async function walk(current, expected = null) {
    const before = await requireDirectory(current, expected);
    state.directories += 1;
    if (state.directories > MAX_BUILD_INPUT_ROOT_DIRECTORIES) throw new RangeError(`Build input discovery exceeds ${MAX_BUILD_INPUT_ROOT_DIRECTORIES} directories`);

    const entries = await readBoundedDirectory(current);
    for (const entry of entries) {
      state.entries += 1;
      if (state.entries > MAX_BUILD_INPUT_TRAVERSAL_ENTRIES) throw new RangeError(`Build input discovery exceeds ${MAX_BUILD_INPUT_TRAVERSAL_ENTRIES} entries`);
      const path = join(current, entry.name);
      repoPath(rootDirectory, path);
      const classified = await classifyFreshEntry(path);
      if (classified.type === "directory") await walk(path, classified.stat);
      else result.push(path);
    }

    const after = await requireDirectory(current);
    if (!sameDirectoryIdentity(before, after)) throw new Error(`Build input directory identity changed during build-input discovery: ${current}`);
  }

  await walk(directory);
  return result;
}

export async function discoverBuildInputFiles(rootDirectory, directory) {
  const repositoryRoot = assertAbsoluteNormalizedDirectoryPath(rootDirectory, "Build input repository root");
  const rootBefore = await requireDirectory(repositoryRoot);
  const result = await discoverBuildInputFilesWithState(repositoryRoot, directory, createDiscoveryState());
  const rootAfter = await requireDirectory(repositoryRoot);
  if (!sameDirectoryIdentity(rootBefore, rootAfter)) throw new Error("Build input repository root identity changed during discovery");
  return result;
}

export async function discoverBuildInputRoots(rootDirectory, directories) {
  const repositoryRoot = assertAbsoluteNormalizedDirectoryPath(rootDirectory, "Build input repository root");
  const requestedDirectories = snapshotBuildInputRootDirectories(directories);
  const rootBefore = await requireDirectory(repositoryRoot);
  const state = createDiscoveryState();
  const result = [];
  for (const directory of requestedDirectories) result.push(...await discoverBuildInputFilesWithState(repositoryRoot, directory, state));
  const rootAfter = await requireDirectory(repositoryRoot);
  if (!sameDirectoryIdentity(rootBefore, rootAfter)) throw new Error("Build input repository root identity changed during discovery");
  return result;
}

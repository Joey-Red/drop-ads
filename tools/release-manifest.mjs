import { createHash } from "node:crypto";
import { lstat, open } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import { snapshotReleasePackageIdentity } from "./release-package-identity.mjs";
import { RELEASE_TOOL_PATHS } from "./release-tool-contract.mjs";

export const RELEASE_MANIFEST_SCHEMA_VERSION = 1;
export const RELEASE_MANIFEST_MAX_BYTES = 256 * 1024;
export const RELEASE_TOOL_MAX_BYTES = 2 * 1024 * 1024;
export const RELEASE_ARTIFACT_MAX_BYTES = 64 * 1024 * 1024;
export const PACKAGING_TOOL_PATHS = RELEASE_TOOL_PATHS;

const HASH_CHUNK_BYTES = 64 * 1024;
const REQUEST_KEYS = new Set(["rootDirectory", "packageName", "version", "sourceFingerprint", "artifacts"]);
const ARTIFACT_REQUEST_KEYS = new Set(["browser", "path"]);
const MANIFEST_KEYS = new Set(["schemaVersion", "package", "sourceFingerprint", "packagingTools", "artifacts"]);
const PACKAGE_KEYS = new Set(["name", "version"]);
const TOOL_DESCRIPTOR_KEYS = new Set(["path", "bytes", "sha256"]);
const ARTIFACT_DESCRIPTOR_KEYS = new Set(["browser", "file", "bytes", "sha256"]);
const BROWSERS = new Set(["chromium", "firefox"]);
const FINGERPRINT_TEXT = /^sha256:[0-9a-f]{64}$/;
const SHA256_TEXT = /^[0-9a-f]{64}$/;
const UNSAFE_TEXT = /[\u0000-\u001f\u007f\u2028\u2029]/;

function exactDataObject(value, allowedKeys, label) {
  let isArray;
  let prototype;
  let keys;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  } catch {
    throw new TypeError(`${label} is not safely inspectable`);
  }
  if (!value || typeof value !== "object" || isArray || (prototype !== Object.prototype && prototype !== null)) {
    throw new TypeError(`${label} must be a plain data object`);
  }
  if (keys.length !== allowedKeys.size || keys.some((key) => typeof key !== "string" || !allowedKeys.has(key))) {
    throw new TypeError(`${label} fields are invalid`);
  }
  const values = Object.create(null);
  for (const key of allowedKeys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`${label}.${key} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`${label}.${key} must be an enumerable data field`);
    }
    values[key] = descriptor.value;
  }
  return values;
}

function safeText(value, label, maxLength) {
  if (typeof value !== "string" || !value || value.length > maxLength || UNSAFE_TEXT.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function snapshotDenseArray(value, expectedLength, label, snapshotEntry) {
  let isArray;
  let keys;
  let lengthDescriptor;
  try {
    isArray = Array.isArray(value);
    keys = Reflect.ownKeys(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch {
    throw new TypeError(`${label} is not safely inspectable`);
  }
  if (!isArray || !lengthDescriptor || !("value" in lengthDescriptor) || lengthDescriptor.value !== expectedLength || keys.length !== expectedLength + 1 || !keys.includes("length")) {
    throw new TypeError(`${label} must be a dense array of length ${expectedLength}`);
  }

  const result = [];
  for (let index = 0; index < expectedLength; index += 1) {
    const key = String(index);
    if (!keys.includes(key)) throw new TypeError(`${label} must not contain holes`);
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`${label}[${index}] is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`${label}[${index}] must be an enumerable data field`);
    result.push(snapshotEntry(descriptor.value, index));
  }
  return result;
}

function snapshotArtifactRequests(value) {
  const result = snapshotDenseArray(value, 2, "release manifest artifacts", (entry, index) => {
    const fields = exactDataObject(entry, ARTIFACT_REQUEST_KEYS, `release manifest artifact ${index}`);
    if (typeof fields.browser !== "string" || !BROWSERS.has(fields.browser)) throw new TypeError(`release manifest artifact ${index}.browser is invalid`);
    return Object.freeze({
      browser: fields.browser,
      path: safeText(fields.path, `release manifest artifact ${index}.path`, 1_024)
    });
  });
  const seen = new Set();
  for (const item of result) {
    if (seen.has(item.browser)) throw new TypeError(`release manifest contains duplicate ${item.browser} artifact`);
    seen.add(item.browser);
  }
  if (seen.size !== 2) throw new TypeError("release manifest requires Chromium and Firefox artifacts");
  return Object.freeze(result);
}

function expectedArtifactRequestPath(packageName, version, browser) {
  return `dist/${packageName}-${version}-${browser}.${browser === "chromium" ? "zip" : "xpi"}`;
}

export function snapshotReleaseManifestRequest(request) {
  const fields = exactDataObject(request, REQUEST_KEYS, "release manifest request");
  const rootDirectory = safeText(fields.rootDirectory, "release manifest rootDirectory", 4_096);
  const identity = snapshotReleasePackageIdentity(fields.packageName, fields.version, "release manifest");
  if (typeof fields.sourceFingerprint !== "string" || !FINGERPRINT_TEXT.test(fields.sourceFingerprint)) throw new TypeError("release manifest sourceFingerprint is invalid");
  const artifacts = snapshotArtifactRequests(fields.artifacts);
  for (const artifact of artifacts) {
    const expectedPath = expectedArtifactRequestPath(identity.name, identity.version, artifact.browser);
    if (artifact.path !== expectedPath) throw new TypeError(`release manifest ${artifact.browser} artifact path must be exactly ${expectedPath}`);
  }
  return Object.freeze({
    rootDirectory,
    packageName: identity.name,
    version: identity.version,
    sourceFingerprint: fields.sourceFingerprint,
    artifacts
  });
}

function containedRepositoryPath(root, candidate, { requireDist = false } = {}) {
  if (typeof candidate !== "string" || !candidate || candidate.length > 1_024 || isAbsolute(candidate) || candidate.includes("\\") || candidate.includes("\0")) {
    throw new TypeError("release manifest path must be a repository-relative path");
  }
  const parts = candidate.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) throw new TypeError("release manifest path is not normalized");
  const absolute = resolve(root, candidate);
  const child = relative(root, absolute);
  if (!child || child.startsWith(`..${sep}`) || child === ".." || isAbsolute(child)) throw new TypeError("release manifest path escapes the repository");
  const repositoryPath = child.split(sep).join("/");
  if (requireDist && !repositoryPath.startsWith("dist/")) throw new TypeError("release artifact path must stay under dist/");
  return Object.freeze({ absolute, repositoryPath });
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

export async function describeReleaseFile(path, label = "release file", maxBytes = RELEASE_ARTIFACT_MAX_BYTES) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new TypeError("release file maxBytes must be a positive safe integer");
  const before = await lstat(path);
  if (before.isSymbolicLink() || !before.isFile()) throw new TypeError(`${label} must be a regular non-symlink file`);
  if (before.size <= 0 || before.size > maxBytes) throw new TypeError(`${label} byte size exceeds its hashing limit`);

  const handle = await open(path, "r");
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || !sameIdentity(before, opened)) throw new Error(`${label} changed before hashing`);
    if (opened.size <= 0 || opened.size > maxBytes) throw new TypeError(`${label} byte size exceeds its hashing limit`);

    const hash = createHash("sha256");
    let bytes = 0;
    while (true) {
      const buffer = Buffer.allocUnsafe(Math.min(HASH_CHUNK_BYTES, maxBytes));
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      bytes += bytesRead;
      if (bytes > opened.size || bytes > maxBytes) throw new Error(`${label} grew while hashing`);
      hash.update(buffer.subarray(0, bytesRead));
    }
    if (bytes !== opened.size) throw new Error(`${label} size changed while hashing`);

    const after = await handle.stat();
    if (!after.isFile() || !sameSnapshot(opened, after)) throw new Error(`${label} changed while hashing`);
    return Object.freeze({ bytes, sha256: hash.digest("hex") });
  } finally {
    await handle.close();
  }
}

function snapshotManifestTool(entry, index) {
  const fields = exactDataObject(entry, TOOL_DESCRIPTOR_KEYS, `release manifest packagingTools[${index}]`);
  const path = safeText(fields.path, `release manifest packagingTools[${index}].path`, 1_024);
  if (!Number.isSafeInteger(fields.bytes) || fields.bytes <= 0 || fields.bytes > RELEASE_TOOL_MAX_BYTES) throw new TypeError(`release manifest packagingTools[${index}].bytes is invalid`);
  if (typeof fields.sha256 !== "string" || !SHA256_TEXT.test(fields.sha256)) throw new TypeError(`release manifest packagingTools[${index}].sha256 is invalid`);
  return Object.freeze({ path, bytes: fields.bytes, sha256: fields.sha256 });
}

function snapshotManifestArtifact(entry, index, packageName, version) {
  const fields = exactDataObject(entry, ARTIFACT_DESCRIPTOR_KEYS, `release manifest artifacts[${index}]`);
  if (typeof fields.browser !== "string" || !BROWSERS.has(fields.browser)) throw new TypeError(`release manifest artifacts[${index}].browser is invalid`);
  const file = safeText(fields.file, `release manifest artifacts[${index}].file`, 256);
  const expectedFile = `${packageName}-${version}-${fields.browser}.${fields.browser === "chromium" ? "zip" : "xpi"}`;
  if (file !== expectedFile || basename(file) !== file) throw new TypeError(`release manifest artifacts[${index}].file is invalid`);
  if (!Number.isSafeInteger(fields.bytes) || fields.bytes <= 0 || fields.bytes > RELEASE_ARTIFACT_MAX_BYTES) throw new TypeError(`release manifest artifacts[${index}].bytes is invalid`);
  if (typeof fields.sha256 !== "string" || !SHA256_TEXT.test(fields.sha256)) throw new TypeError(`release manifest artifacts[${index}].sha256 is invalid`);
  return Object.freeze({ browser: fields.browser, file, bytes: fields.bytes, sha256: fields.sha256 });
}

export function validateReleaseManifest(manifest) {
  const root = exactDataObject(manifest, MANIFEST_KEYS, "release manifest");
  if (root.schemaVersion !== RELEASE_MANIFEST_SCHEMA_VERSION) throw new TypeError("release manifest schemaVersion is invalid");
  const packageFields = exactDataObject(root.package, PACKAGE_KEYS, "release manifest.package");
  const identity = snapshotReleasePackageIdentity(packageFields.name, packageFields.version, "release manifest.package");
  if (typeof root.sourceFingerprint !== "string" || !FINGERPRINT_TEXT.test(root.sourceFingerprint)) throw new TypeError("release manifest sourceFingerprint is invalid");

  const tools = snapshotDenseArray(root.packagingTools, PACKAGING_TOOL_PATHS.length, "release manifest packagingTools", snapshotManifestTool);
  tools.sort((a, b) => a.path.localeCompare(b.path));
  const expectedTools = [...PACKAGING_TOOL_PATHS].sort((a, b) => a.localeCompare(b));
  if (tools.some((tool, index) => tool.path !== expectedTools[index])) throw new TypeError("release manifest packagingTools set is invalid");

  const artifacts = snapshotDenseArray(root.artifacts, 2, "release manifest artifacts", (entry, index) => snapshotManifestArtifact(entry, index, identity.name, identity.version));
  artifacts.sort((a, b) => a.browser.localeCompare(b.browser));
  if (artifacts[0].browser !== "chromium" || artifacts[1].browser !== "firefox") throw new TypeError("release manifest browser artifact set is invalid");

  return Object.freeze({
    schemaVersion: RELEASE_MANIFEST_SCHEMA_VERSION,
    package: identity,
    sourceFingerprint: root.sourceFingerprint,
    packagingTools: Object.freeze(tools),
    artifacts: Object.freeze(artifacts)
  });
}

export async function createReleaseManifest(request) {
  const safeRequest = snapshotReleaseManifestRequest(request);
  const root = resolve(safeRequest.rootDirectory);
  const describedArtifacts = [];
  for (const artifact of safeRequest.artifacts) {
    const artifactPath = containedRepositoryPath(root, artifact.path, { requireDist: true });
    const descriptor = await describeReleaseFile(artifactPath.absolute, `${artifact.browser} release artifact`, RELEASE_ARTIFACT_MAX_BYTES);
    describedArtifacts.push({
      browser: artifact.browser,
      file: basename(artifactPath.repositoryPath),
      ...descriptor
    });
  }
  describedArtifacts.sort((a, b) => a.browser.localeCompare(b.browser) || a.file.localeCompare(b.file));

  const packagingTools = [];
  for (const path of PACKAGING_TOOL_PATHS) {
    const toolPath = containedRepositoryPath(root, path);
    packagingTools.push({ path: toolPath.repositoryPath, ...await describeReleaseFile(toolPath.absolute, `packaging tool ${path}`, RELEASE_TOOL_MAX_BYTES) });
  }
  packagingTools.sort((a, b) => a.path.localeCompare(b.path));

  return validateReleaseManifest({
    schemaVersion: RELEASE_MANIFEST_SCHEMA_VERSION,
    package: { name: safeRequest.packageName, version: safeRequest.version },
    sourceFingerprint: safeRequest.sourceFingerprint,
    packagingTools,
    artifacts: describedArtifacts
  });
}

export function serializeReleaseManifest(manifest) {
  const safe = validateReleaseManifest(manifest);
  const serialized = `${JSON.stringify(safe, null, 2)}\n`;
  if (Buffer.byteLength(serialized, "utf8") > RELEASE_MANIFEST_MAX_BYTES) throw new RangeError("release manifest exceeds its byte ceiling");
  return serialized;
}

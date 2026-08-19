const ROOT_KEYS = new Set([
  "gitHead",
  "gitStatus",
  "currentBuildInfo",
  "chromiumBuildInfo",
  "firefoxBuildInfo",
  "releaseManifest",
  "nodeVersion",
  "npmUserAgent"
]);
const ARTIFACT_KEYS = new Set(["browser", "file", "bytes", "sha256"]);

function dataObject(value, label, allowedKeys = null) {
  let isArray;
  let prototype;
  let keys;
  try {
    isArray = Array.isArray(value);
    prototype = value && typeof value === "object" ? Object.getPrototypeOf(value) : null;
    keys = value && typeof value === "object" ? Reflect.ownKeys(value) : [];
  } catch {
    throw new TypeError(`${label} is not safely inspectable`);
  }
  if (!value || typeof value !== "object" || isArray) throw new TypeError(`${label} must be an object`);
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain data object`);
  if (allowedKeys && (keys.length !== allowedKeys.size || keys.some((key) => typeof key !== "string" || !allowedKeys.has(key)))) {
    throw new TypeError(`${label} fields are invalid`);
  }
  return value;
}

function field(value, key, label) {
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
  catch { throw new TypeError(`${label}.${key} is not safely inspectable`); }
  if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
    throw new TypeError(`${label}.${key} must be an enumerable data field`);
  }
  return descriptor.value;
}

function stringField(value, key, label, { allowEmpty = false } = {}) {
  const result = field(value, key, label);
  if (typeof result !== "string" || (!allowEmpty && !result)) throw new TypeError(`${label}.${key} is invalid`);
  return result;
}

function packageSnapshot(owner, label) {
  const packageValue = dataObject(field(owner, "package", label), `${label}.package`);
  return Object.freeze({
    name: stringField(packageValue, "name", `${label}.package`),
    version: stringField(packageValue, "version", `${label}.package`)
  });
}

function buildInfoSnapshot(value, label) {
  const info = dataObject(value, label);
  return Object.freeze({
    package: packageSnapshot(info, label),
    sourceFingerprint: stringField(info, "sourceFingerprint", label)
  });
}

function artifactSnapshot(value, label) {
  const artifact = dataObject(value, label, ARTIFACT_KEYS);
  const bytes = field(artifact, "bytes", label);
  if (!Number.isSafeInteger(bytes) || bytes <= 0) throw new TypeError(`${label}.bytes is invalid`);
  return Object.freeze({
    browser: stringField(artifact, "browser", label),
    file: stringField(artifact, "file", label),
    bytes,
    sha256: stringField(artifact, "sha256", label)
  });
}

function artifactArraySnapshot(value) {
  let isArray;
  let keys;
  try {
    isArray = Array.isArray(value);
    keys = isArray ? Reflect.ownKeys(value) : [];
  } catch {
    throw new TypeError("release manifest.artifacts is not safely inspectable");
  }
  if (!isArray || value.length !== 2) throw new TypeError("release manifest.artifacts must contain exactly two artifacts");
  const expectedKeys = new Set(["0", "1", "length"]);
  if (keys.length !== expectedKeys.size || keys.some((key) => typeof key !== "string" || !expectedKeys.has(key))) {
    throw new TypeError("release manifest.artifacts fields are invalid");
  }
  const result = [];
  for (let index = 0; index < 2; index += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, String(index)); }
    catch { throw new TypeError(`release manifest.artifacts.${index} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`release manifest.artifacts.${index} must be an enumerable data field`);
    }
    result.push(artifactSnapshot(descriptor.value, `release manifest.artifacts.${index}`));
  }
  return Object.freeze(result);
}

function releaseManifestSnapshot(value) {
  const manifest = dataObject(value, "release manifest");
  return Object.freeze({
    package: packageSnapshot(manifest, "release manifest"),
    sourceFingerprint: stringField(manifest, "sourceFingerprint", "release manifest"),
    artifacts: artifactArraySnapshot(field(manifest, "artifacts", "release manifest"))
  });
}

export function snapshotQualificationRecordInput(value) {
  const input = dataObject(value, "qualification record input", ROOT_KEYS);
  const gitHead = stringField(input, "gitHead", "qualification record input", { allowEmpty: true });
  const gitStatus = stringField(input, "gitStatus", "qualification record input", { allowEmpty: true });
  const nodeVersion = stringField(input, "nodeVersion", "qualification record input");
  const npmUserAgent = stringField(input, "npmUserAgent", "qualification record input");
  return Object.freeze({
    gitHead,
    gitStatus,
    currentBuildInfo: buildInfoSnapshot(field(input, "currentBuildInfo", "qualification record input"), "current source"),
    chromiumBuildInfo: buildInfoSnapshot(field(input, "chromiumBuildInfo", "qualification record input"), "Chromium build"),
    firefoxBuildInfo: buildInfoSnapshot(field(input, "firefoxBuildInfo", "qualification record input"), "Firefox build"),
    releaseManifest: releaseManifestSnapshot(field(input, "releaseManifest", "qualification record input")),
    nodeVersion,
    npmUserAgent
  });
}

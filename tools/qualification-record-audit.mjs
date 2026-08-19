import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  QUALIFICATION_PACKAGE_MAX_BYTES,
  QUALIFICATION_RECORD_MAX_BYTES,
  readQualificationUtf8File,
  readQualificationUtf8Stream
} from "./qualification-file-io.mjs";

const ROOT_KEYS = new Set(["schemaVersion", "package", "commit", "sourceFingerprint", "artifacts", "toolchain"]);
const PACKAGE_KEYS = new Set(["name", "version"]);
const ARTIFACTS_KEYS = new Set(["chromium", "firefox"]);
const ARTIFACT_KEYS = new Set(["file", "bytes", "sha256"]);
const TOOLCHAIN_KEYS = new Set(["node", "npm"]);
const VERSION_TEXT = /^\d+\.\d+\.\d+$/;
const COMMIT_TEXT = /^[0-9a-f]{40,64}$/;
const SHA256_TEXT = /^[0-9a-f]{64}$/;
const FINGERPRINT_TEXT = /^sha256:[0-9a-f]{64}$/;

function exactDataObject(value, allowedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  } catch {
    throw new TypeError(`${label} is not safely inspectable`);
  }
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`);
  if (keys.length !== allowedKeys.size || keys.some((key) => typeof key !== "string" || !allowedKeys.has(key))) {
    throw new TypeError(`${label} fields are invalid`);
  }
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError(`${label}.${key} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`${label}.${key} must be an enumerable data field`);
  }
  return value;
}

function field(value, key, label) {
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
  catch { throw new TypeError(`${label}.${key} is not safely inspectable`); }
  if (!descriptor || !("value" in descriptor)) throw new TypeError(`${label}.${key} is required`);
  return descriptor.value;
}

function boundedString(value, label, maxLength, pattern) {
  if (typeof value !== "string" || !value || value.length > maxLength || (pattern && !pattern.test(value))) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function validateArtifact(value, label, expectedFile) {
  exactDataObject(value, ARTIFACT_KEYS, label);
  const file = boundedString(field(value, "file", label), `${label}.file`, 256);
  if (file !== expectedFile || file.includes("/") || file.includes("\\")) throw new TypeError(`${label}.file is invalid`);
  const bytes = field(value, "bytes", label);
  if (!Number.isSafeInteger(bytes) || bytes <= 0) throw new TypeError(`${label}.bytes must be a positive safe integer`);
  boundedString(field(value, "sha256", label), `${label}.sha256`, 64, SHA256_TEXT);
}

export function validateQualificationRecord(record, { packageName, packageVersion } = {}) {
  exactDataObject(record, ROOT_KEYS, "qualification record");
  if (field(record, "schemaVersion", "qualification record") !== 4) throw new TypeError("qualification record schemaVersion must be 4");

  const packageValue = field(record, "package", "qualification record");
  exactDataObject(packageValue, PACKAGE_KEYS, "qualification record.package");
  const name = boundedString(field(packageValue, "name", "qualification record.package"), "qualification record.package.name", 128);
  const version = boundedString(field(packageValue, "version", "qualification record.package"), "qualification record.package.version", 64);
  if (packageName !== undefined && name !== packageName) throw new TypeError("qualification record package name does not match package.json");
  if (packageVersion !== undefined && version !== packageVersion) throw new TypeError("qualification record package version does not match package.json");

  boundedString(field(record, "commit", "qualification record"), "qualification record.commit", 64, COMMIT_TEXT);
  boundedString(field(record, "sourceFingerprint", "qualification record"), "qualification record.sourceFingerprint", 71, FINGERPRINT_TEXT);

  const artifacts = field(record, "artifacts", "qualification record");
  exactDataObject(artifacts, ARTIFACTS_KEYS, "qualification record.artifacts");
  validateArtifact(field(artifacts, "chromium", "qualification record.artifacts"), "qualification record.artifacts.chromium", `${name}-${version}-chromium.zip`);
  validateArtifact(field(artifacts, "firefox", "qualification record.artifacts"), "qualification record.artifacts.firefox", `${name}-${version}-firefox.xpi`);

  const toolchain = field(record, "toolchain", "qualification record");
  exactDataObject(toolchain, TOOLCHAIN_KEYS, "qualification record.toolchain");
  boundedString(field(toolchain, "node", "qualification record.toolchain"), "qualification record.toolchain.node", 64, VERSION_TEXT);
  boundedString(field(toolchain, "npm", "qualification record.toolchain"), "qualification record.toolchain.npm", 64, VERSION_TEXT);
  return true;
}

function mainModule() {
  if (!process.argv[1]) return false;
  try { return import.meta.url === pathToFileURL(resolve(process.argv[1])).href; }
  catch { return false; }
}

export async function readQualificationRecordAuditInput(root, candidate, stdin = process.stdin) {
  if (candidate === undefined) {
    return readQualificationUtf8Stream(stdin, {
      maxBytes: QUALIFICATION_RECORD_MAX_BYTES,
      label: "qualification record stdin"
    });
  }
  if (typeof candidate !== "string" || !candidate || isAbsolute(candidate)) {
    throw new Error("qualification record input path must be relative");
  }
  const inputPath = resolve(root, candidate);
  const child = relative(root, inputPath);
  if (!child || child.startsWith("..") || isAbsolute(child)) {
    throw new Error("qualification record input path must stay inside the repository");
  }
  return readQualificationUtf8File(inputPath, {
    maxBytes: QUALIFICATION_RECORD_MAX_BYTES,
    label: "qualification record"
  });
}

if (mainModule()) {
  try {
    const root = resolve(import.meta.dirname, "..");
    if (process.argv.length > 3) throw new Error("qualification-record-audit accepts at most one relative input path");
    const packageText = await readQualificationUtf8File(resolve(root, "package.json"), {
      maxBytes: QUALIFICATION_PACKAGE_MAX_BYTES,
      label: "package.json"
    });
    const packageJson = JSON.parse(packageText);
    const text = await readQualificationRecordAuditInput(root, process.argv[2]);
    const record = JSON.parse(text);
    validateQualificationRecord(record, { packageName: packageJson.name, packageVersion: packageJson.version });
    console.log("qualification-record-audit: exact privacy-minimal schema verified");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

import { lstat, mkdir, opendir } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { writePackageBinaryAtomic } from "./package-output-io.mjs";
import { readRegularFileBounded } from "./package-source-io.mjs";
import { RELEASE_ARCHIVE_LIMITS } from "./release-archive-contract.mjs";

const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;

export const ZIP_LIMITS = Object.freeze({
  maxEntries: RELEASE_ARCHIVE_LIMITS.maxEntries,
  maxArchiveBytes: RELEASE_ARCHIVE_LIMITS.maxArchiveBytes,
  maxEntryNameBytes: RELEASE_ARCHIVE_LIMITS.maxPathBytes,
  maxEntryBytes: RELEASE_ARCHIVE_LIMITS.maxEntryBytes,
  maxTotalUncompressedBytes: RELEASE_ARCHIVE_LIMITS.maxTotalUncompressedBytes,
  maxSourceDirectories: RELEASE_ARCHIVE_LIMITS.maxSourceDirectories,
  maxSourcePathBytes: RELEASE_ARCHIVE_LIMITS.maxSourcePathBytes
});

const CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

export function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function validateZipEntryName(name) {
  if (typeof name !== "string" || !name) throw new Error("ZIP entry name is required");
  if (name.startsWith("/") || name.startsWith("\\") || /^[A-Za-z]:/.test(name)) throw new Error(`ZIP entry name must be relative: ${name}`);
  if (name.includes("\\")) throw new Error(`ZIP entry name must use forward slashes: ${name}`);
  if (name.endsWith("/")) throw new Error(`ZIP directory entries are not supported: ${name}`);
  const parts = name.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) throw new Error(`ZIP entry name is unsafe: ${name}`);
  if (name.includes("\0")) throw new Error("ZIP entry name cannot contain NUL");
  const nameBytes = Buffer.byteLength(name, "utf8");
  if (nameBytes > ZIP_LIMITS.maxEntryNameBytes || nameBytes > 0xffff) throw new Error(`ZIP entry name is too large: ${name}`);
  return name;
}

export function validateZipEntryResourceLimits({ entryCount, entryBytes, totalBytes, offset = 0 }) {
  if (!Number.isSafeInteger(entryCount) || entryCount < 0 || entryCount > ZIP_LIMITS.maxEntries || entryCount > 0xffff) {
    throw new Error("ZIP entry count exceeds supported limit");
  }
  if (!Number.isSafeInteger(entryBytes) || entryBytes < 0 || entryBytes > ZIP_LIMITS.maxEntryBytes || entryBytes > 0xffffffff) {
    throw new Error("ZIP entry byte size exceeds supported limit");
  }
  if (!Number.isSafeInteger(totalBytes) || totalBytes < 0 || totalBytes > ZIP_LIMITS.maxTotalUncompressedBytes) {
    throw new Error("ZIP total uncompressed size exceeds supported limit");
  }
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 0xffffffff) throw new Error("ZIP local-header offset exceeds classic ZIP limit");
  return true;
}

function dataProperty(object, key, label) {
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(object, key); }
  catch { throw new TypeError(`${label}.${String(key)} is not safely inspectable`); }
  if (!descriptor || !("value" in descriptor)) throw new TypeError(`${label}.${String(key)} must be a data property`);
  return descriptor.value;
}

function snapshotZipEntry(entry, index) {
  const label = `ZIP entry ${index}`;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError(`${label} must be a plain object`);
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(entry);
    keys = Reflect.ownKeys(entry);
  } catch {
    throw new TypeError(`${label} is not safely inspectable`);
  }
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`);
  if (keys.length !== 2 || !keys.includes("name") || !keys.includes("data") || keys.some((key) => typeof key !== "string")) {
    throw new TypeError(`${label} fields are invalid`);
  }
  for (const key of keys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(entry, key); }
    catch { throw new TypeError(`${label}.${String(key)} is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError(`${label}.${String(key)} must be an enumerable data property`);
  }

  const name = validateZipEntryName(dataProperty(entry, "name", label));
  const rawData = dataProperty(entry, "data", label);
  let data;
  if (typeof rawData === "string") data = Buffer.from(rawData, "utf8");
  else if (Buffer.isBuffer(rawData) || rawData instanceof Uint8Array) data = Buffer.from(rawData);
  else throw new TypeError(`${label}.data must be a string, Buffer, or Uint8Array`);
  return Object.freeze({ name, data });
}

export function snapshotZipEntries(entries) {
  if (!Array.isArray(entries)) throw new TypeError("ZIP entries must be an array");
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(entries);
    keys = Reflect.ownKeys(entries);
  } catch {
    throw new TypeError("ZIP entries are not safely inspectable");
  }
  if (prototype !== Array.prototype) throw new TypeError("ZIP entries must use the standard Array prototype");
  const length = dataProperty(entries, "length", "ZIP entries");
  validateZipEntryResourceLimits({ entryCount: length, entryBytes: 0, totalBytes: 0 });
  const allowed = new Set(["length", ...Array.from({ length }, (_, index) => String(index))]);
  if (keys.some((key) => typeof key !== "string" || !allowed.has(key)) || keys.length !== length + 1) {
    throw new TypeError("ZIP entries must be a dense array without extra fields");
  }

  const snapshot = [];
  let totalBytes = 0;
  for (let index = 0; index < length; index += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(entries, String(index)); }
    catch { throw new TypeError(`ZIP entries[${index}] is not safely inspectable`); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new TypeError("ZIP entries must be dense enumerable data properties");
    const entry = snapshotZipEntry(descriptor.value, index);
    totalBytes += entry.data.length;
    validateZipEntryResourceLimits({ entryCount: length, entryBytes: entry.data.length, totalBytes });
    snapshot.push(entry);
  }
  return snapshot;
}

function filesystemType(stat) {
  if (stat.isSymbolicLink()) return "symlink";
  if (stat.isDirectory()) return "directory";
  if (stat.isFile()) return "file";
  if (stat.isSocket?.()) return "socket";
  if (stat.isFIFO?.()) return "fifo";
  if (stat.isBlockDevice?.()) return "block-device";
  if (stat.isCharacterDevice?.()) return "character-device";
  return "unknown";
}

async function filesUnder(directory) {
  const rootStat = await lstat(directory);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) throw new Error(`ZIP source root must be a real directory: ${directory}`);

  const result = [];
  let directories = 0;
  let discoveredEntries = 0;
  const maxDiscoveredEntries = ZIP_LIMITS.maxEntries + ZIP_LIMITS.maxSourceDirectories;

  function boundedSourcePath(path) {
    const sourcePath = relative(directory, path).split(sep).join("/");
    if (!sourcePath || sourcePath === ".." || sourcePath.startsWith("../") || Buffer.byteLength(sourcePath, "utf8") > ZIP_LIMITS.maxSourcePathBytes) {
      throw new Error(`ZIP source path exceeds supported traversal boundary: ${path}`);
    }
    return sourcePath;
  }

  async function walk(current) {
    directories += 1;
    if (directories > ZIP_LIMITS.maxSourceDirectories) throw new Error("ZIP source directory count exceeds supported limit");
    if (current !== directory) boundedSourcePath(current);
    const currentStat = await lstat(current);
    if (currentStat.isSymbolicLink() || !currentStat.isDirectory()) throw new Error(`Cannot package non-directory traversal entry: ${current}`);

    const entries = [];
    const dir = await opendir(current);
    for await (const entry of dir) {
      discoveredEntries += 1;
      if (discoveredEntries > maxDiscoveredEntries) throw new Error("ZIP source discovery count exceeds supported limit");
      entries.push(entry);
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const path = join(current, entry.name);
      boundedSourcePath(path);
      const stat = await lstat(path);
      const type = filesystemType(stat);
      if (type === "directory") await walk(path);
      else if (type === "file") {
        result.push(path);
        validateZipEntryResourceLimits({ entryCount: result.length, entryBytes: stat.size, totalBytes: 0 });
      } else throw new Error(`Cannot package non-regular filesystem entry (${type}): ${path}`);
    }
  }
  await walk(directory);
  return result;
}

function makeEntry(name, data, offset) {
  const safeName = validateZipEntryName(name);
  const nameBytes = Buffer.from(safeName, "utf8");
  validateZipEntryResourceLimits({ entryCount: 1, entryBytes: data.length, totalBytes: data.length, offset });
  const checksum = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(UTF8_FLAG, 6);
  local.writeUInt16LE(STORE_METHOD, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  local.writeUInt16LE(0, 28);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(UTF8_FLAG, 8);
  central.writeUInt16LE(STORE_METHOD, 10);
  central.writeUInt16LE(0, 12);
  central.writeUInt16LE(0, 14);
  central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  central.writeUInt16LE(0, 30);
  central.writeUInt16LE(0, 32);
  central.writeUInt16LE(0, 34);
  central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38);
  central.writeUInt32LE(offset, 42);

  return {
    local: Buffer.concat([local, nameBytes, data]),
    central: Buffer.concat([central, nameBytes])
  };
}

export function createStoredZipBuffer(entries) {
  const normalized = snapshotZipEntries(entries);
  let totalUncompressedBytes = 0;
  for (const entry of normalized) totalUncompressedBytes += entry.data.length;
  normalized.sort((a, b) => a.name.localeCompare(b.name));

  const seen = new Set();
  for (const entry of normalized) {
    if (seen.has(entry.name)) throw new Error(`Duplicate ZIP entry name: ${entry.name}`);
    seen.add(entry.name);
  }

  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of normalized) {
    validateZipEntryResourceLimits({
      entryCount: normalized.length,
      entryBytes: entry.data.length,
      totalBytes: totalUncompressedBytes,
      offset
    });
    const encoded = makeEntry(entry.name, entry.data, offset);
    localParts.push(encoded.local);
    centralParts.push(encoded.central);
    offset += encoded.local.length;
    if (offset > 0xffffffff) throw new Error("ZIP exceeds classic ZIP local-data size limit");
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const finalArchiveBytes = offset + centralSize + 22;
  if (!Number.isSafeInteger(finalArchiveBytes) || centralSize > 0xffffffff || finalArchiveBytes > 0xffffffff) {
    throw new Error("ZIP exceeds classic ZIP size limits");
  }
  if (finalArchiveBytes > ZIP_LIMITS.maxArchiveBytes) {
    throw new Error("ZIP archive exceeds release byte ceiling before final allocation");
  }

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(normalized.length, 8);
  end.writeUInt16LE(normalized.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end], finalArchiveBytes);
}

export async function makeStoredZip(sourceDirectory, outputPath) {
  const paths = await filesUnder(sourceDirectory);
  const entries = [];
  let totalBytes = 0;
  for (const path of paths) {
    const data = await readRegularFileBounded(path, {
      maxBytes: ZIP_LIMITS.maxEntryBytes,
      label: `ZIP source file ${path}`
    });
    totalBytes += data.length;
    validateZipEntryResourceLimits({ entryCount: paths.length, entryBytes: data.length, totalBytes });
    entries.push({
      name: relative(sourceDirectory, path).split(sep).join("/"),
      data
    });
  }
  const zip = createStoredZipBuffer(entries);
  await mkdir(dirname(outputPath), { recursive: true });
  await writePackageBinaryAtomic(outputPath, zip, { maxBytes: ZIP_LIMITS.maxArchiveBytes });
  return { bytes: zip.byteLength, entries: entries.length };
}

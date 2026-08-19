import { lstat, open, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { readRegularFileBounded } from "./package-source-io.mjs";
import { RELEASE_ARCHIVE_LIMITS } from "./release-archive-contract.mjs";

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const END_SIGNATURE = 0x06054b50;
const ZIP_VERSION = 20;
const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;

export const ZIP_VERIFY_LIMITS = RELEASE_ARCHIVE_LIMITS;
// Historical M1116 source marker: maxArchiveBytes: 64 * 1024 * 1024

const VERIFY_CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

function verificationCrc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = VERIFY_CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function requireRange(buffer, offset, length, label) {
  if (!Number.isInteger(offset) || !Number.isInteger(length) || offset < 0 || length < 0 || offset + length > buffer.length) {
    throw new Error(`${label} exceeds archive bounds`);
  }
}

function decodeName(bytes) {
  if (bytes.length <= 0 || bytes.length > ZIP_VERIFY_LIMITS.maxPathBytes) throw new Error("ZIP entry name exceeds verification byte ceiling");
  const name = bytes.toString("utf8");
  if (!Buffer.from(name, "utf8").equals(bytes)) throw new Error("ZIP entry name is not valid UTF-8");
  return name;
}

function validateArchiveName(name) {
  if (!name) throw new Error("ZIP entry name is empty");
  if (name.startsWith("/") || name.startsWith("\\") || /^[A-Za-z]:/.test(name)) throw new Error(`ZIP entry name is absolute: ${name}`);
  if (name.includes("\\")) throw new Error(`ZIP entry name uses backslashes: ${name}`);
  if (name.endsWith("/")) throw new Error(`ZIP directory entry is not allowed: ${name}`);
  const parts = name.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) throw new Error(`ZIP entry name is unsafe: ${name}`);
  if (name.includes("\0")) throw new Error("ZIP entry name contains NUL");
}

function sameIdentity(before, opened) {
  if (before.size !== opened.size) return false;
  if (Number.isSafeInteger(before.dev) && Number.isSafeInteger(opened.dev) && before.dev !== opened.dev) return false;
  if (Number.isSafeInteger(before.ino) && Number.isSafeInteger(opened.ino) && before.ino !== opened.ino) return false;
  return true;
}

async function readBoundedArchive(path) {
  const before = await lstat(path);
  if (before.isSymbolicLink() || !before.isFile()) throw new TypeError("ZIP archive must be a regular non-symlink file");
  if (!Number.isSafeInteger(before.size) || before.size <= 0 || before.size > ZIP_VERIFY_LIMITS.maxArchiveBytes) {
    throw new RangeError("ZIP archive exceeds verification byte ceiling before allocation");
  }
  const handle = await open(path, "r");
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || !sameIdentity(before, opened)) throw new Error("ZIP archive changed before bounded read");
    const buffer = Buffer.alloc(opened.size);
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesRead } = await handle.read(buffer, offset, buffer.length - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset !== buffer.length) throw new Error("ZIP archive size changed during bounded read");
    const after = await handle.stat();
    if (after.size !== opened.size || after.mtimeMs !== opened.mtimeMs || after.ctimeMs !== opened.ctimeMs) throw new Error("ZIP archive changed during bounded read");
    return buffer;
  } finally {
    await handle.close();
  }
}

export function parseProjectStoredZip(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buffer.length > ZIP_VERIFY_LIMITS.maxArchiveBytes) throw new Error("ZIP archive exceeds verification byte ceiling");
  if (buffer.length < 22) throw new Error("ZIP archive is too small");

  const endOffset = buffer.length - 22;
  if (buffer.readUInt32LE(endOffset) !== END_SIGNATURE) throw new Error("ZIP end-of-central-directory record is missing or archive has trailing data");
  const diskNumber = buffer.readUInt16LE(endOffset + 4);
  const centralDisk = buffer.readUInt16LE(endOffset + 6);
  const entriesOnDisk = buffer.readUInt16LE(endOffset + 8);
  const totalEntries = buffer.readUInt16LE(endOffset + 10);
  const centralSize = buffer.readUInt32LE(endOffset + 12);
  const centralOffset = buffer.readUInt32LE(endOffset + 16);
  const commentLength = buffer.readUInt16LE(endOffset + 20);
  if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== totalEntries) throw new Error("Multi-disk ZIP archives are not supported");
  if (commentLength !== 0) throw new Error("ZIP comments are not permitted");
  if (totalEntries > ZIP_VERIFY_LIMITS.maxEntries) throw new Error("ZIP entry count exceeds verification ceiling");
  if (centralOffset + centralSize !== endOffset) throw new Error("ZIP central-directory bounds are inconsistent");

  const entries = [];
  const seen = new Set();
  let centralCursor = centralOffset;
  let expectedLocalOffset = 0;
  let totalUncompressedBytes = 0;
  let previousName = null;

  for (let index = 0; index < totalEntries; index += 1) {
    requireRange(buffer, centralCursor, 46, "ZIP central header");
    if (buffer.readUInt32LE(centralCursor) !== CENTRAL_SIGNATURE) throw new Error(`ZIP central header ${index} signature is invalid`);

    const versionMadeBy = buffer.readUInt16LE(centralCursor + 4);
    const versionNeeded = buffer.readUInt16LE(centralCursor + 6);
    const flags = buffer.readUInt16LE(centralCursor + 8);
    const method = buffer.readUInt16LE(centralCursor + 10);
    const modTime = buffer.readUInt16LE(centralCursor + 12);
    const modDate = buffer.readUInt16LE(centralCursor + 14);
    const checksum = buffer.readUInt32LE(centralCursor + 16);
    const compressedSize = buffer.readUInt32LE(centralCursor + 20);
    const uncompressedSize = buffer.readUInt32LE(centralCursor + 24);
    const nameLength = buffer.readUInt16LE(centralCursor + 28);
    const extraLength = buffer.readUInt16LE(centralCursor + 30);
    const entryCommentLength = buffer.readUInt16LE(centralCursor + 32);
    const diskStart = buffer.readUInt16LE(centralCursor + 34);
    const internalAttributes = buffer.readUInt16LE(centralCursor + 36);
    const externalAttributes = buffer.readUInt32LE(centralCursor + 38);
    const localOffset = buffer.readUInt32LE(centralCursor + 42);

    if (versionMadeBy !== ZIP_VERSION || versionNeeded !== ZIP_VERSION) throw new Error(`ZIP entry ${index} has unexpected version fields`);
    if (flags !== UTF8_FLAG) throw new Error(`ZIP entry ${index} has unexpected flags`);
    if (method !== STORE_METHOD) throw new Error(`ZIP entry ${index} uses unsupported compression`);
    if (modTime !== 0 || modDate !== 0) throw new Error(`ZIP entry ${index} contains nondeterministic timestamp fields`);
    if (extraLength !== 0 || entryCommentLength !== 0) throw new Error(`ZIP entry ${index} contains unsupported extra/comment data`);
    if (diskStart !== 0 || internalAttributes !== 0 || externalAttributes !== 0) throw new Error(`ZIP entry ${index} contains non-canonical disk/attribute fields`);
    if (compressedSize !== uncompressedSize) throw new Error(`ZIP entry ${index} stored size fields differ`);
    if (uncompressedSize > ZIP_VERIFY_LIMITS.maxEntryBytes) throw new Error(`ZIP entry ${index} exceeds verification byte ceiling`);
    totalUncompressedBytes += uncompressedSize;
    if (totalUncompressedBytes > ZIP_VERIFY_LIMITS.maxTotalUncompressedBytes) throw new Error("ZIP total uncompressed bytes exceed verification ceiling");
    if (localOffset !== expectedLocalOffset) throw new Error(`ZIP entry ${index} local offset is non-contiguous or hides unreferenced data`);

    const centralNameOffset = centralCursor + 46;
    requireRange(buffer, centralNameOffset, nameLength, "ZIP central entry name");
    const centralNameBytes = buffer.subarray(centralNameOffset, centralNameOffset + nameLength);
    const name = decodeName(centralNameBytes);
    validateArchiveName(name);
    if (previousName !== null && name.localeCompare(previousName) <= 0) throw new Error(`ZIP central entry order is non-canonical near ${name}`);
    previousName = name;
    if (seen.has(name)) throw new Error(`Duplicate ZIP entry name: ${name}`);
    seen.add(name);

    requireRange(buffer, localOffset, 30, "ZIP local header");
    if (buffer.readUInt32LE(localOffset) !== LOCAL_SIGNATURE) throw new Error(`ZIP local header for ${name} has invalid signature`);
    if (buffer.readUInt16LE(localOffset + 4) !== ZIP_VERSION) throw new Error(`ZIP local version-needed field disagrees for ${name}`);
    if (buffer.readUInt16LE(localOffset + 6) !== flags) throw new Error(`ZIP local flags disagree for ${name}`);
    if (buffer.readUInt16LE(localOffset + 8) !== method) throw new Error(`ZIP local compression method disagrees for ${name}`);
    if (buffer.readUInt16LE(localOffset + 10) !== modTime || buffer.readUInt16LE(localOffset + 12) !== modDate) throw new Error(`ZIP local timestamp fields disagree for ${name}`);
    if (buffer.readUInt32LE(localOffset + 14) !== checksum) throw new Error(`ZIP local CRC disagrees for ${name}`);
    if (buffer.readUInt32LE(localOffset + 18) !== compressedSize || buffer.readUInt32LE(localOffset + 22) !== uncompressedSize) throw new Error(`ZIP local size fields disagree for ${name}`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    if (localNameLength !== nameLength || localExtraLength !== 0) throw new Error(`ZIP local name/extra fields are invalid for ${name}`);

    const localNameOffset = localOffset + 30;
    requireRange(buffer, localNameOffset, localNameLength, "ZIP local entry name");
    const localNameBytes = buffer.subarray(localNameOffset, localNameOffset + localNameLength);
    if (!localNameBytes.equals(centralNameBytes)) throw new Error(`ZIP local/central entry names disagree for ${name}`);

    const dataOffset = localNameOffset + localNameLength;
    requireRange(buffer, dataOffset, compressedSize, `ZIP payload for ${name}`);
    const dataEnd = dataOffset + compressedSize;
    if (dataEnd > centralOffset) throw new Error(`ZIP payload for ${name} overlaps central directory`);
    const data = buffer.subarray(dataOffset, dataEnd);
    if (verificationCrc32(data) !== checksum) throw new Error(`ZIP CRC mismatch for ${name}`);

    entries.push({ name, bytes: data.length, data: Buffer.from(data) });
    expectedLocalOffset = dataEnd;
    centralCursor = centralNameOffset + nameLength;
  }

  if (expectedLocalOffset !== centralOffset) throw new Error("ZIP contains hidden or unreferenced data before the central directory");
  if (centralCursor !== endOffset) throw new Error("ZIP central-directory size or entry count is inconsistent");
  return entries;
}

function filesystemType(stat) {
  if (stat.isSymbolicLink()) return "symlink";
  if (stat.isDirectory()) return "directory";
  if (stat.isFile()) return "file";
  return "non-regular";
}

async function directoryFiles(directory) {
  const rootStat = await lstat(directory);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) throw new Error(`Generated tree root must be a real directory: ${directory}`);
  const files = [];
  async function walk(current) {
    const currentStat = await lstat(current);
    if (currentStat.isSymbolicLink() || !currentStat.isDirectory()) throw new Error(`Generated tree traversal entry must be a real directory: ${current}`);
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const path = join(current, entry.name);
      const stat = await lstat(path);
      const type = filesystemType(stat);
      if (type === "directory") await walk(path);
      else if (type === "file") files.push(path);
      else throw new Error(`Generated tree contains non-regular entry (${type}): ${path}`);
    }
  }
  await walk(directory);
  return files;
}

export async function verifyStoredZipAgainstDirectory(archivePath, directory) {
  const archiveEntries = parseProjectStoredZip(await readBoundedArchive(archivePath));
  const sourceEntries = (await directoryFiles(directory))
    .map((path) => ({ path, name: relative(directory, path).split(sep).join("/") }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const archiveNames = archiveEntries.map((entry) => entry.name);
  const sourceNames = sourceEntries.map((entry) => entry.name);
  if (JSON.stringify(archiveNames) !== JSON.stringify(sourceNames)) {
    throw new Error(`Archive entry set does not match generated tree: archive=${JSON.stringify(archiveNames)} source=${JSON.stringify(sourceNames)}`);
  }

  for (let index = 0; index < sourceEntries.length; index += 1) {
    const sourceData = await readRegularFileBounded(sourceEntries[index].path, {
      maxBytes: ZIP_VERIFY_LIMITS.maxEntryBytes,
      label: `generated archive source ${sourceEntries[index].name}`
    });
    const archiveData = archiveEntries[index].data;
    if (!archiveData.equals(sourceData)) throw new Error(`Archive payload differs from generated tree for ${sourceEntries[index].name}`);
  }

  return { entries: archiveEntries.length, files: archiveNames };
}

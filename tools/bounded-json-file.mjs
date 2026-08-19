import { lstat, open } from "node:fs/promises";

export const RELEASE_JSON_DEFAULT_MAX_BYTES = 256 * 1024;
const CHUNK_BYTES = 64 * 1024;

function stableIdentity(before, opened, after) {
  if (typeof before.dev === "number" && typeof opened.dev === "number" && before.dev !== opened.dev) return false;
  if (typeof before.ino === "number" && typeof opened.ino === "number" && before.ino !== opened.ino) return false;
  if (opened.size !== after.size) return false;
  if (typeof opened.mtimeMs === "number" && typeof after.mtimeMs === "number" && opened.mtimeMs !== after.mtimeMs) return false;
  return true;
}

export async function readBoundedUtf8File(path, { maxBytes = RELEASE_JSON_DEFAULT_MAX_BYTES, label = "file" } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new TypeError("maxBytes must be a positive safe integer");
  const before = await lstat(path);
  if (before.isSymbolicLink() || !before.isFile()) throw new TypeError(`${label} must be a regular non-symlink file`);
  if (before.size <= 0 || before.size > maxBytes) throw new TypeError(`${label} byte size is invalid`);

  const handle = await open(path, "r");
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.size <= 0 || opened.size > maxBytes) throw new TypeError(`${label} byte size is invalid`);
    if (!stableIdentity(before, opened, opened)) throw new TypeError(`${label} changed before reading`);

    const parts = [];
    let total = 0;
    const buffer = Buffer.allocUnsafe(Math.min(CHUNK_BYTES, maxBytes + 1));
    while (true) {
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      total += bytesRead;
      if (total > maxBytes) throw new TypeError(`${label} exceeds byte limit`);
      parts.push(Buffer.from(buffer.subarray(0, bytesRead)));
    }
    if (total === 0) throw new TypeError(`${label} must not be empty`);

    const after = await handle.stat();
    if (after.size !== total || !stableIdentity(before, opened, after)) throw new TypeError(`${label} changed while reading`);

    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts, total));
    } catch {
      throw new TypeError(`${label} must be valid UTF-8`);
    }
  } finally {
    await handle.close();
  }
}

export async function readBoundedJsonFile(path, options = {}) {
  const label = options?.label ?? "JSON file";
  const text = await readBoundedUtf8File(path, options);
  try {
    return JSON.parse(text);
  } catch {
    throw new TypeError(`${label} must contain valid JSON`);
  }
}

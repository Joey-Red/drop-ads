import { lstat, open } from "node:fs/promises";

function sameIdentity(before, opened) {
  if (before.size !== opened.size) return false;
  if (Number.isSafeInteger(before.dev) && Number.isSafeInteger(opened.dev) && before.dev !== opened.dev) return false;
  if (Number.isSafeInteger(before.ino) && Number.isSafeInteger(opened.ino) && before.ino !== opened.ino) return false;
  return true;
}

export async function readRegularFileBounded(path, { maxBytes, label = "package source file", allowEmpty = true } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new TypeError("package source maxBytes must be a positive safe integer");
  const before = await lstat(path);
  if (before.isSymbolicLink() || !before.isFile()) throw new TypeError(`${label} must be a regular non-symlink file`);
  if (!Number.isSafeInteger(before.size) || before.size < 0 || (!allowEmpty && before.size === 0) || before.size > maxBytes) {
    throw new RangeError(`${label} exceeds its byte ceiling before allocation`);
  }

  const handle = await open(path, "r");
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || !sameIdentity(before, opened)) throw new Error(`${label} changed before bounded read`);
    const data = Buffer.alloc(opened.size);
    let offset = 0;
    while (offset < data.length) {
      const { bytesRead } = await handle.read(data, offset, data.length - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset !== data.length) throw new Error(`${label} size changed during bounded read`);
    const after = await handle.stat();
    if (!after.isFile() || !sameIdentity(opened, after) || after.mtimeMs !== opened.mtimeMs || after.ctimeMs !== opened.ctimeMs) {
      throw new Error(`${label} changed during bounded read`);
    }
    return data;
  } finally {
    await handle.close();
  }
}

import { randomBytes } from "node:crypto";
import { dirname } from "node:path";
import { lstat, open, rename, unlink } from "node:fs/promises";
import { MAX_COMMUNITY_LIST_BYTES } from "./community-validation.mjs";

// Preserve a leading BOM in decoded text so validateListText can reject it. With
// ignoreBOM=false TextDecoder consumes the UTF-8 signature before validation.
const UTF8_FATAL = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

function validateListText(text) {
  if (typeof text !== "string") throw new TypeError("Community list output must be text");
  if (Buffer.byteLength(text, "utf8") > MAX_COMMUNITY_LIST_BYTES) throw new Error("Community list is too large");
  if (text.startsWith("\uFEFF")) throw new Error("Community list must not contain a UTF-8 BOM");
  if (text.includes("\0")) throw new Error("Community list must not contain NUL bytes");
  if (text.includes("\r")) throw new Error("Community list must use LF line endings");
  if (text.length > 0 && !text.endsWith("\n")) throw new Error("Community list must end with LF");
  return text;
}

async function syncParentDirectory(path) {
  if (process.platform === "win32") return;
  const parentHandle = await open(dirname(path), "r");
  try { await parentHandle.sync(); }
  finally { await parentHandle.close(); }
}

export async function readCommunityListFile(path) {
  const metadata = await lstat(path);
  if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error("Community list must be a regular non-symlink file");
  if (metadata.size > MAX_COMMUNITY_LIST_BYTES) throw new Error("Community list is too large");

  const handle = await open(path, "r");
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > MAX_COMMUNITY_LIST_BYTES) throw new Error("Community list is too large");
    const bytes = await handle.readFile();
    const after = await handle.stat();
    if (bytes.byteLength !== before.size || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) {
      throw new Error("Community list changed while it was being read");
    }
    let text;
    try { text = UTF8_FATAL.decode(bytes); }
    catch { throw new Error("Community list must be valid UTF-8"); }
    return validateListText(text);
  } finally {
    await handle.close();
  }
}

export async function writeCommunityListFileAtomic(path, text) {
  const safeText = validateListText(text);
  const parent = await lstat(dirname(path));
  if (!parent.isDirectory() || parent.isSymbolicLink()) throw new Error("Community list parent must be a real directory");
  const before = await lstat(path);
  if (!before.isFile() || before.isSymbolicLink()) throw new Error("Community list must be a regular non-symlink file");

  const tempPath = `${path}.tmp-${process.pid}-${randomBytes(8).toString("hex")}`;
  let handle = null;
  let replaced = false;
  try {
    handle = await open(tempPath, "wx", 0o600);
    await handle.writeFile(safeText, "utf8");
    if (process.platform !== "win32") await handle.chmod(before.mode & 0o777);
    await handle.sync();
    await handle.close();
    handle = null;

    const current = await lstat(path);
    if (!current.isFile() || current.isSymbolicLink()
      || current.dev !== before.dev || current.ino !== before.ino
      || current.size !== before.size || current.mtimeMs !== before.mtimeMs || current.ctimeMs !== before.ctimeMs) {
      throw new Error("Community list changed before atomic replacement");
    }
    await rename(tempPath, path);
    replaced = true;
    await syncParentDirectory(path);
  } catch (error) {
    try { await handle?.close(); } catch { }
    if (!replaced) {
      try { await unlink(tempPath); } catch { }
    }
    throw error;
  }
}

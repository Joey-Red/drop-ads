import { lstat, open } from "node:fs/promises";
import { MAX_COMMUNITY_SUBMISSION_BODY_BYTES } from "./community-validation.mjs";

const UTF8_FATAL = new TextDecoder("utf-8", { fatal: true });

export async function readCommunitySubmissionBodyFile(path) {
  if (typeof path !== "string" || !path) throw new TypeError("Community submission body path is required");
  const metadata = await lstat(path);
  if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error("Community submission body must be a regular non-symlink file");
  if (metadata.size > MAX_COMMUNITY_SUBMISSION_BODY_BYTES) throw new Error("Community submission body is too large");

  const handle = await open(path, "r");
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > MAX_COMMUNITY_SUBMISSION_BODY_BYTES) throw new Error("Community submission body is too large");
    const bytes = await handle.readFile();
    const after = await handle.stat();
    if (bytes.byteLength !== before.size || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) {
      throw new Error("Community submission body changed while it was being read");
    }
    try { return UTF8_FATAL.decode(bytes); }
    catch { throw new Error("Community submission body must be valid UTF-8"); }
  } finally {
    await handle.close();
  }
}

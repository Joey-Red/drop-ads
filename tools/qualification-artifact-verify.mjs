import { createHash } from "node:crypto";
import { lstat, open } from "node:fs/promises";

const HASH_CHUNK_BYTES = 64 * 1024;
const SHA256_TEXT = /^[0-9a-f]{64}$/;

export async function verifyQualificationArtifactFile(path, expected, label = "qualification artifact") {
  if (!expected || typeof expected !== "object") throw new TypeError(`${label} expectation is invalid`);
  if (!Number.isSafeInteger(expected.bytes) || expected.bytes <= 0) throw new TypeError(`${label} expected byte size is invalid`);
  if (typeof expected.sha256 !== "string" || !SHA256_TEXT.test(expected.sha256)) throw new TypeError(`${label} expected SHA-256 is invalid`);

  const linkStat = await lstat(path);
  if (linkStat.isSymbolicLink() || !linkStat.isFile()) throw new TypeError(`${label} must be a regular non-symlink file`);

  const handle = await open(path, "r");
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new TypeError(`${label} must be a regular file`);
    if (stat.size !== expected.bytes) throw new Error(`${label} byte size does not match release manifest`);

    const hash = createHash("sha256");
    let total = 0;
    while (true) {
      const buffer = Buffer.allocUnsafe(HASH_CHUNK_BYTES);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      total += bytesRead;
      if (total > expected.bytes) throw new Error(`${label} grew while being verified`);
      hash.update(buffer.subarray(0, bytesRead));
    }

    if (total !== expected.bytes) throw new Error(`${label} byte size changed while being verified`);
    if (hash.digest("hex") !== expected.sha256) throw new Error(`${label} SHA-256 does not match release manifest`);
    return true;
  } finally {
    await handle.close();
  }
}

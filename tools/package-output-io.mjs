import { open, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  assertAtomicOutputParentUnchanged,
  assertAtomicOutputPublished,
  createAtomicOutputTempPath,
  snapshotAtomicOutputParent
} from "./atomic-output-temp.mjs";

export const PACKAGE_OUTPUT_MAX_BYTES = 512 * 1024 * 1024;

export async function writePackageBinaryAtomic(outputPath, data, { maxBytes = PACKAGE_OUTPUT_MAX_BYTES } = {}) {
  if (!Buffer.isBuffer(data) && !(data instanceof Uint8Array)) throw new TypeError("Package output must be binary data");
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new TypeError("Package output byte ceiling is invalid");
  const bytes = data.byteLength;
  if (bytes <= 0 || bytes > maxBytes) throw new TypeError("Package output byte size is invalid");

  const output = resolve(outputPath);
  const parent = dirname(output);
  const parentSnapshot = await snapshotAtomicOutputParent(parent);

  const temp = createAtomicOutputTempPath(output);
  let handle;
  try {
    handle = await open(temp, "wx", 0o600);
    await handle.writeFile(data);
    await handle.sync();
    await handle.close();
    handle = null;
    await assertAtomicOutputParentUnchanged(parentSnapshot);
    await rename(temp, output);
    await assertAtomicOutputPublished(output, bytes);
  } catch (error) {
    try { await handle?.close(); } catch { /* best-effort cleanup */ }
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
  return Object.freeze({ path: output, bytes });
}

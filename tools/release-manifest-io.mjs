import { basename, dirname } from "node:path";
import { RELEASE_MANIFEST_MAX_BYTES, serializeReleaseManifest } from "./release-manifest.mjs";
import { writeReleaseOutputTextAtomic } from "./release-output-io.mjs";

export async function writeReleaseManifestAtomic(outputPath, manifest) {
  if (typeof outputPath !== "string" || !outputPath) throw new TypeError("release manifest output path is required");

  const serialized = serializeReleaseManifest(manifest);
  if (Buffer.byteLength(serialized, "utf8") > RELEASE_MANIFEST_MAX_BYTES) {
    throw new RangeError("release manifest exceeds its byte ceiling");
  }

  await writeReleaseOutputTextAtomic(dirname(outputPath), basename(outputPath), serialized);
  return outputPath;
}

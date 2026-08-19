import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const GUIDE = "docs/GENERATED_VERIFICATION_RESULT_QUALIFICATION.md";
const MARKERS = Object.freeze([
  "Issue #10 remains the authoritative browser-observation gate",
  "exact-head Chromium and Firefox qualification",
  "Passing source audits is not a Chromium or Firefox qualification result",
  "exact frozen own-data object containing only `browser`, `sourceFingerprint`, and `files`",
  "`files` is frozen, deterministic, canonical, and bounded",
  "exactly 64 lowercase hexadecimal characters representing SHA-256",
  "Both browser child fingerprints exactly equal the paired shared fingerprint",
  "fails closed rather than returning success",
  "No result/preflight path records",
  "Do not treat repository tests, audits, fixtures, generated records, or this guide as a browser pass"
]);

export async function auditGeneratedVerificationResultQualification(rootDirectory) {
  const root = resolve(rootDirectory);
  const guide = await readFile(resolve(root, GUIDE), "utf8");
  const violations = MARKERS.filter((marker) => !guide.includes(marker)).map((marker) => `missing qualification marker: ${marker}`);
  if (violations.length) throw new Error("Generated verification result qualification audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  return Object.freeze({ marker: "canonical M1242 generated verification result qualification guidance verified" });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = resolve(import.meta.dirname, "..");
  auditGeneratedVerificationResultQualification(root)
    .then((result) => console.log(`Generated verification result qualification audit passed: ${result.marker}.`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}

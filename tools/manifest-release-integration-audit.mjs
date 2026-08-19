import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");
const required = Object.freeze({
  contract: ["tools/manifest-content-contract.mjs", ["CANONICAL_CONTENT_SCRIPTS", "CANONICAL_CONTENT_SCRIPT_FILES"]],
  permissionAudit: ["tools/manifest-audit.mjs", ["CANONICAL_CONTENT_SCRIPTS", "externally_connectable", "forbidden/unneeded permission"]],
  contentAudit: ["tools/manifest-content-contract-audit.mjs", ["content-script file is missing", "content_scripts differ from canonical contract"]],
  platformAudit: ["tools/manifest-platform-audit.mjs", ["background launch contract changed", "Firefox compatibility DNR declaration must remain absent"]],
  surfaceAudit: ["tools/manifest-surface-audit.mjs", ["top-level manifest surface changed", "only reviewed top-level manifest keys"]],
  parityAudit: ["tools/manifest-parity-audit.mjs", ["Cross-browser manifest parity drift at", "permissions: sortedStrings", "content_scripts: contentScriptContract"]]
});
const violations = [];

for (const [label, [path, markers]] of Object.entries(required)) {
  let source = "";
  try { source = await read(path); }
  catch { violations.push(`${label}: required source is missing: ${path}`); continue; }
  for (const marker of markers) if (!source.includes(marker)) violations.push(`${label}: missing integration marker ${marker}`);
}

if (violations.length) {
  console.error("Manifest release integration audit failed:\n" + violations.map((value) => `- ${value}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Manifest release integration audit passed: canonical manifest boundaries are joined.");
}

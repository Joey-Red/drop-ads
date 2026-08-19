import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { RELEASE_TOOL_PATHS } from "../../tools/release-tool-contract.mjs";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function fixtureSource(relativePath) {
  if (relativePath === "tools/release-manifest.mjs") {
    return 'import { RELEASE_TOOL_PATHS } from "./release-tool-contract.mjs";\nexport const PACKAGING_TOOL_PATHS = RELEASE_TOOL_PATHS;\n';
  }
  return `// fixture:${relativePath}\nexport {};\n`;
}

export async function ensureReleaseToolFixture(root) {
  for (const relativePath of RELEASE_TOOL_PATHS) {
    const path = join(root, ...relativePath.split("/"));
    if (await exists(path)) continue;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, fixtureSource(relativePath), "utf8");
  }
}

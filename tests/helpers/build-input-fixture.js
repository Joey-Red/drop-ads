import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { BUILD_INPUT_FILES } from "../../tools/build-info.mjs";

function placeholderFor(path) {
  if (path === ".gitattributes") return "* text=auto eol=lf\n";
  if (path === "package.json") return '{"name":"drop-ads","version":"0.1.0"}\n';
  if (path === "package-lock.json") return '{"name":"drop-ads","version":"0.1.0","lockfileVersion":3,"packages":{}}\n';
  if (path.endsWith(".json")) return "{}\n";
  return "export {};\n";
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function ensureBuildInputFixture(root) {
  for (const relativePath of BUILD_INPUT_FILES) {
    const path = join(root, ...relativePath.split("/"));
    if (await exists(path)) continue;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, placeholderFor(relativePath), "utf8");
  }
}

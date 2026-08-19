import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const SOURCE_TEXT_ROOTS = Object.freeze(["src", "lists", "manifests", "tools"]);
export const SOURCE_TEXT_FILES = Object.freeze([".gitattributes", "package.json", "package-lock.json"]);

export function validateTextBytes(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) throw new Error("UTF-8 BOM is forbidden");
  if (bytes.includes(0x00)) throw new Error("NUL byte is forbidden in source text");
  if (bytes.includes(0x0d)) throw new Error("CR/CRLF is forbidden; source text must use LF line endings");

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("source text is not valid UTF-8");
  }

  if (bytes.length > 0 && bytes[bytes.length - 1] !== 0x0a) throw new Error("non-empty source text must end with LF");
  return true;
}

async function filesUnder(directory) {
  const files = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push(path);
    }
  }
  await walk(directory);
  return files;
}

export async function collectSourceTextPaths(rootDirectory) {
  const root = resolve(rootDirectory);
  const paths = [];
  for (const directory of SOURCE_TEXT_ROOTS) paths.push(...await filesUnder(resolve(root, directory)));
  for (const file of SOURCE_TEXT_FILES) paths.push(resolve(root, file));
  paths.sort((a, b) => relative(root, a).localeCompare(relative(root, b)));
  return paths;
}

export async function auditSourceText(rootDirectory) {
  const root = resolve(rootDirectory);
  const paths = await collectSourceTextPaths(root);
  const violations = [];
  for (const path of paths) {
    const data = await readFile(path);
    try {
      validateTextBytes(data);
    } catch (error) {
      const file = relative(root, path).split(sep).join("/");
      violations.push(`${file}: ${error instanceof Error ? error.message : error}`);
    }
  }
  if (violations.length) throw new Error(`Source text audit failed:\n${violations.map((item) => `- ${item}`).join("\n")}`);
  return Object.freeze({ files: paths.length });
}

function isMainModule(moduleUrl, argvPath) {
  if (!argvPath) return false;
  try { return moduleUrl === pathToFileURL(resolve(argvPath)).href; }
  catch { return false; }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const root = resolve(import.meta.dirname, "..");
  auditSourceText(root)
    .then((result) => console.log(`Source text audit passed (${result.files} strict UTF-8/LF files).`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}

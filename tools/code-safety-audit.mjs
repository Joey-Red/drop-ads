import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const FORBIDDEN_PATTERNS = Object.freeze([
  ["eval", /\beval\s*\(/g],
  ["Function constructor", /\bnew\s+Function\s*\(/g],
  ["importScripts", /\bimportScripts\s*\(/g],
  ["string timer", /\b(?:setTimeout|setInterval)\s*\(\s*['"`]/g],
  ["WebAssembly runtime compilation", /\bWebAssembly\s*\.\s*(?:compile|compileStreaming|instantiate|instantiateStreaming)\s*\(/g]
]);

function blankRange(chars, start, end, { preserveEnds = false } = {}) {
  for (let index = start; index < end; index += 1) {
    if (chars[index] === "\n" || chars[index] === "\r") continue;
    if (preserveEnds && (index === start || index === end - 1)) continue;
    chars[index] = " ";
  }
}

export function maskCommentsAndStrings(source) {
  const text = String(source);
  const chars = [...text];
  let index = 0;

  while (index < chars.length) {
    const current = chars[index];
    const next = chars[index + 1];

    if (current === "/" && next === "/") {
      const start = index;
      index += 2;
      while (index < chars.length && chars[index] !== "\n") index += 1;
      blankRange(chars, start, index);
      continue;
    }

    if (current === "/" && next === "*") {
      const start = index;
      index += 2;
      while (index < chars.length && !(chars[index] === "*" && chars[index + 1] === "/")) index += 1;
      index = Math.min(chars.length, index + 2);
      blankRange(chars, start, index);
      continue;
    }

    if (current === "'" || current === '"' || current === "`") {
      const quote = current;
      const start = index;
      index += 1;
      while (index < chars.length) {
        if (chars[index] === "\\") {
          index += 2;
          continue;
        }
        if (chars[index] === quote) {
          index += 1;
          break;
        }
        index += 1;
      }
      blankRange(chars, start, Math.min(index, chars.length), { preserveEnds: true });
      continue;
    }

    index += 1;
  }

  return chars.join("");
}

export function findForbiddenExecutablePatterns(source) {
  const masked = maskCommentsAndStrings(source);
  const findings = [];
  for (const [kind, pattern] of FORBIDDEN_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of masked.matchAll(pattern)) findings.push({ kind, index: match.index });
  }
  findings.sort((left, right) => left.index - right.index || left.kind.localeCompare(right.kind));
  return findings;
}

async function jsFilesUnder(directory) {
  const files = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && entry.name.endsWith(".js")) files.push(path);
    }
  }
  await walk(directory);
  return files;
}

export async function auditShippedCode(rootDirectory) {
  const root = resolve(rootDirectory);
  const sourceRoot = resolve(root, "src");
  const files = await jsFilesUnder(sourceRoot);
  const violations = [];

  for (const path of files) {
    const source = await readFile(path, "utf8");
    for (const finding of findForbiddenExecutablePatterns(source)) {
      const file = relative(root, path).split(sep).join("/");
      violations.push(`${file}: forbidden ${finding.kind} executable-code path`);
    }
  }

  if (violations.length) throw new Error(`Shipped code safety audit failed:\n${violations.map((item) => `- ${item}`).join("\n")}`);
  return Object.freeze({ files: files.length });
}

function isMainModule(moduleUrl, argvPath) {
  if (!argvPath) return false;
  try { return moduleUrl === pathToFileURL(resolve(argvPath)).href; }
  catch { return false; }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const root = resolve(import.meta.dirname, "..");
  auditShippedCode(root)
    .then((result) => console.log(`Shipped code safety audit passed (${result.files} JavaScript files).`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}

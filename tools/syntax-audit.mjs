import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const root = resolve(import.meta.dirname, "..");
const roots = ["src", "tests", "tools"];
const execFileAsync = promisify(execFile);
const PARSE_CHILD_FLAG = "--syntax-audit-parse-child";
const CHILD_TIMEOUT_MS = 60_000;
const MAX_DIAGNOSTIC_BYTES = 4 * 1024 * 1024;

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJavaScriptFiles(path));
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".mjs"))) files.push(path);
  }
  return files;
}

async function javascriptFiles() {
  return (await Promise.all(roots.map((directory) => collectJavaScriptFiles(resolve(root, directory)))))
    .flat()
    .sort();
}

async function parseAllInProcess() {
  const vm = await import("node:vm");
  if (typeof vm.SourceTextModule !== "function") {
    throw new Error("Node SourceTextModule parser is unavailable; syntax audit requires --experimental-vm-modules");
  }

  const files = await javascriptFiles();
  const failures = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    try {
      new vm.SourceTextModule(source, { identifier: file });
    } catch (error) {
      const detail = error instanceof Error ? error.stack || error.message : String(error);
      failures.push(`Syntax check failed: ${file}\n${detail}`);
    }
  }

  if (failures.length) {
    throw new Error(`JavaScript syntax audit failed (${failures.length} file${failures.length === 1 ? "" : "s"}):\n\n${failures.join("\n\n")}`);
  }
  process.stdout.write(`JavaScript syntax audit passed (${files.length} files; single parser process)\n`);
}

async function runParserChild() {
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ["--experimental-vm-modules", "--no-warnings", fileURLToPath(import.meta.url), PARSE_CHILD_FLAG],
      {
        cwd: root,
        encoding: "utf8",
        windowsHide: true,
        timeout: CHILD_TIMEOUT_MS,
        maxBuffer: MAX_DIAGNOSTIC_BYTES
      }
    );
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } catch (error) {
    if (error?.killed) {
      throw new Error(`JavaScript syntax audit parser exceeded ${CHILD_TIMEOUT_MS} ms`);
    }
    const detail = error?.stderr || error?.stdout || error?.message || String(error);
    throw new Error(detail);
  }
}

if (process.argv.includes(PARSE_CHILD_FLAG)) {
  await parseAllInProcess();
} else {
  await runParserChild();
}

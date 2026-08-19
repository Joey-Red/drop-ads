import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { run } from "node:test";
import { spec } from "node:test/reporters";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const testsDirectory = resolve(root, "tests");

const entries = await readdir(testsDirectory, { withFileTypes: true });
const tests = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.js"))
  .map((entry) => entry.name)
  .sort();

if (!tests.length) throw new Error("No tests found");

console.log(`Drop Ads test gate: ${tests.length} files.`);

const stream = run({ files: tests.map((file) => resolve(testsDirectory, file)) });
stream.on("test:fail", () => { process.exitCode = 1; });
stream.compose(spec()).pipe(process.stdout);

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const check = pkg.scripts?.check;
if (typeof check !== "string" || !check.trim()) throw new Error("package.json scripts.check is missing");

const skipTest = process.argv.includes("--skip-test");
const commands = check.split(/\s*&&\s*/).map((command) => command.trim()).filter(Boolean);
const failures = [];

function run(command) {
  return new Promise((resolveRun) => {
    const child = spawn(command, {
      cwd: root,
      shell: true,
      stdio: "inherit"
    });
    child.once("error", (error) => {
      console.error(error instanceof Error ? error.message : error);
      resolveRun(1);
    });
    child.once("exit", (code, signal) => {
      if (signal) {
        console.error(`${command} terminated by signal ${signal}`);
        resolveRun(1);
        return;
      }
      resolveRun(Number.isInteger(code) ? code : 1);
    });
  });
}

for (const command of commands) {
  if (skipTest && command === "npm test") {
    console.log(`\n===== SKIPPED: ${command} =====`);
    continue;
  }

  console.log(`\n===== ${command} =====`);
  const code = await run(command);
  if (code !== 0) {
    failures.push(Object.freeze({ command, code }));
    console.error(`FAILED: ${command} [EXIT ${code}]`);
  }
}

console.log("\n===== ALL FAILURES =====");
if (!failures.length) {
  console.log("NONE");
} else {
  for (const { command, code } of failures) console.error(`${command} [EXIT ${code}]`);
  process.exitCode = 1;
}

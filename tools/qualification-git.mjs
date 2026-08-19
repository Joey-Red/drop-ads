import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
export const QUALIFICATION_GIT_MAX_BUFFER_BYTES = 1024 * 1024;
export const QUALIFICATION_GIT_TIMEOUT_MS = 10_000;

async function git(root, args) {
  const { stdout } = await execFileAsync("git", args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    shell: false,
    maxBuffer: QUALIFICATION_GIT_MAX_BUFFER_BYTES,
    timeout: QUALIFICATION_GIT_TIMEOUT_MS
  });
  return stdout;
}

export async function readQualificationGitState(rootDirectory) {
  const [headText, status] = await Promise.all([
    git(rootDirectory, ["rev-parse", "HEAD"]),
    git(rootDirectory, ["status", "--porcelain=v1", "--untracked-files=all"])
  ]);
  const head = headText.trim().toLowerCase();
  if (!/^[0-9a-f]{40,64}$/.test(head)) throw new Error("Git HEAD is invalid");
  return Object.freeze({ head, status });
}

import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";

export const MAX_COMMUNITY_WORKFLOW_OUTPUT_BYTES = 16 * 1024;

export async function appendCommunityWorkflowOutput(path, output) {
  if (typeof path !== "string" || !path) throw new TypeError("Community workflow output path is required");
  if (typeof output !== "string" || Buffer.byteLength(output, "utf8") > MAX_COMMUNITY_WORKFLOW_OUTPUT_BYTES || output.includes("\u0000")) {
    throw new Error("Community workflow output is invalid or too large");
  }
  const before = await lstat(path);
  if (!before.isFile() || before.isSymbolicLink()) throw new Error("Community workflow output must be a regular non-symlink file");

  const flags = constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0);
  const handle = await open(path, flags);
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino) {
      throw new Error("Community workflow output changed before append");
    }
    await handle.writeFile(output, "utf8");
  } finally {
    await handle.close();
  }
}

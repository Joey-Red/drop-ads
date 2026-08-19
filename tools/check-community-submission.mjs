import { resolve } from "node:path";
import { readCommunityListFile } from "./community-file-io.mjs";
import { serializeCommunityValidationOutputs } from "./community-output.mjs";
import { validateCommunitySubmissionTitle, validateReviewedCommunitySubmission } from "./community-review-validation.mjs";
import { appendCommunityWorkflowOutput } from "./community-workflow-io.mjs";

const body = process.env.SUBMISSION_BODY ?? "";
const title = process.env.SUBMISSION_TITLE ?? "";
const outputPath = process.env.GITHUB_OUTPUT;
const defaultText = await readCommunityListFile(resolve(import.meta.dirname, "..", "lists", "default.txt"));
let result = validateReviewedCommunitySubmission({ body, listText: defaultText });
if (result.status !== "invalid" && !validateCommunitySubmissionTitle(title, result.candidate)) {
  result = Object.freeze({ valid: false, status: "invalid", candidate: "", reason: "Submission title does not match the validated community candidate" });
}
const output = serializeCommunityValidationOutputs(result);

if (outputPath) await appendCommunityWorkflowOutput(outputPath, output);
else process.stdout.write(output);

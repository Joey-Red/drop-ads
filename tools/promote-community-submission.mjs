import { resolve } from "node:path";
import { readCommunityListFile, writeCommunityListFileAtomic } from "./community-file-io.mjs";
import { serializeCommunityPromotionOutputs } from "./community-output.mjs";
import { promoteCommunitySubmission } from "./community-promotion.mjs";
import { validateCommunitySubmissionTitle, validateReviewedCommunitySubmission } from "./community-review-validation.mjs";
import { appendCommunityWorkflowOutput } from "./community-workflow-io.mjs";

const body = process.env.SUBMISSION_BODY ?? "";
const title = process.env.SUBMISSION_TITLE ?? "";
const outputPath = process.env.GITHUB_OUTPUT;
const listPath = resolve(import.meta.dirname, "..", "lists", "default.txt");
const listText = await readCommunityListFile(listPath);
const reviewed = validateReviewedCommunitySubmission({ body, listText });
let result;
if (reviewed.status === "invalid" || !validateCommunitySubmissionTitle(title, reviewed.candidate)) {
  result = Object.freeze({
    valid: false,
    status: "invalid",
    candidate: "",
    reason: reviewed.status === "invalid" ? reviewed.reason : "Submission title does not match the validated community candidate",
    changed: false,
    listText
  });
} else {
  result = promoteCommunitySubmission({ body, listText });
}

if (result.changed) await writeCommunityListFileAtomic(listPath, result.listText);
const output = serializeCommunityPromotionOutputs(result);

if (outputPath) await appendCommunityWorkflowOutput(outputPath, output);
else process.stdout.write(output);

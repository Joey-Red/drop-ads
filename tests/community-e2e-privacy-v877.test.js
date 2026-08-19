import assert from "node:assert/strict";
import test from "node:test";
import { buildCommunityIssueUrl, communityCandidateFromRule } from "../src/core/community.js";
import { promoteCommunitySubmission } from "../tools/community-promotion.mjs";
import { validateCommunitySubmission } from "../tools/community-validation.mjs";

const secretUrl = "https://ads.example.com/private/path?account=secret#fragment";

test("M877 keeps exact URL contribution data domain-only from extension through promotion", () => {
  const candidate = communityCandidateFromRule({ kind: "url", value: secretUrl });
  assert.deepEqual(candidate, { kind: "domain", value: "ads.example.com" });
  assert.equal(Object.isFrozen(candidate), true);

  const issueUrl = buildCommunityIssueUrl({ kind: "url", value: secretUrl });
  const parsed = new URL(issueUrl);
  const title = parsed.searchParams.get("title");
  const body = parsed.searchParams.get("body");
  assert.match(title, /ads\.example\.com/);
  assert.match(body, /block domain ads\.example\.com/);
  for (const forbidden of ["/private/path", "account=secret", "#fragment", secretUrl]) {
    assert.equal(issueUrl.includes(forbidden), false);
    assert.equal(body.includes(forbidden), false);
  }

  const validation = validateCommunitySubmission({ body, listText: "# community\n" });
  assert.equal(validation.status, "ready");
  assert.equal(validation.candidate, "block domain ads.example.com");

  const first = promoteCommunitySubmission({ body, listText: "# community\n" });
  assert.equal(first.changed, true);
  assert.equal(first.listText, "# community\nblock domain ads.example.com\n");
  for (const forbidden of ["/private/path", "account=secret", "#fragment"]) assert.equal(first.listText.includes(forbidden), false);

  const second = promoteCommunitySubmission({ body, listText: first.listText });
  assert.equal(second.status, "duplicate");
  assert.equal(second.changed, false);
  assert.equal(second.listText, first.listText);
});

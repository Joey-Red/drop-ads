import test from "node:test";
import assert from "node:assert/strict";
import { LOOPBACKS, startQualificationServer } from "../tools/qualification-server.mjs";

async function withServer(run) {
  const fixture = await startQualificationServer({ port: 0, quiet: true });
  try { await run(fixture); } finally { await fixture.close(); }
}

test("qualification fixture binds every role to loopback on one ephemeral port", async () => {
  await withServer(async ({ servers, port, url }) => {
    assert.equal(servers.length, Object.keys(LOOPBACKS).length);
    assert.match(url, new RegExp(`^http://${LOOPBACKS.page.replaceAll(".", "\\.")}:${port}/$`));
    for (const host of Object.values(LOOPBACKS)) {
      const response = await fetch(`http://${host}:${port}/health`, { cache: "no-store" });
      assert.equal(response.status, 200, `${host} health endpoint`);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(await response.json(), { ok: true, localOnly: true });
    }
  });
});

test("qualification page references only local loopback resources and stable cosmetic targets", async () => {
  await withServer(async ({ port, url }) => {
    const response = await fetch(url);
    const html = await response.text();
    assert.equal(response.status, 200);
    for (const id of ["control-card", "domain-card", "exact-card"]) assert.match(html, new RegExp(`id="${id}"`), `missing cosmetic fixture #${id}`);
    for (const host of Object.values(LOOPBACKS)) assert.match(html, new RegExp(`http://${host.replaceAll(".", "\\.")}:${port}`));
    const absoluteUrls = [...html.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((match) => match[0]);
    assert.ok(absoluteUrls.length >= Object.keys(LOOPBACKS).length);
    for (const value of absoluteUrls) {
      const parsed = new URL(value);
      assert.ok(Object.values(LOOPBACKS).includes(parsed.hostname), `unexpected non-loopback fixture URL: ${value}`);
      assert.equal(Number(parsed.port), port);
    }
  });
});

test("domain and exact-resource probes are independently addressable", async () => {
  await withServer(async ({ port }) => {
    const domainTarget = await fetch(`http://${LOOPBACKS.domainAd}:${port}/asset/domain-ad.svg`);
    const exactTarget = await fetch(`http://${LOOPBACKS.exactAd}:${port}/asset/exact-target.svg`);
    const exactControl = await fetch(`http://${LOOPBACKS.exactAd}:${port}/asset/exact-control.svg`);
    assert.equal(domainTarget.status, 200);
    assert.match(await domainTarget.text(), /DOMAIN TARGET/);
    assert.equal(exactTarget.status, 200);
    assert.match(await exactTarget.text(), /EXACT URL TARGET/);
    assert.equal(exactControl.status, 200);
    assert.match(await exactControl.text(), /SAME-HOST CONTROL/);
  });
});

test("cookie probe reports request-cookie presence without retaining server state", async () => {
  await withServer(async ({ port }) => {
    const sameOriginSet = await fetch(`http://${LOOPBACKS.page}:${port}/cookie-set`);
    assert.equal(sameOriginSet.status, 204);
    assert.match(sameOriginSet.headers.get("set-cookie") ?? "", /drop_ads_qualification=1/);
    assert.match(sameOriginSet.headers.get("set-cookie") ?? "", /SameSite=Lax/);
    const thirdPartySet = await fetch(`http://${LOOPBACKS.cookie}:${port}/cookie-set`);
    assert.equal(thirdPartySet.status, 204);
    assert.match(thirdPartySet.headers.get("set-cookie") ?? "", /SameSite=None/);
    const absentResponse = await fetch(`http://${LOOPBACKS.cookie}:${port}/cookie-state`);
    assert.deepEqual(await absentResponse.json(), { present: false });
    const presentResponse = await fetch(`http://${LOOPBACKS.cookie}:${port}/cookie-state`, { headers: { cookie: "drop_ads_qualification=1" } });
    assert.deepEqual(await presentResponse.json(), { present: true });
  });
});

test("fixture returns no-store 404 responses for unknown routes", async () => {
  await withServer(async ({ port }) => {
    const response = await fetch(`http://${LOOPBACKS.page}:${port}/not-a-real-probe`);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(await response.text(), "not found\n");
  });
});

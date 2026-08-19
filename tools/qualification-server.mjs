import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const DEFAULT_PORT = 41731;
const LOOPBACKS = Object.freeze({
  page: "127.0.0.1",
  domainAd: "127.0.0.2",
  exactAd: "127.0.0.3",
  script: "127.0.0.4",
  frame: "127.0.0.5",
  cookie: "127.0.0.6"
});

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function send(response, status, contentType, body, headers = {}) {
  response.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
    ...headers
  });
  response.end(body);
}

function svg(label, background = "#ececec") {
  const safe = htmlEscape(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="84" viewBox="0 0 520 84"><rect width="520" height="84" rx="10" fill="${background}"/><text x="20" y="50" font-family="system-ui,sans-serif" font-size="18" fill="#111">${safe}</text></svg>`;
}

function pageHtml(port) {
  const url = (host, path) => `http://${host}:${port}${path}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Drop Ads browser qualification</title>
<style>
:root{font:16px/1.45 system-ui,sans-serif;color-scheme:light dark}body{margin:0;background:Canvas;color:CanvasText}main{width:min(980px,calc(100% - 32px));margin:32px auto 64px}h1{margin-bottom:4px}.lede{max-width:72ch;opacity:.75}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px;margin-top:24px}.card{border:1px solid color-mix(in srgb,CanvasText 22%,transparent);border-radius:10px;padding:16px}.card h2{margin:0 0 8px;font-size:18px}.probe{display:block;max-width:100%;margin:10px 0;border-radius:8px}.pass{font-weight:700}.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}.note{font-size:14px;opacity:.72}iframe{width:100%;min-height:105px;border:1px solid color-mix(in srgb,CanvasText 20%,transparent);border-radius:8px}code{overflow-wrap:anywhere}button{padding:8px 11px;font:inherit}.status{min-height:1.5em;font-weight:650}.consent-box{border:1px dashed color-mix(in srgb,CanvasText 38%,transparent);border-radius:8px;padding:12px;margin:10px 0}.consent-box button{margin:4px 6px 4px 0}
</style>
</head>
<body>
<main>
<h1>Drop Ads real-browser qualification fixture</h1>
<p class="lede">Everything on this page is served by local loopback listeners. The main page is <code>${LOOPBACKS.page}</code>; simulated third-party resources use other loopback addresses so domain and exact-URL rules can be tested independently. No DNS changes, external requests, or telemetry are used.</p>

<div class="grid">
<section class="card" id="control-card">
<h2>1. First-party control</h2>
<p>This image should remain visible throughout testing unless the whole extension/site is intentionally disabled.</p>
<img class="probe" src="${url(LOOPBACKS.page, "/asset/control.svg")}" alt="First-party control resource">
<p class="pass">Expected: visible.</p>
</section>

<section class="card" id="domain-card">
<h2>2. One-click domain block</h2>
<p>Right-click the image below and choose <strong>Block ad/resource locally</strong>, then reload this page.</p>
<img class="probe" src="${url(LOOPBACKS.domainAd, "/asset/domain-ad.svg")}" alt="Domain-block qualification resource">
<a class="mono" href="${url(LOOPBACKS.domainAd, "/asset/domain-link.txt")}">${LOOPBACKS.domainAd} domain test link</a>
<p class="pass">Expected after reload: this host's resources are blocked while the first-party control remains.</p>
</section>

<section class="card" id="exact-card">
<h2>3. Advanced exact-URL block</h2>
<p>Use <strong>Drop Ads: advanced blocking → Block exact resource URL locally</strong> on the first image, then reload.</p>
<img class="probe" src="${url(LOOPBACKS.exactAd, "/asset/exact-target.svg")}" alt="Exact URL target">
<img class="probe" src="${url(LOOPBACKS.exactAd, "/asset/exact-control.svg")}" alt="Same-host exact URL control">
<p class="pass">Expected: target disappears; same-host control remains.</p>
</section>

<section class="card" id="script-card">
<h2>4. Script request probe</h2>
<p id="script-status" class="status">Script did not execute.</p>
<script src="${url(LOOPBACKS.script, "/asset/probe.js")}"></script>
<p class="note">Before blocking, status should say the local third-party script executed. Domain-block ${LOOPBACKS.script} and reload to verify it no longer executes.</p>
</section>

<section class="card" id="frame-card">
<h2>5. Frame request probe</h2>
<iframe src="${url(LOOPBACKS.frame, "/frame")}" title="Third-party frame qualification"></iframe>
<p class="note">Domain-block ${LOOPBACKS.frame} to verify sub-frame blocking without touching the main page.</p>
</section>

<section class="card" id="cookie-card">
<h2>6. Cookie header probe</h2>
<iframe src="${url(LOOPBACKS.cookie, "/cookie-frame")}" title="Third-party cookie qualification"></iframe>
<p class="note">The frame reports whether its test cookie survived. Browser-native third-party-cookie policy can also block this probe; use the same-origin hard-mode probe below to distinguish Drop Ads hard mode.</p>
<button id="same-cookie" type="button">Run same-origin cookie probe</button>
<p id="same-cookie-status" class="status"></p>
</section>

<section class="card">
<h2>7. Recovery checks</h2>
<ol>
<li>Use the toolbar popup to pause this site until browser restart; verify blocked resources return while paused.</li>
<li>Resume and verify rules become active again.</li>
<li>Turn protection off persistently for this site, reload, then re-enable it.</li>
<li>Add a personal allow rule for a previously blocked loopback host and verify the allow wins.</li>
</ol>
</section>

<section class="card">
<h2>8. Qualification boundaries</h2>
<p>This fixture exercises actual browser requests, but it does not itself mark Issue #10 complete. Record results separately for Chromium and Firefox, including restart/reload behavior and package/audit results.</p>
<p class="mono">Fixture hosts: ${Object.values(LOOPBACKS).join(", ")}</p>
</section>

<section class="card" id="cookie-banner-static-card">
<h2>9. Immediate cookie-banner rejection</h2>
<p>With cookie-banner handling set to <strong>Reject cookie banners when possible</strong>, the reject action below should activate automatically. With the setting Off, it should remain untouched.</p>
<div id="cookie-banner-static" class="consent-box" aria-label="Cookie privacy choices">
<p>Cookie privacy choices for this local qualification page.</p>
<button id="cookie-banner-static-reject" type="button">Reject all cookies</button>
<button id="cookie-banner-static-manage" type="button">Manage preferences</button>
</div>
<p id="cookie-banner-static-status" class="status">Waiting for automatic reject…</p>
</section>

<section class="card" id="generic-consent-card">
<h2>10. Non-cookie consent false-positive guard</h2>
<p>This deliberately uses generic consent wording plus an exact <strong>Decline</strong> button. Drop Ads must not activate it automatically because the surface has no cookie/privacy-choice/tracking evidence.</p>
<div id="generic-consent" class="consent-box" aria-label="Medical consent form">
<p>Medical consent for local research participation.</p>
<button id="generic-consent-decline" type="button">Decline</button>
</div>
<p id="generic-consent-status" class="status">PASS if this remains untouched automatically.</p>
</section>

<section class="card" id="cookie-shadow-card">
<h2>11. Delayed open-shadow cookie banner</h2>
<p>A cookie consent control is inserted into an open shadow root after page readiness. The bounded late-banner observer should discover and reject it while the preference is enabled.</p>
<div id="cookie-shadow-host"></div>
<p id="cookie-shadow-status" class="status">Waiting for delayed shadow banner…</p>
</section>
</div>
</main>
<script>
document.querySelector("#same-cookie").addEventListener("click", async () => {
  const status = document.querySelector("#same-cookie-status");
  status.textContent = "Running…";
  await fetch("/cookie-set", { credentials: "include", cache: "no-store" });
  const response = await fetch("/cookie-state", { credentials: "include", cache: "no-store" });
  const result = await response.json();
  status.textContent = result.present ? "Same-origin cookie survived." : "Same-origin cookie was absent/removed.";
});

document.querySelector("#cookie-banner-static-reject").addEventListener("click", () => {
  document.querySelector("#cookie-banner-static-status").textContent = "PASS: immediate cookie reject action activated.";
});
document.querySelector("#cookie-banner-static-manage").addEventListener("click", () => {
  document.querySelector("#cookie-banner-static-status").textContent = "Manual manage action activated.";
});
document.querySelector("#generic-consent-decline").addEventListener("click", () => {
  document.querySelector("#generic-consent-status").textContent = "FAIL for automatic qualification: generic non-cookie Decline was activated.";
});

setTimeout(() => {
  const host = document.querySelector("#cookie-shadow-host");
  const root = host.attachShadow({ mode: "open" });
  const surface = document.createElement("div");
  surface.setAttribute("aria-label", "Cookie privacy choices");
  surface.innerHTML = '<p>Cookie privacy choices for the delayed shadow fixture.</p><button id="cookie-shadow-reject" type="button">Reject optional cookies</button>';
  root.append(surface);
  root.querySelector("#cookie-shadow-reject").addEventListener("click", () => {
    document.querySelector("#cookie-shadow-status").textContent = "PASS: delayed open-shadow cookie reject action activated.";
  });
}, 750);
</script>
</body>
</html>`;
}

function cookieFrameHtml() {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><style>:root{font:14px/1.4 system-ui,sans-serif}body{margin:12px}</style><body><strong>Third-party cookie probe</strong><p id="status">Setting test cookie…</p><script>(async()=>{await fetch('/cookie-set',{credentials:'include',cache:'no-store'});const r=await fetch('/cookie-state',{credentials:'include',cache:'no-store'});const j=await r.json();document.querySelector('#status').textContent=j.present?'Cookie survived.':'Cookie was absent/removed.';})().catch(()=>{document.querySelector('#status').textContent='Cookie probe request failed.';});</script></body></html>`;
}

export function createQualificationHandler(portOrGetter) {
  return (request, response) => {
    const port = typeof portOrGetter === "function" ? portOrGetter() : portOrGetter;
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? `${LOOPBACKS.page}:${port}`}`);
    const path = requestUrl.pathname;

    if (path === "/") return send(response, 200, "text/html; charset=utf-8", pageHtml(port));
    if (path === "/health") return send(response, 200, "application/json; charset=utf-8", JSON.stringify({ ok: true, localOnly: true }));

    if (path === "/asset/control.svg") return send(response, 200, "image/svg+xml", svg("FIRST-PARTY CONTROL — should stay visible", "#d9f7df"));
    if (path === "/asset/domain-ad.svg") return send(response, 200, "image/svg+xml", svg("DOMAIN TARGET — block 127.0.0.2", "#ffe2e2"));
    if (path === "/asset/exact-target.svg") return send(response, 200, "image/svg+xml", svg("EXACT URL TARGET — block only this URL", "#fff0c7"));
    if (path === "/asset/exact-control.svg") return send(response, 200, "image/svg+xml", svg("SAME-HOST CONTROL — should remain", "#d9f7df"));
    if (path === "/asset/domain-link.txt") return send(response, 200, "text/plain; charset=utf-8", "domain-link-control\n");
    if (path === "/asset/probe.js") return send(response, 200, "text/javascript; charset=utf-8", "document.querySelector('#script-status').textContent='Local third-party script executed.';\n");
    if (path === "/frame") return send(response, 200, "text/html; charset=utf-8", "<!doctype html><html><body style='font:14px system-ui,sans-serif'><strong>Third-party frame loaded.</strong><p>Block this loopback host to make the frame fail.</p></body></html>");

    if (path === "/cookie-frame") return send(response, 200, "text/html; charset=utf-8", cookieFrameHtml());
    if (path === "/cookie-set") {
      const sameSite = requestUrl.hostname === LOOPBACKS.page ? "Lax" : "None";
      return send(response, 204, "text/plain", "", {
        "set-cookie": `drop_ads_qualification=1; Path=/; SameSite=${sameSite}`
      });
    }
    if (path === "/cookie-state") {
      const present = /(?:^|;\s*)drop_ads_qualification=1(?:;|$)/.test(request.headers.cookie ?? "");
      return send(response, 200, "application/json; charset=utf-8", JSON.stringify({ present }), {
        "access-control-allow-origin": "*"
      });
    }

    return send(response, 404, "text/plain; charset=utf-8", "not found\n");
  };
}

function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

async function closeQuietly(servers) {
  await Promise.all(servers.map((server) => new Promise((resolve) => {
    if (!server.listening) return resolve();
    server.close(() => resolve());
  })));
}

export async function startQualificationServer({ port = DEFAULT_PORT, quiet = false } = {}) {
  let actualPort = port;
  const servers = [];
  const handler = createQualificationHandler(() => actualPort);

  try {
    const pageServer = createServer(handler);
    servers.push(pageServer);
    await listen(pageServer, port, LOOPBACKS.page);
    const address = pageServer.address();
    actualPort = typeof address === "object" && address ? address.port : port;

    for (const host of Object.values(LOOPBACKS).slice(1)) {
      const server = createServer(handler);
      servers.push(server);
      await listen(server, actualPort, host);
    }
  } catch (error) {
    await closeQuietly(servers);
    throw error;
  }

  if (!quiet) {
    console.log(`Drop Ads qualification fixture: http://${LOOPBACKS.page}:${actualPort}/`);
    console.log(`Simulated third-party hosts: ${Object.values(LOOPBACKS).slice(1).join(", ")}`);
    console.log("Loopback-only fixture. Press Ctrl+C to stop.");
  }

  return {
    servers,
    port: actualPort,
    url: `http://${LOOPBACKS.page}:${actualPort}/`,
    close: () => closeQuietly(servers)
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  startQualificationServer({
    port: Number(process.env.DROP_ADS_QUALIFY_PORT || DEFAULT_PORT)
  }).catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

export { LOOPBACKS, DEFAULT_PORT };

import { createServer } from "node:http";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 41733;
const MAX_REQUEST_URL_CHARS = 2048;
const MAX_CONNECTIONS = 16;

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function fixtureBody(path) {
  if (path === "/control") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <p>Cookie privacy choices.</p>
      <button id="action" type="button">Reject all</button>
    </div>
    <p id="status">Waiting for safe automatic rejection…</p>
    <script>action.addEventListener('click',()=>status.textContent='PASS: safe control activated.');</script>`;

  if (path === "/direct-overflow") {
    const label = `Reject all${" ".repeat(520)}Accept all`;
    return `<div class="consent" aria-label="Cookie privacy choices"><button id="action" type="button" aria-label="${escapeHtml(label)}">Reject all</button></div>
      <p id="status">PASS if oversized direct label remains untouched.</p>
      <script>action.addEventListener('click',()=>status.textContent='FAIL: oversized direct label activated.');</script>`;
  }

  if (path === "/descendant-overflow") {
    const spans = ["Reject all", ...Array.from({ length: 33 }, (_, index) => `part-${index}`)].map((part) => `<span>${part}</span>`).join("");
    return `<div class="consent" aria-label="Cookie privacy choices"><button id="action" type="button">${spans}</button></div>
      <p id="status">PASS if over-budget descendant label remains untouched.</p>
      <script>action.addEventListener('click',()=>status.textContent='FAIL: over-budget descendant label activated.');</script>`;
  }

  if (path === "/direct-visible-conflict") return `
    <div class="consent" aria-label="Cookie privacy choices"><button id="action" type="button" aria-label="Reject all">Accept all</button></div>
    <p id="status">PASS if conflicting direct/visible names remain untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: conflicting direct/visible action activated.');</script>`;

  if (path === "/labelledby-conflict") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <span id="reject-label">Reject all</span>
      <button id="action" type="button" aria-labelledby="reject-label">Accept all</button>
    </div>
    <p id="status">PASS if conflicting aria-labelledby/visible names remain untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: conflicting labelled action activated.');</script>`;

  if (path === "/navigation-ancestor") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <a href="/navigation-target"><span id="action" role="button">Reject all</span></a>
    </div>
    <p id="status">PASS if nested navigation action remains untouched.</p>
    <script>action.addEventListener('click',(event)=>{event.preventDefault();status.textContent='FAIL: nested navigation action activated.';});</script>`;

  if (path === "/direct-channel-conflict") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <input id="action" type="button" value="Reject all" aria-label="Accept all">
    </div>
    <p id="status">PASS if conflicting input value/aria-label remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: conflicting direct channels activated.');</script>`;

  if (path === "/labelledby-interactive-descendant") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <span id="reject-label"><a href="/navigation-target">Reject all</a></span>
      <button id="action" type="button" aria-labelledby="reject-label"></button>
    </div>
    <p id="status">PASS if interactive referenced-label descendants remain untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: unsafe referenced-label action activated.');</script>`;

  if (path === "/dropads-descendant") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button"><span data-drop-ads-extension>Reject all</span></button>
    </div>
    <p id="status">PASS if Drop Ads-owned descendant text remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: Drop Ads-owned descendant action activated.');</script>`;

  if (path === "/interactive-descendant") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button"><span role="link">Reject all</span></button>
    </div>
    <p id="status">PASS if nested interactive descendant remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: nested interactive descendant action activated.');</script>`;

  if (path === "/hidden-text") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button"><span hidden>Reject all</span></button>
    </div>
    <p id="status">PASS if hidden-only action text remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: hidden-only action text activated.');</script>`;

  if (path === "/invisible-format") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button">Reject all\u2066</button>
    </div>
    <p id="status">PASS if bidi-formatted action text remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: bidi-formatted action activated.');</script>`;

  if (path === "/mixed-script") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button">Reject all 接受</button>
    </div>
    <p id="status">PASS if mixed-script action text remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: mixed-script action activated.');</script>`;

  if (path === "/secondary-label-ancestor") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <input id="side" type="checkbox"><label for="side"><span id="action" role="button">Reject all</span></label>
    </div>
    <p id="status">PASS if label-nested action remains untouched.</p>
    <script>action.addEventListener('click',(event)=>{event.preventDefault();status.textContent='FAIL: label-nested action activated.';});</script>`;

  if (path === "/editable-ancestor") return `
    <div class="consent" aria-label="Cookie privacy choices" contenteditable="true">
      <button id="action" type="button">Reject all</button>
    </div>
    <p id="status">PASS if editable-ancestor action remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: editable-ancestor action activated.');</script>`;

  if (path === "/editable-descendant") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button"><span contenteditable="true">Reject all</span></button>
    </div>
    <p id="status">PASS if editable-descendant action remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: editable-descendant action activated.');</script>`;

  if (path === "/editable-labelledby") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <span id="reject-label" contenteditable="true">Reject all</span>
      <button id="action" type="button" aria-labelledby="reject-label"></button>
    </div>
    <p id="status">PASS if editable referenced label remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: editable referenced-label action activated.');</script>`;

  if (path === "/aria-haspopup") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button" aria-haspopup="dialog">Reject all</button>
    </div>
    <p id="status">PASS if popup-launch action remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: aria-haspopup action activated.');</script>`;

  if (path === "/toggle-semantics") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button" aria-pressed="false">Reject all</button>
    </div>
    <p id="status">PASS if toggle-semantics action remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: toggle-semantics action activated.');</script>`;

  if (path === "/popover-target") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button" popovertarget="prefs-popover">Reject all</button>
      <div id="prefs-popover" popover>Preferences</div>
    </div>
    <p id="status">PASS if popover-target action remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: popover-target action activated.');</script>`;

  if (path === "/disclosure-state") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button" aria-expanded="false">Reject all</button>
    </div>
    <p id="status">PASS if disclosure-state action remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: disclosure-state action activated.');</script>`;

  if (path === "/reset-action") return `
    <form class="consent" aria-label="Cookie privacy choices">
      <input id="field" value="keep-me"><button id="action" type="reset">Reject all</button>
    </form>
    <p id="status">PASS if reset action remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: reset action activated.');</script>`;

  if (path === "/native-role-override") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button" role="tab">Reject all</button>
    </div>
    <p id="status">PASS if conflicting native role remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: native role override action activated.');</script>`;

  if (path === "/busy-context") return `
    <div class="consent" aria-label="Cookie privacy choices" aria-busy="true">
      <button id="action" type="button">Reject all</button>
    </div>
    <p id="status">PASS if busy-context action remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: busy-context action activated.');</script>`;

  if (path === "/controlled-region") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button" aria-controls="prefs-panel">Reject all</button>
      <div id="prefs-panel">Preferences</div>
    </div>
    <p id="status">PASS if controlled-region action remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: controlled-region action activated.');</script>`;

  if (path === "/command-target") return `
    <div class="consent" aria-label="Cookie privacy choices">
      <button id="action" type="button" commandfor="prefs-panel">Reject all</button>
      <div id="prefs-panel">Preferences</div>
    </div>
    <p id="status">PASS if declarative-command action remains untouched.</p>
    <script>action.addEventListener('click',()=>status.textContent='FAIL: declarative-command action activated.');</script>`;

  if (path === "/polish-control") return `
    <div class="consent" aria-label="Ustawienia prywatności i pliki cookie">
      <p>Ustawienia prywatności i pliki cookie.</p>
      <button id="action" type="button">Odrzuć wszystkie</button>
    </div>
    <p id="status">Waiting for Polish localized rejection…</p>
    <script>action.addEventListener('click',()=>status.textContent='PASS: Polish localized reject activated.');</script>`;

  if (path === "/swedish-control") return `
    <div class="consent" aria-label="Integritetsval för kakor">
      <p>Integritetsval för kakor.</p>
      <button id="action" type="button">Avvisa alla</button>
    </div>
    <p id="status">Waiting for Swedish localized rejection…</p>
    <script>action.addEventListener('click',()=>status.textContent='PASS: Swedish localized reject activated.');</script>`;

  if (path === "/danish-control") return `
    <div class="consent" aria-label="Privatlivsvalg og cookies">
      <p>Privatlivsvalg og cookies.</p>
      <button id="action" type="button">Afvis alle</button>
    </div>
    <p id="status">Waiting for Danish localized rejection…</p>
    <script>action.addEventListener('click',()=>status.textContent='PASS: Danish localized reject activated.');</script>`;

  if (path === "/norwegian-control") return `
    <div class="consent" aria-label="Personvernvalg og informasjonskapsler">
      <p>Personvernvalg og informasjonskapsler.</p>
      <button id="action" type="button">Avvis alle</button>
    </div>
    <p id="status">Waiting for Norwegian localized rejection…</p>
    <script>action.addEventListener('click',()=>status.textContent='PASS: Norwegian localized reject activated.');</script>`;

  if (path === "/finnish-control") return `
    <div class="consent" aria-label="Tietosuojavalinnat ja evästeet">
      <p>Tietosuojavalinnat ja evästeet.</p>
      <button id="action" type="button">Hylkää kaikki</button>
    </div>
    <p id="status">Waiting for Finnish localized rejection…</p>
    <script>action.addEventListener('click',()=>status.textContent='PASS: Finnish localized reject activated.');</script>`;

  if (path === "/czech-control") return `
    <div class="consent" aria-label="Volby soukromí a soubory cookie">
      <p>Volby soukromí a soubory cookie.</p>
      <button id="action" type="button">Odmítnout vše</button>
    </div>
    <p id="status">Waiting for Czech localized rejection…</p>
    <script>action.addEventListener('click',()=>status.textContent='PASS: Czech localized reject activated.');</script>`;

  return null;
}

function page(path, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Drop Ads action-source qualification</title><style>:root{font:16px/1.45 system-ui,sans-serif}body{max-width:760px;margin:40px auto;padding:0 20px}.consent{border:1px solid;padding:16px;border-radius:10px}button,[role=button],input[type=button]{padding:8px 12px;min-width:80px;min-height:36px}code{overflow-wrap:anywhere}</style></head><body><h1>Cookie-banner action-source qualification</h1><p><code>${escapeHtml(path)}</code> is loopback-only. Unsafe fixtures should remain untouched automatically.</p>${body}</body></html>`;
}

const ROUTES = Object.freeze([
  "/control",
  "/direct-overflow",
  "/descendant-overflow",
  "/direct-visible-conflict",
  "/labelledby-conflict",
  "/navigation-ancestor",
  "/direct-channel-conflict",
  "/labelledby-interactive-descendant",
  "/dropads-descendant",
  "/interactive-descendant",
  "/hidden-text",
  "/invisible-format",
  "/mixed-script",
  "/secondary-label-ancestor",
  "/editable-ancestor",
  "/editable-descendant",
  "/editable-labelledby",
  "/aria-haspopup",
  "/toggle-semantics",
  "/popover-target",
  "/disclosure-state",
  "/reset-action",
  "/native-role-override",
  "/busy-context",
  "/controlled-region",
  "/command-target",
  "/polish-control",
  "/swedish-control",
  "/danish-control",
  "/norwegian-control",
  "/finnish-control",
  "/czech-control"
]);

export function createActionSourceQualificationHandler() {
  return (request, response) => {
    const rawUrl = request.url ?? "/";
    if (!request.method || !["GET", "HEAD"].includes(request.method) || rawUrl.length > MAX_REQUEST_URL_CHARS) {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return response.end("bad request\n");
    }
    const path = new URL(rawUrl, `http://${HOST}`).pathname;
    if (path === "/") {
      const links = ROUTES.map((route) => `<li><a href="${route}">${route}</a></li>`).join("");
      const body = page(path, `<p>Run every isolated route with cookie-banner rejection enabled, then repeat with it off.</p><ul>${links}</ul>`);
      response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      return response.end(request.method === "HEAD" ? "" : body);
    }
    if (path === "/navigation-target") {
      response.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return response.end(request.method === "HEAD" ? "" : "navigation target reached\n");
    }
    const body = fixtureBody(path);
    if (!body) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return response.end("not found\n");
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    response.end(request.method === "HEAD" ? "" : page(path, body));
  };
}

export async function startActionSourceQualificationServer({ port = DEFAULT_PORT, quiet = false } = {}) {
  const server = createServer(createActionSourceQualificationHandler());
  server.maxConnections = MAX_CONNECTIONS;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, resolve);
  });
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  if (!quiet) console.log(`Drop Ads action-source qualification: http://${HOST}:${actualPort}/`);
  return Object.freeze({ host: HOST, port: actualPort, close: () => new Promise((resolve) => server.close(resolve)) });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startActionSourceQualificationServer().catch((error) => {
    console.error(error?.message ?? error);
    process.exitCode = 1;
  });
}

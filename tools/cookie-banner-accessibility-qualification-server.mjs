import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { applyQualificationServerBounds } from "./qualification-server-bounds.mjs";

export const COOKIE_BANNER_QUALIFICATION_HOST = "127.0.0.1";
export const COOKIE_BANNER_QUALIFICATION_PORT = 41732;
const MAX_REQUEST_URL_CHARS = 2_048;

const LANGUAGE_SCENARIOS = Object.freeze({
  "/de": Object.freeze({ title: "German exact reject", context: "Tracking-Technologien", reject: "Alle ablehnen", positive: "Akzeptieren" }),
  "/fr": Object.freeze({ title: "French exact reject", context: "Choix de confidentialité", reject: "Tout refuser", positive: "Accepter" }),
  "/es": Object.freeze({ title: "Spanish exact reject", context: "Opciones de privacidad", reject: "Rechazar todo", positive: "Aceptar" }),
  "/it": Object.freeze({ title: "Italian exact reject", context: "Scelte sulla privacy", reject: "Rifiuta tutto", positive: "Accetta" }),
  "/pt": Object.freeze({ title: "Portuguese exact reject", context: "Opções de privacidade", reject: "Rejeitar tudo", positive: "Aceitar" }),
  "/nl": Object.freeze({ title: "Dutch exact reject", context: "Privacykeuzes", reject: "Alles weigeren", positive: "Accepteren" }),
  "/es-necessary": Object.freeze({ title: "Accented necessary-only label", context: "Opciones de privacidad", reject: "Sólo cookies necesarias", positive: "Configuración" })
});

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function shell(title, body, script = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>:root{font:16px/1.45 system-ui,sans-serif;color-scheme:light dark}body{margin:32px auto;width:min(760px,calc(100% - 32px))}.surface{border:1px solid currentColor;border-radius:8px;padding:16px}button,a{font:inherit;padding:7px 10px;margin:4px}.status{font-weight:700;min-height:1.5em}code{overflow-wrap:anywhere}</style></head><body><h1>${escapeHtml(title)}</h1>${body}${script ? `<script>${script}</script>` : ""}</body></html>`;
}

function languagePage(scenario) {
  return shell(scenario.title, `<p>This route has one reviewed reject action and one positive control. With cookie-banner rejection enabled, only the reject action should activate.</p><section class="surface" aria-label="${escapeHtml(scenario.context)}"><p>${escapeHtml(scenario.context)} for this local qualification surface.</p><button id="reject" type="button">${escapeHtml(scenario.reject)}</button><button id="positive" type="button">${escapeHtml(scenario.positive)}</button></section><p id="status" class="status">Waiting for automatic rejection…</p>`, `document.querySelector("#reject").addEventListener("click",()=>{document.querySelector("#status").textContent="PASS: reviewed rejection action activated.";});document.querySelector("#positive").addEventListener("click",()=>{document.querySelector("#status").textContent="FAIL for automatic qualification: positive action activated.";});`);
}

function labelledByPage() {
  return shell("Safe aria-labelledby rejection", `<p>The rejection button has no direct text or aria-label. Its name comes from one connected, non-interactive same-root label.</p><section class="surface" aria-label="Cookie privacy choices"><p>Cookie privacy choices for this local qualification surface.</p><span id="reject-label">Reject all cookies</span><button id="reject" type="button" aria-labelledby="reject-label"></button></section><p id="status" class="status">Waiting for accessible-name rejection…</p>`, `document.querySelector("#reject").addEventListener("click",()=>{document.querySelector("#status").textContent="PASS: same-root aria-labelledby rejection activated.";});`);
}

function unsafeLabelledByPage() {
  return shell("Unsafe aria-labelledby reference refusal", `<p>The empty action references an interactive link as its label source. Automatic rejection must leave it untouched.</p><section class="surface" aria-label="Cookie privacy choices"><p>Cookie privacy choices for this local qualification surface.</p><a id="unsafe-label" href="#noop">Reject all cookies</a><button id="action" type="button" aria-labelledby="unsafe-label"></button></section><p id="status" class="status">PASS if this remains untouched automatically.</p>`, `document.querySelector("#action").addEventListener("click",()=>{document.querySelector("#status").textContent="FAIL: unsafe aria-labelledby action activated.";});`);
}

function genericConsentPage() {
  return shell("Generic non-cookie consent refusal", `<p>An exact reviewed Spanish reject label appears in a generic consent surface with no cookie/privacy-choice/tracking evidence. It must remain untouched.</p><section class="surface" aria-label="Consent form"><p>Consent for local research participation.</p><button id="reject" type="button">Rechazar todo</button></section><p id="status" class="status">PASS if this remains untouched automatically.</p>`, `document.querySelector("#reject").addEventListener("click",()=>{document.querySelector("#status").textContent="FAIL: generic non-cookie consent action activated.";});`);
}

function indexPage(port) {
  const rows = [
    ...Object.keys(LANGUAGE_SCENARIOS),
    "/labelledby",
    "/labelledby-unsafe",
    "/generic"
  ].map((path) => `<li><a href="http://${COOKIE_BANNER_QUALIFICATION_HOST}:${port}${path}"><code>${escapeHtml(path)}</code></a></li>`).join("");
  return shell("Drop Ads cookie-banner localization/accessibility qualification", `<p>Loopback-only browser fixture. No external requests, telemetry, storage, or result collection are used. Each route is isolated so automatic-rejection ambiguity rules remain deterministic.</p><ul>${rows}</ul><p>Record real Chromium and Firefox observations only through Issue #10's exact-head qualification workflow.</p>`);
}

function send(response, status, body, method) {
  response.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  response.end(method === "HEAD" ? "" : body);
}

export function createCookieBannerQualificationHandler(port) {
  return (request, response) => {
    const method = request.method ?? "";
    if (method !== "GET" && method !== "HEAD") return send(response, 405, shell("Method not allowed", "<p>GET/HEAD only.</p>"), method);
    const rawUrl = request.url ?? "/";
    if (rawUrl.length > MAX_REQUEST_URL_CHARS) return send(response, 414, shell("Request too long", "<p>Request URL exceeded the fixture limit.</p>"), method);
    let path;
    try { path = new URL(rawUrl, `http://${COOKIE_BANNER_QUALIFICATION_HOST}:${port}`).pathname; }
    catch { return send(response, 400, shell("Bad request", "<p>Invalid request URL.</p>"), method); }
    if (path === "/") return send(response, 200, indexPage(port), method);
    if (Object.hasOwn(LANGUAGE_SCENARIOS, path)) return send(response, 200, languagePage(LANGUAGE_SCENARIOS[path]), method);
    if (path === "/labelledby") return send(response, 200, labelledByPage(), method);
    if (path === "/labelledby-unsafe") return send(response, 200, unsafeLabelledByPage(), method);
    if (path === "/generic") return send(response, 200, genericConsentPage(), method);
    return send(response, 404, shell("Not found", "<p>Unknown fixture route.</p>"), method);
  };
}

export async function startCookieBannerAccessibilityQualificationServer({ port = COOKIE_BANNER_QUALIFICATION_PORT, quiet = false } = {}) {
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) throw new TypeError("qualification port must be an integer from 1 through 65535");
  const server = createServer(createCookieBannerQualificationHandler(port));
  applyQualificationServerBounds(server);
  await new Promise((resolve, reject) => {
    const onError = (error) => { server.off("listening", onListening); reject(error); };
    const onListening = () => { server.off("error", onError); resolve(); };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, COOKIE_BANNER_QUALIFICATION_HOST);
  });
  if (!quiet) {
    console.log(`Drop Ads cookie-banner localization/accessibility fixture: http://${COOKIE_BANNER_QUALIFICATION_HOST}:${port}/`);
    console.log("Loopback-only fixture. Press Ctrl+C to stop.");
  }
  return Object.freeze({
    url: `http://${COOKIE_BANNER_QUALIFICATION_HOST}:${port}/`,
    port,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const raw = process.env.DROP_ADS_COOKIE_BANNER_QUALIFY_PORT;
  const port = raw == null || raw === "" ? COOKIE_BANNER_QUALIFICATION_PORT : Number(raw);
  startCookieBannerAccessibilityQualificationServer({ port }).catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}

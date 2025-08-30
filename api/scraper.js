// worker.js
addEventListener("fetch", event => {
  event.respondWith(handle(event.request));
});

const TIMEOUT = 10000;

async function handle(req) {
  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  if (!target) return new Response("Missing ?url=", { status: 400 });

  try {
    const parsed = new URL(target);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new Response("Invalid URL", { status: 400 });
    }
  } catch (e) {
    return new Response("Invalid URL", { status: 400 });
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);

  let upstream;
  try {
    upstream = await fetch(target, {
      headers: { "User-Agent": "cloudflare-scraper/1.0" },
      redirect: "follow",
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") return new Response("Upstream timed out", { status: 504 });
    return new Response("Fetch failed: " + String(err), { status: 502 });
  }
  clearTimeout(id);

  if (!upstream.ok) {
    return new Response(`Upstream returned ${upstream.status}`, { status: 502 });
  }

  const base = upstream.url || target;

  // We'll stream and rewrite; remove scripts/styles/links and inline style attrs
  // Using HTMLRewriter to drop nodes and modify attributes
  const rewriter = new HTMLRewriter()
    .on("script", new DropHandler())
    .on("noscript", new DropHandler())
    .on("style", new DropHandler())
    .on('link[rel="stylesheet"]', new DropHandler())
    .on("*", new AttrAndSrcRewriter(base));

  // rewriter transforms the upstream response body
  const transformed = rewriter.transform(upstream);

  // We only want the body content (no head). HTMLRewriter cannot easily extract only body text directly,
  // so we return the full transformed HTML but trimmed: alternative approach below fetches as text and extracts body.
  // For simplicity and better compatibility we will extract text and then parse out <body>...</body>.
  // This is safe for most pages — if the response is huge you might want streaming parsing.

  let txt = await transformed.text();
  const bodyMatch = txt.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : txt;

  const titleMatch = txt.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "") : "";

  const out = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="origin-url" content="${escapeHtml(target)}"/>
    <title>${escapeHtml(title)}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
  </head>
  <body>
${body}
  </body>
</html>`;

  return new Response(out, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60"
    }
  });
}

class DropHandler {
  element() {
    // do nothing -> drops element
  }
}

class AttrAndSrcRewriter {
  constructor(base) {
    this.base = base;
  }
  element(element) {
    // remove inline style attributes
    if (element.hasAttribute("style")) element.removeAttribute("style");

    // remove event handlers
    for (const attr of element.attributes) {
      if (attr.name && attr.name.toLowerCase().startsWith("on")) element.removeAttribute(attr.name);
    }

    // rewrite src/href/poster/data-src
    const attrs = ["src", "href", "poster", "data-src"];
    for (const a of attrs) {
      if (element.hasAttribute(a)) {
        const val = element.getAttribute(a);
        try {
          const abs = new URL(val, this.base).toString();
          element.setAttribute(a, abs);
        } catch (e) {
          // leave unchanged if can't resolve
        }
      }
    }

    // srcset rewriting: split and rewrite items
    if (element.hasAttribute("srcset")) {
      const ss = element.getAttribute("srcset");
      const rewritten = ss
        .split(",")
        .map(p => {
          const parts = p.trim().split(/\s+/, 2);
          try {
            const abs = new URL(parts[0], this.base).toString();
            return parts[1] ? `${abs} ${parts[1]}` : abs;
          } catch (e) {
            return p;
          }
        })
        .join(", ");
      element.setAttribute("srcset", rewritten);
    }
  }
}

function escapeHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

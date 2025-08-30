// api/scrape.js
import fetch from "node-fetch";
import cheerio from "cheerio";

const DEFAULT_TIMEOUT = 10000; // ms

function isValidHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (e) {
    return false;
  }
}

function makeAbsolute(base, maybeRelative) {
  if (!maybeRelative) return "";
  try {
    return new URL(maybeRelative, base).toString();
  } catch (e) {
    return maybeRelative;
  }
}

// handle srcset attribute rewriting
function rewriteSrcset(base, srcset) {
  if (!srcset) return srcset;
  // srcset format: "img1.jpg 1x, img2.jpg 2x"
  return srcset
    .split(",")
    .map(part => {
      const p = part.trim();
      const [urlPart, descriptor] = p.split(/\s+/, 2);
      const abs = makeAbsolute(base, urlPart);
      return descriptor ? `${abs} ${descriptor}` : abs;
    })
    .join(", ");
}

export default async function handler(req, res) {
  try {
    const target = (req.query.url || req.url.split("?url=")[1] || "").toString();
    if (!target) {
      res.status(400).send("Missing ?url= parameter");
      return;
    }
    if (!isValidHttpUrl(target)) {
      res.status(400).send("Invalid URL (must be http/https)");
      return;
    }

    // Abort controller for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    let response;
    try {
      response = await fetch(target, {
        headers: {
          "User-Agent": "vercel-scraper/1.0 (+https://vercel.com)"
        },
        redirect: "follow",
        signal: controller.signal
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        res.status(504).send("Upstream request timed out");
        return;
      }
      res.status(502).send("Failed to fetch target: " + String(err));
      return;
    }
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(502).send(`Upstream returned ${response.status} ${response.statusText}`);
      return;
    }

    const text = await response.text();

    // parse with cheerio
    const $ = cheerio.load(text, { decodeEntities: false });

    // remove scripts, noscript, styles, link[rel=stylesheet], meta refresh
    $("script").remove();
    $("noscript").remove();
    $("style").remove();
    $('link[rel="stylesheet"]').remove();
    $('meta[http-equiv="refresh"]').remove();

    // remove inline style attributes to reduce CSS effects & size
    // (optional — comment out if you want to keep inline styles)
    $('[style]').each((i, el) => {
      // you can keep some safe attributes if desired; here we remove all style attrs
      $(el).removeAttr("style");
    });

    // rewrite resource URLs to absolute so images and anchors work
    const base = response.url || target; // response.url after redirects

    // src, href, data-src, poster, background, srcset
    $("*[src]").each((i, el) => {
      const $el = $(el);
      const src = $el.attr("src");
      if (src) $el.attr("src", makeAbsolute(base, src));
    });

    $("*[href]").each((i, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      if (href && !href.startsWith("javascript:")) $el.attr("href", makeAbsolute(base, href));
    });

    $("*[data-src]").each((i, el) => {
      const $el = $(el);
      const v = $el.attr("data-src");
      if (v) $el.attr("data-src", makeAbsolute(base, v));
    });

    $("*[poster]").each((i, el) => {
      const $el = $(el);
      const v = $el.attr("poster");
      if (v) $el.attr("poster", makeAbsolute(base, v));
    });

    // srcset support
    $("*[srcset]").each((i, el) => {
      const $el = $(el);
      const ss = $el.attr("srcset");
      if (ss) $el.attr("srcset", rewriteSrcset(base, ss));
    });

    // Optional: remove inline event handlers to avoid scripts executing or referencing removed scripts
    // remove attributes like onclick, onmouseover etc.
    $("*").each((i, el) => {
      const atts = el.attribs || {};
      for (const name of Object.keys(atts)) {
        if (name.startsWith("on")) $(el).removeAttr(name);
      }
    });

    // get the body inner HTML
    const body = $("body").html() || "";

    // minimal result wrapper (so user can render safely)
    const title = $("title").first().text() || "";
    const resultHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="origin-url" content="${target}"/>
    <title>${escapeHtml(title)}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
  </head>
  <body>
${body}
  </body>
</html>`;

    // set caching headers — small TTL; tune as needed
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    res.status(200).send(resultHtml);
  } catch (err) {
    console.error("Scrape error:", err);
    res.status(500).send("Internal server error");
  }
}

function escapeHtml(s) {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

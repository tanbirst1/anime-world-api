export default async function handler(req, res) {
  try {
    // 1) Extract slug from URL path
    const parts = req.url.split('/');
    const slug = parts[parts.length - 1] || parts[parts.length - 2];
    if (!slug) {
      return res.status(400).json({ error: "Missing movie slug" });
    }

    const baseURL = "https://watchanimeworld.in";
    const movieURL = `${baseURL}/movies/${slug}/`;

    // 2) Fetch HTML using built-in fetch
    const resp = await fetch(movieURL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      // 8s timeout fallback
      signal: AbortSignal.timeout(8000)
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Fetch failed (${resp.status})` });
    }
    const html = await resp.text();

    // 3) Quickly check if redirected to homepage
    if (html.includes("<h3 class=\"section-title\">Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected to homepage" });
    }

    // 4) Use regex to pull out fields from the <article class="post single"> block
    const blockMatch = html.match(/<article class="post single"[\s\S]*?<\/article>/);
    const block = blockMatch ? blockMatch[0] : html;

    // Title
    const titleMatch = block.match(/<h1[^>]*class="entry-title"[^>]*>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : slug;

    // Poster URL
    const posterMatch = block.match(/<img[^>]+src="([^"]+)"/);
    let poster = posterMatch ? posterMatch[1] : "";
    if (poster.startsWith("//")) poster = "https:" + poster;

    // Description
    const descMatch = block.match(/<div class="description"[\s\S]*?<p>([\s\S]*?)<\/p>/);
    const description = descMatch ? descMatch[1].trim() : "";

    // Genres & Languages
    const genres = [];
    const lang = [];
    let listMatch;
    // genres
    if ((listMatch = block.match(/<span>Genres<\/span>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/))) {
      listMatch[1].split(/<\/?a[^>]*>/).forEach((t) => {
        t = t.replace(/[, ]+/g, " ").trim();
        if (t && t !== "Genres") genres.push(t);
      });
    }
    // languages
    if ((listMatch = block.match(/<span>Languages<\/span>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/))) {
      listMatch[1].split(/<\/?a[^>]*>/).forEach((t) => {
        t = t.replace(/[, ]+/g, " ").trim();
        if (t && t !== "Languages") lang.push(t);
      });
    }

    // Runtime & Year
    const runtimeMatch = block.match(/<span class="duration[^"]*">[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
    const runtime = runtimeMatch ? runtimeMatch[1].trim() : "";
    const yearMatch = block.match(/<span class="year[^"]*">[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
    const year = yearMatch ? yearMatch[1].trim() : "";

    // Servers (iframe src)
    const servers = [];
    const sectionMatch = html.match(/<section class="section player[\s\S]*?<\/section>/);
    if (sectionMatch) {
      let idx = 1;
      const iframes = sectionMatch[0].match(/<iframe[^>]+(src|data-src)="([^"]+)"/g) || [];
      for (const tag of iframes) {
        const m = tag.match(/(?:src|data-src)="([^"]+)"/);
        if (m) {
          let url = m[1];
          if (url.startsWith("//")) url = "https:" + url;
          servers.push({ server: idx++, url });
        }
      }
    }

    // 5) Return JSON
    return res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      genres,
      languages: lang,
      runtime,
      year,
      servers,
      source: movieURL
    });
  } catch (err) {
    console.error("Movies handler crash:", err);
    return res.status(500).json({ error: err.message });
  }
}

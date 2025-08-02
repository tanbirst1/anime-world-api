import got from "got";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Slug missing" });
    }

    const baseUrl = "https://watchanimeworld.in";
    const targetUrl = `${baseUrl}/movies/${slug}/`;

    let html;
    try {
      // Fetch only HTML text (8s timeout)
      html = await got(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: { request: 8000 }
      }).text();
    } catch (err) {
      return res.status(200).json({
        error: "Failed to fetch page",
        detail: err.message
      });
    }

    // Reduce memory: only keep section that contains main content
    const sectionMatch = html.match(/(<main[\s\S]*?<\/main>)/i);
    const cleanHtml = sectionMatch ? sectionMatch[1] : html;

    let $;
    try {
      $ = cheerio.load(cleanHtml);
    } catch (err) {
      return res.status(200).json({
        error: "Failed to parse HTML",
        detail: err.message
      });
    }

    const title = $("h1.entry-title").text().trim() || slug;
    const poster = $("div.post-thumbnail img").attr("src") || null;
    const description =
      $("div.entry-content p").first().text().trim() || "No description";

    const genres = [];
    $("span.cat-links a").each((_, el) =>
      genres.push($(el).text().trim())
    );

    const links = [];
    $(".entry-content a").each((_, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href && /watch|download/i.test(text)) {
        links.push({ name: text, url: href });
      }
    });

    return res.status(200).json({
      type: "movie",
      title,
      poster,
      description,
      genres,
      links,
      source: targetUrl
    });
  } catch (err) {
    return res.status(200).json({
      error: "Movies API crashed",
      detail: err.message
    });
  }
}

import got from "got";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Slug missing" });

    const url = `https://watchanimeworld.in/movies/${slug}/`;

    let html;
    try {
      html = await got(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: { request: 8000 }
      }).text();
    } catch (fetchErr) {
      return res.status(200).json({ error: "Failed to fetch page", detail: fetchErr.message });
    }

    let $;
    try {
      $ = cheerio.load(html);
    } catch (parseErr) {
      return res.status(200).json({ error: "Failed to parse HTML" });
    }

    const title = $("h1.entry-title").text().trim() || slug;
    const poster = $("div.post-thumbnail img").attr("src") || null;
    const description = $("div.entry-content p").first().text().trim() || null;

    const links = [];
    $(".entry-content a").each((_, el) => {
      const link = $(el).attr("href");
      const text = $(el).text().trim();
      if (link && /watch|download/i.test(text)) {
        links.push({ name: text, url: link });
      }
    });

    return res.status(200).json({
      title,
      poster,
      description,
      links,
      source: url
    });
  } catch (err) {
    return res.status(200).json({ error: "Movies handler crashed", detail: err.message });
  }
}

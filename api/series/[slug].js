
import fetch from "node-fetch";
import * as cheerio from "cheerio";

function fixURL(url) {
  if (!url) return "";
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return "https://watchanimeworld.in" + url;
  return url;
}

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const pageURL = `${baseURL}/series/${slug}/`;

    const response = await fetch(pageURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) {
      return res.status(404).json({ error: "Series not found" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim() || "Unknown";
    const poster = fixURL(
      $("meta[property='og:image']").attr("content") ||
      $(".post-thumbnail img").attr("src") ||
      $(".entry-header img").attr("src")
    );

    const description = $(".description p").first().text().trim() ||
                        $("meta[name='description']").attr("content") || "";

    // Detect total seasons from links
    let totalSeasons = 1;
    const links = $("a[href*='/episode/']").map((i, el) => $(el).attr("href")).get();

    const seasonSet = new Set();
    links.forEach(link => {
      const m = link.match(/-(\d+)x\d+\//);
      if (m) seasonSet.add(parseInt(m[1]));
    });

    if (seasonSet.size > 0) {
      totalSeasons = Math.max(...Array.from(seasonSet));
    }

    res.status(200).json({
      status: "ok",
      title,
      poster,
      description,
      total_seasons: totalSeasons,
      current_season: 1,
      current_episode: 1
    });

  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}

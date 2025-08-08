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
    const seriesURL = `${baseURL}/series/${slug}/`;

    const response = await fetch(seriesURL, {
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
    const description =
      $(".description p").first().text().trim() ||
      $("meta[name='description']").attr("content") ||
      "";

    const episodes = [];
    const seasonSet = new Set();

    $("a[href*='/episode/']").each((_, el) => {
      const link = $(el).attr("href");
      const name = $(el).text().trim();
      const fullURL = new URL(link, baseURL).pathname;

      // Detect season
      const match = link.match(/-(\d+)x\d+\//);
      if (match) seasonSet.add(parseInt(match[1]));

      // Try to get episode thumbnail if exists (usually inside a parent element)
      const thumb = $(el).find("img").attr("src") ||
                    $(el).parent().find("img").attr("src") ||
                    "";

      episodes.push({
        name: name || fullURL.split("/").filter(Boolean).pop().replace(/-/g, " "),
        url: fullURL,
        poster: fixURL(thumb)
      });
    });

    const totalSeasons = seasonSet.size > 0 ? Math.max(...seasonSet) : 1;

    res.status(200).json({
      status: "ok",
      title,
      poster,
      description,
      total_seasons: totalSeasons,
      current_season: 1,
      episodes
    });
  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}

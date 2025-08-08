// File: /api/series/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug, season = "1" } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const seriesURL = `${baseURL}/series/${slug}/?season=${season}`;

    const response = await fetch(seriesURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) {
      return res.status(404).json({ error: "Series not found" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim() || slug.replace(/-/g, " ");
    const description = $("div.description").text().trim();
    const image = $("div.poster img").attr("src");

    const episodes = [];
    $(".se-c .episodios li").each((_, el) => {
      const epNum = $(el).find(".numerando").text().trim().split(" - ")[1];
      const epTitle = $(el).find(".episodiotitle").text().trim();
      const epThumb = $(el).find("img").attr("src");
      const epUrl = `${baseURL}/episode/${slug}-${season}x${epNum}/`;

      episodes.push({
        episode: epNum,
        title: epTitle,
        url: epUrl,
        poster: epThumb,
      });
    });

    // Detect all available seasons
    const seasons = [];
    $(".choose-season .aa-cnt li.sel-temp a").each((_, el) => {
      const s = $(el).attr("data-season");
      if (s) seasons.push(parseInt(s));
    });

    const total_seasons = seasons.length || 1;

    return res.json({
      title,
      slug,
      description,
      poster: image,
      season: parseInt(season),
      total_seasons,
      episodes
    });

  } catch (error) {
    console.error("Error in /series/[slug].js:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

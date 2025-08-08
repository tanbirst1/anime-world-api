// File: /api/series/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const seriesURL = `${baseURL}/series/${slug}/`;

    // Fetch the series page
    const response = await fetch(seriesURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!response.ok) {
      return res.status(404).json({ error: "Series not found" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1) Title
    const title = $("h1.entry-title").text().trim() || slug.replace(/-/g, " ");

    // 2) Detect all seasons
    const seasons = [];
    $(".choose-season .aa-cnt li.sel-temp a").each((_, el) => {
      const num = parseInt($(el).attr("data-season"));
      if (!isNaN(num)) seasons.push(num);
    });
    const total_seasons = seasons.length || 1;

    // 3) Always use season 1
    const current_season = 1;

    // 4) Extract episodes for season 1
    const episodes = [];
    $("#episode_by_temp li").each((_, li) => {
      const numEpi = $(li).find(".num-epi").text().trim();    // e.g. "1x3"
      const match  = numEpi.match(/^(\d+)x(\d+)$/);
      if (!match || parseInt(match[1]) !== current_season) return;

      const number = numEpi;
      const name   = $(li).find("h2.entry-title").text().trim();
      const href   = $(li).find("a.lnk-blk").attr("href");
      if (!name || !href) return;

      // Normalize to absolute URL
      const url = href.startsWith("http")
        ? href
        : baseURL + href;

      episodes.push({ number, title: name, url });
    });

    res.status(200).json({
      status: "ok",
      title,
      total_seasons,
      current_season,
      total_episodes: episodes.length,
      episodes
    });

  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}

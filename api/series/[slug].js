// pages/api/series/slug.js

import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug, season = "1" } = req.query;
    const seasonNum = parseInt(season, 10);
    if (!slug) return res.status(400).json({ error: "Missing slug" });
    if (isNaN(seasonNum) || seasonNum < 1) {
      return res.status(400).json({ error: "Invalid season number" });
    }

    const baseURL = "https://watchanimeworld.in";

    // 1. Fetch series page to get total seasons
    const seriesURL = `${baseURL}/series/${slug}`;
    const seriesResp = await fetch(seriesURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!seriesResp.ok) {
      return res.status(404).json({ error: "Series not found", slug });
    }

    const seriesHtml = await seriesResp.text();
    const $series = cheerio.load(seriesHtml);

    // Count seasons
    let totalSeasons = 1;
    const seasonLinks = $series("#season_list li a");
    if (seasonLinks.length > 0) totalSeasons = seasonLinks.length;

    // 2. Fetch season's first episode page
    const episodeSlug = `${slug}-${seasonNum}x1`;
    const episodeURL = `${baseURL}/episode/${episodeSlug}`;
    const episodeResp = await fetch(episodeURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!episodeResp.ok) {
      return res.status(404).json({
        error: "Episode page not found",
        tried: episodeURL
      });
    }

    const episodeHtml = await episodeResp.text();
    const $ = cheerio.load(episodeHtml);

    // 3. Extract episode list for that season
    const episodes = [];
    $("#episode_by_temp li").each((_, el) => {
      const epNum = $(el).find(".num-epi").text().trim();
      const epTitle = $(el).find(".entry-title").text().trim();
      const epThumb = $(el).find("img").attr("src") || "";
      const epUrl = $(el).find("a.lnk-blk").attr("href") || "";
      episodes.push({
        episode: epNum,
        title: epTitle,
        thumbnail: epThumb,
        url: epUrl
      });
    });

    return res.status(200).json({
      status: "ok",
      currentSeason: seasonNum,
      totalSeasons,
      episodes
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}

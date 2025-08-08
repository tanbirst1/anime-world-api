// pages/api/series/slug.js

import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug, season = "1" } = req.query;
    const seasonNum = parseInt(season, 10);
    if (!slug) {
      return res.status(400).json({ error: "Slug missing" });
    }
    if (isNaN(seasonNum) || seasonNum < 1) {
      return res.status(400).json({ error: "Invalid season number" });
    }

    const baseURL = "https://watchanimeworld.in";

    // 1) First, fetch the series page to count total seasons
    const seriesURL = `${baseURL}/series/${slug}`.replace(/\/+$/, "");
    const seriesResp = await fetch(seriesURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!seriesResp.ok) {
      return res.status(404).json({ error: "Series not found", slug });
    }
    const seriesHtml = await seriesResp.text();
    const $series = cheerio.load(seriesHtml);

    // Count season‐tabs (assumes they live under "#season_list li a")
    let totalSeasons = 1;
    $series("#season_list li a").each(() => totalSeasons++);
    // if that selector doesn't match your theme, adjust accordingly

    // 2) Fetch the episode 1 page of the requested season (slug-{season}x1)
    const epSlug = `${slug}-${seasonNum}x1`;
    const epiURL = `${baseURL}/episode/${epSlug}`.replace(/\/+$/, "");
    const epiResp = await fetch(epiURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!epiResp.ok) {
      return res.status(404).json({
        error: "Episode page not found",
        tried: epiURL
      });
    }
    const epiHtml = await epiResp.text();
    const $ = cheerio.load(epiHtml);

    // 3) Extract only the episodes list for that season
    const episodes = [];
    $("#episode_by_temp li").each((_, el) => {
      const epNum = $(el).find(".num-epi").text().trim();
      const epName = $(el).find(".entry-title").text().trim();
      const epThumb = $(el).find("img").attr("src") || "";
      const epUrl = ($(el).find("a.lnk-blk").attr("href") || "").replace(/\/+$/, "");
      episodes.push({
        episode: epNum,
        title:   epName,
        thumbnail: epThumb,
        url:     epUrl
      });
    });

    return res.status(200).json({
      status:        "ok",
      currentSeason: seasonNum,
      totalSeasons,
      episodes
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error:   "Internal error",
      details: err.message
    });
  }
}

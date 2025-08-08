// File: /api/series/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const seriesURL = `${baseURL}/series/${slug}/`;

    // 1) Fetch the page
    const response = await fetch(seriesURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!response.ok) {
      return res.status(404).json({ error: "Series not found" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 2) Title
    const title = $("h1.entry-title").text().trim() || slug.replace(/-/g, " ");

    // 3) Seasons (detect from the dropdown)
    const seasons = [];
    $(".choose-season .aa-cnt li.sel-temp a").each((_, el) => {
      const num = parseInt($(el).attr("data-season"));
      if (!isNaN(num)) seasons.push(num);
    });
    const total_seasons = seasons.length || 1;
    const current_season = seasons[0] || 1;

    // 4) Episodes for current season
    const episodes = [];
    $("#episode_by_temp li").each((_, li) => {
      const num   = $(li).find(".num-epi").text().trim();          // e.g. "1x3"
      const name  = $(li).find("h2.entry-title").text().trim();    // e.g. "Rent-a-Girlfriend 1x3"
      const url   = $(li).find("a.lnk-blk").attr("href");          // full URL

      if (num && name && url) {
        episodes.push({
          number: num,
          title: name,
          url: new URL(url, baseURL).pathname
        });
      }
    });

    // 5) Return JSON
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

// File: /api/series/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    const baseURL   = "https://watchanimeworld.in";
    const seriesURL = `${baseURL}/series/${slug}/`;

    // 1) Fetch series page
    const resp = await fetch(seriesURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!resp.ok) {
      return res.status(404).json({ error: "Series not found" });
    }
    const html = await resp.text();
    const $    = cheerio.load(html);

    // 2) Title
    const title = $("h1.entry-title").text().trim() || slug.replace(/-/g, " ");

    // 3) Detect seasons
    const seasons = [];
    $(".choose-season .aa-cnt li.sel-temp a").each((_, a) => {
      const n = parseInt($(a).attr("data-season"));
      if (!isNaN(n)) seasons.push(n);
    });
    const total_seasons  = seasons.length || 1;
    const current_season = 1;

    // 4) Scrape Season 1 episodes
    const episodes = [];
    $("#episode_by_temp li").each((_, li) => {
      const $li      = $(li);
      const numEpi   = $li.find(".num-epi").text().trim();             // "1x1"
      const match    = /^(\d+)x(\d+)$/.exec(numEpi);
      if (!match || parseInt(match[1]) !== current_season) return;

      const epTitle  = $li.find("h2.entry-title").text().trim();
      let   href     = $li.find("a.lnk-blk").attr("href") || "";
      const thumb    = $li.find(".post-thumbnail img").attr("src") || "";

      if (numEpi && epTitle && href) {
        // normalize URL
        if (!href.startsWith("http")) href = baseURL + href;
        episodes.push({
          number: numEpi,
          title:  epTitle,
          url:    href,
          poster: thumb.startsWith("http") ? thumb : (baseURL + thumb)
        });
      }
    });

    // 5) JSON response
    res.status(200).json({
      status:           "ok",
      title,
      total_seasons,
      current_season,
      total_episodes:   episodes.length,
      episodes
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}

// pages/api/series/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug, season } = req.query;
    const seasonNum = season ? parseInt(season, 10) : 1;
    const baseURL = "https://watchanimeworld.in";

    if (!slug || isNaN(seasonNum) || seasonNum < 1) {
      return res.status(400).json({ error: "Invalid slug or season" });
    }

    // 1) Always start from the base series page
    const seriesURL = `${baseURL}/series/${slug}/`;
    const seriesRes = await fetch(seriesURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!seriesRes.ok) {
      return res.status(404).json({ error: "Series not found", slug });
    }

    const seriesHtml = await seriesRes.text();
    const $series = cheerio.load(seriesHtml);

    // 2) Detect seasons and select one
    let totalSeasons = 1;
    let seasonFirstEpUrl = null;

    $series("div.aa-drp.choose-season ul.aa-cnt.sub-menu li a").each((_, el) => {
      const s = parseInt($series(el).attr("data-season"), 10);
      if (!isNaN(s) && s > totalSeasons) totalSeasons = s;
      if (s === seasonNum && !seasonFirstEpUrl) {
        seasonFirstEpUrl = new URL($series(el).attr("href"), baseURL).href;
      }
    });

    // 3) If no season menu, fallback to episode list
    if (!seasonFirstEpUrl) {
      const allEps = $series("#episode_by_temp li a.lnk-blk");
      if (!allEps.length) {
        return res.status(404).json({ error: "No episodes found" });
      }
      seasonFirstEpUrl = new URL($series(allEps[0]).attr("href"), baseURL).href;
    }

    // 4) Fetch the first episode page of that season
    const epiRes = await fetch(seasonFirstEpUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!epiRes.ok) {
      return res.status(404).json({ error: "Episode page not found" });
    }

    const epiHtml = await epiRes.text();
    const $ = cheerio.load(epiHtml);

    // 5) Extract all episodes in season
    const episodes = [];
    $("#episode_by_temp li").each((_, el) => {
      const epNum = $(el).find(".num-epi").text().trim();
      const epTitle = $(el).find(".entry-title").text().trim();
      const thumb = $(el).find("img").attr("src") || "";
      const link = $(el).find("a.lnk-blk").attr("href") || "";
      if (link) {
        episodes.push({
          episode: epNum,
          title: epTitle,
          thumbnail: thumb,
          url: new URL(link, baseURL).href
        });
      }
    });

    return res.status(200).json({
      status: "ok",
      currentSeason: seasonNum,
      totalSeasons,
      totalEpisodes: episodes.length,
      episodes
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

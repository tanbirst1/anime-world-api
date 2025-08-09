// pages/api/series/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug, season } = req.query;
    const seasonNum = season ? parseInt(season, 10) : 1;

    if (!slug || isNaN(seasonNum) || seasonNum < 1) {
      return res.status(400).json({ error: "Invalid slug or season" });
    }

    const baseURL = "https://watchanimeworld.in";

    // 1) Fetch the main series page
    const seriesURL = `${baseURL}/series/${slug}`.replace(/\/+$/, "");
    const seriesRes = await fetch(seriesURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!seriesRes.ok) {
      return res.status(404).json({ error: "Series not found", slug });
    }

    const seriesHtml = await seriesRes.text();
    const $series = cheerio.load(seriesHtml);

    // 2) Find total seasons & URL for selected season
    let totalSeasons = 1;
    let seasonFirstEpUrl = null;

    $series("div.aa-drp.choose-season ul.aa-cnt.sub-menu li a").each((_, el) => {
      const s = parseInt($series(el).attr("data-season"), 10);
      if (!isNaN(s) && s > totalSeasons) totalSeasons = s;

      if (s === seasonNum && !seasonFirstEpUrl) {
        seasonFirstEpUrl = $series(el).attr("href");
      }
    });

    // Fallback: if season 1 and no menu link, try first episode in list
    if (!seasonFirstEpUrl && seasonNum === 1) {
      const firstEp = $series("#episode_by_temp li a.lnk-blk").first().attr("href");
      if (firstEp) seasonFirstEpUrl = firstEp;
    }

    if (!seasonFirstEpUrl) {
      return res.status(404).json({
        error: "Season not found",
        season: seasonNum
      });
    }

    // 3) Normalize seasonFirstEpUrl to a full link
    if (!seasonFirstEpUrl.startsWith("http")) {
      seasonFirstEpUrl = `${baseURL}${seasonFirstEpUrl.replace(/^\/+/, "")}`;
    }

    // 4) If this URL is a season page, find its first episode link
    if (seasonFirstEpUrl.includes(`/series/`)) {
      const seasonPageRes = await fetch(seasonFirstEpUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const seasonPageHtml = await seasonPageRes.text();
      const $seasonPage = cheerio.load(seasonPageHtml);
      const firstEpLink = $seasonPage("#episode_by_temp li a.lnk-blk").first().attr("href");

      if (firstEpLink) {
        seasonFirstEpUrl = firstEpLink.startsWith("http")
          ? firstEpLink
          : `${baseURL}${firstEpLink.replace(/^\/+/, "")}`;
      }
    }

    // 5) Fetch first episode page to list all episodes in the season
    const epiRes = await fetch(seasonFirstEpUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!epiRes.ok) {
      return res.status(404).json({
        error: "Episode page not found",
        tried: seasonFirstEpUrl
      });
    }

    const epiHtml = await epiRes.text();
    const $ = cheerio.load(epiHtml);

    // 6) Extract episode list
    const episodes = [];
    $("#episode_by_temp li").each((_, el) => {
      const $el = $(el);
      episodes.push({
        episode:   $el.find(".num-epi").text().trim(),
        title:     $el.find(".entry-title").text().trim(),
        thumbnail: $el.find("img").attr("src") || "",
        url:       ($el.find("a.lnk-blk").attr("href") || "").replace(/\/+$/, "")
      });
    });

    return res.status(200).json({
      status:         "ok",
      currentSeason:  seasonNum,
      totalSeasons,
      totalEpisodes:  episodes.length,
      episodes
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error:   "Server error",
      details: err.message
    });
  }
}

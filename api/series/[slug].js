import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  return getSeasonData(req, res, 1);
}

async function getSeasonData(req, res, seasonNumber = 1) {
  try {
    let { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Slug missing" });

    const baseURL = "https://watchanimeworld.in";

    const trySlugs = [
      `${slug}-1x1`,
      `${slug}-episode-1`
    ];

    let html = null;
    let usedSlug = null;

    for (const trySlug of trySlugs) {
      const pageURL = `${baseURL}/episode/${trySlug}`.replace(/\/+$/, "");
      const response = await fetch(pageURL, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      if (response.ok) {
        html = await response.text();
        usedSlug = trySlug;
        break;
      }
    }

    if (!html) {
      return res.status(404).json({
        error: "Episode not found. Tried slug variants.",
        tried: trySlugs
      });
    }

    const $ = cheerio.load(html);

    const seasonBlocks = $(".bixbox.animefull > .bixbox").find("ul#episode_by_temp");
    const totalSeasons = seasonBlocks.length || 1;
    const currentSeason = Math.min(seasonNumber, totalSeasons);

    const targetSeason = seasonBlocks.eq(currentSeason - 1);

    let episodes = [];
    targetSeason.find("li").each((i, el) => {
      let epNum = $(el).find(".num-epi").text().trim();
      let epName = $(el).find(".entry-title").text().trim();
      let epThumb = $(el).find("img").attr("src") || "";
      let epUrl = ($(el).find("a.lnk-blk").attr("href") || "").replace(/\/+$/, "");
      episodes.push({ episode: epNum, title: epName, thumbnail: epThumb, url: epUrl });
    });

    res.status(200).json({
      status: "ok",
      slug,
      usedSlug,
      currentSeason,
      totalSeasons,
      episodes
    });

  } catch (err) {
    res.status(500).json({
      error: "Scraping failed",
      details: err.message
    });
  }
}

export { getSeasonData };

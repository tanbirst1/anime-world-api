import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    let { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Slug missing" });

    const baseURL = "https://watchanimeworld.in";

    // Try these slug formats in order (without trailing slash)
    const trySlugs = [
      `${slug}-1x1`,
      `${slug}-episode-1`
    ];

    let html = null;
    let usedSlug = null;

    for (const trySlug of trySlugs) {
      // Normalize URL — no trailing slash
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

    // Episode main details
    const episodeTitle = $(".video-player div").first().text().trim() || "Unknown Episode";
    const currentEpisode = $(".num-epi").first().text().trim() || "";

    // Episode list
    let episodes = [];
    $("#episode_by_temp li").each((i, el) => {
      let epNum = $(el).find(".num-epi").text().trim();
      let epName = $(el).find(".entry-title").text().trim();
      let epThumb = $(el).find("img").attr("src") || "";
      let epUrl = ($(el).find("a.lnk-blk").attr("href") || "").replace(/\/+$/, "");
      episodes.push({ episode: epNum, title: epName, thumbnail: epThumb, url: epUrl });
    });

    res.status(200).json({
      status: "ok",
      usedSlug,
      episodeTitle,
      currentEpisode,
      episodes
    });

  } catch (err) {
    res.status(500).json({
      error: "Scraping failed",
      details: err.message
    });
  }
}

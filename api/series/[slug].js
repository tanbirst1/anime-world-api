import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Slug missing" });

    const baseURL = "https://watchanimeworld.in";

    // Try original slug first
    const trySlugs = [slug];

    // If slug ends with "-1x1", attempt fallback to "-episode-1"
    if (slug.endsWith("-1x1")) {
      trySlugs.push(slug.replace(/-1x1$/, "-episode-1"));
    }

    let html = null;
    let usedSlug = slug;

    for (const trySlug of trySlugs) {
      const pageURL = `${baseURL}/episode/${trySlug}/`;
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
      return res.status(404).json({ error: "Episode not found. Invalid slug or URL changed." });
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
      let epUrl = $(el).find("a.lnk-blk").attr("href") || "";
      episodes.push({ episode: epNum, title: epName, thumbnail: epThumb, url: epUrl });
    });

    res.status(200).json({
      status: "ok",
      episodeTitle,
      currentEpisode,
      usedSlug,
      episodes
    });

  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}

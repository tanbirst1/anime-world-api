import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Slug missing" });

    const baseURL = "https://watchanimeworld.in";
    const pageURL = `${baseURL}/episode/${slug}/`;

    const response = await fetch(pageURL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return res.status(500).json({ error: "Failed to fetch episode page" });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Episode main details
    const episodeTitle = $(".video-player div").first().text().trim() || "Unknown Episode";
    const currentEpisode = $(".num-epi").first().text().trim() || "";

    // Episode list (other episodes in season)
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
      episodes
    });

  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}

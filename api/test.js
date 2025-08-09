import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const postId = req.query.post || "";
    const season = req.query.season || "";

    if (!postId || !season) {
      return res.status(400).json({ error: "Missing postId or season" });
    }

    const url = `https://watchanimeworld.in/wp-admin/admin-ajax.php?action=action_select_season&post=${postId}&season=${season}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Request failed: ${response.statusText}` });
    }

    const html = await response.text();
    if (!html.trim()) {
      return res.json({ totalEpisodes: 0, episodes: [] }); // gracefully handle empty season
    }

    const $ = cheerio.load(html);
    const episodes = [];

    $(".episode").each((_, el) => {
      const title = $(el).find(".episode-title").text().trim() || null;
      const link = $(el).find("a").attr("href") || null;
      const img = $(el).find("img").attr("src") || null;

      if (title && link) {
        episodes.push({ title, link, img });
      }
    });

    res.json({
      totalEpisodes: episodes.length,
      episodes
    });

  } catch (err) {
    console.error("Scraper error:", err);
    res.status(500).json({ error: "Scraper crashed", details: err.message });
  }
}

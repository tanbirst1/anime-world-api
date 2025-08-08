import fetch from "node-fetch";
import * as cheerio from "cheerio";

function fixURL(url) {
  if (!url) return "";
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return "https://watchanimeworld.in" + url;
  return url;
}

export default async function handler(req, res) {
  try {
    const { slug, season = "1" } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const seriesURL = `${baseURL}/series/${slug}/`;

    const response = await fetch(seriesURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) {
      return res.status(404).json({ error: "Series not found" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim() || slug.replace(/-/g, " ");
    const poster =
      fixURL(
        $("meta[property='og:image']").attr("content") ||
        $(".post-thumbnail img").attr("src") ||
        $(".entry-header img").attr("src")
      ) || "";
    const description =
      $(".description p").first().text().trim() ||
      $("meta[name='description']").attr("content") ||
      "";

    const allEpisodes = [];
    const seasonSet = new Set();

    $("a[href*='/episode/']").each((_, el) => {
      const link = $(el).attr("href");
      const name = $(el).text().trim();
      const img = $(el).find("img").attr("src") ||
                  $(el).parent().find("img").attr("src") ||
                  "";

      const match = link.match(/-(\d+)x(\d+)\//);
      if (match) {
        const seasonNum = parseInt(match[1]);
        const episodeNum = parseInt(match[2]);
        seasonSet.add(seasonNum);

        allEpisodes.push({
          season: seasonNum,
          episode: episodeNum,
          name: name || `Episode ${episodeNum}`,
          url: new URL(link, baseURL).pathname,
          poster: fixURL(img)
        });
      }
    });

    const currentSeason = parseInt(season);
    const filteredEpisodes = allEpisodes
      .filter((ep) => ep.season === currentSeason)
      .sort((a, b) => a.episode - b.episode);

    res.status(200).json({
      status: "ok",
      title,
      description,
      poster,
      total_seasons: Math.max(...seasonSet),
      current_season: currentSeason,
      total_episodes: filteredEpisodes.length,
      episodes: filteredEpisodes.map((ep) => ({
        episode: ep.episode,
        name: ep.name,
        url: ep.url,
        poster: ep.poster
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}

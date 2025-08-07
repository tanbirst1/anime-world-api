import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Logger with timestamp
function log(message, data = null) {
  const time = new Date().toISOString();
  console.log(`[${time}] ${message}`);
  if (data) console.dir(data, { depth: null });
}

export default async function handler(req, res) {
  try {
    const { slug, season } = req.query;

    if (!slug) {
      log("Missing 'slug' in query");
      return res.status(400).json({ error: "Missing 'slug' in query." });
    }

    const seasonNumber = parseInt(season) || 1;
    const episodeUrl = `https://watchanimeworld.in/episode/${slug}-${seasonNumber}x1/`;

    log("Fetching URL", episodeUrl);
    const response = await fetch(episodeUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      const msg = `Episode page not found (status ${response.status})`;
      log(msg);
      return res.status(404).json({ error: msg });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const seriesTitle =
      $("h1.entry-title").text().trim() || slug.replace(/-/g, " ");
    log("Series title", seriesTitle);

    // Extract all available seasons
    const seasons = [];
    $(".se-c").each((i, el) => {
      const seasonTitle = $(el).find(".season-title").text().trim();
      if (seasonTitle) seasons.push(seasonTitle);
    });
    log("Total seasons found", seasons.length);

    const seasonIndex = seasonNumber - 1;
    const seasonBlock = $(".se-c").get(seasonIndex);

    if (!seasonBlock) {
      const msg = `Season block not found for index: ${seasonIndex}`;
      log(msg);
      return res.status(404).json({ error: msg });
    }

    const episodes = [];

    $(seasonBlock)
      .find(".episodios li")
      .each((i, el) => {
        const epTitle = $(el).find(".episodiotitle").text().trim();
        const epLink = $(el).find("a").attr("href") || "";

        let epSlug = null;
        if (epLink.includes("/episode/")) {
          const parts = epLink.split("/episode/");
          if (parts[1]) epSlug = parts[1].replace(/\//g, "");
        }

        if (epSlug) {
          episodes.push({
            title: epTitle || `Episode ${i + 1}`,
            slug: epSlug,
          });
        } else {
          log("Invalid episode link found", epLink);
        }
      });

    log("Episodes extracted", episodes.length);

    return res.status(200).json({
      title: seriesTitle,
      totalSeasons: seasons.length,
      currentSeason: seasonNumber,
      episodes,
    });
  } catch (err) {
    log("Unexpected error", err.stack || err.message);
    return res.status(500).json({
      error: "Unexpected error",
      message: err.message,
      stack: err.stack,
    });
  }
}

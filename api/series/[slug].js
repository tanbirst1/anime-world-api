import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { slug, season = 1 } = req.query;
  const url = `https://watchanimeworld.in/${slug}/`;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("title").first().text().trim();

    // Get seasons
    const seasons = [];
    $(".choose-season .aa-cnt li.sel-temp a").each((i, el) => {
      const seasonNum = $(el).attr("data-season");
      if (seasonNum) {
        seasons.push(Number(seasonNum));
      }
    });

    const total_seasons = seasons.length;
    const current_season = seasons.includes(Number(season)) ? Number(season) : (seasons[0] || 1);

    const episodes = [];
    $("#episode_by_temp li").each((i, el) => {
      const seasonEpisode = $(el).find(".num-epi").text().trim(); // e.g. "1x1"
      const name = $(el).find("h2.entry-title").text().trim();
      const href = $(el).find("a.lnk-blk").attr("href");

      if (seasonEpisode && name && href) {
        episodes.push({
          number: seasonEpisode,
          title: name,
          url: href
        });
      }
    });

    res.status(200).json({
      title,
      total_seasons,
      current_season,
      total_episodes: episodes.length,
      episodes
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch episode data" });
  }
}    const description =
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

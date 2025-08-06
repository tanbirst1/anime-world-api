import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    const url = `https://watchanimeworld.in/series/${slug}/`;

    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Title
    const title = $("h1.entry-title").text().trim();

    // Dropdown Seasons
    let seasons = [];
    $(".choose-season ul.aa-cnt li a").each((i, el) => {
      const seasonNumber = $(el).data("season");
      seasons.push({ season: seasonNumber, episodes: [] });
    });

    // Remove duplicates
    seasons = seasons.filter((v, i, a) => a.findIndex(t => t.season === v.season) === i);

    // Episodes (for active season in HTML)
    $("#episode_by_temp li").each((i, el) => {
      const epCode = $(el).find(".num-epi").text().trim();
      const epTitle = $(el).find("h2.entry-title").text().trim();
      const epLink = $(el).find("a.lnk-blk").attr("href");

      if (seasons.length > 0) {
        const activeSeason = $(".choose-season .n_s").text().trim();
        const targetSeason = seasons.find(s => String(s.season) === activeSeason);
        if (targetSeason) {
          targetSeason.episodes.push({
            ep: epCode,
            title: epTitle,
            link: epLink
          });
        }
      }
    });

    const result = {
      title: title,
      totalSeasons: seasons.length,
      totalEpisodes: seasons.reduce((sum, s) => sum + s.episodes.length, 0),
      seasons: seasons
    };

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

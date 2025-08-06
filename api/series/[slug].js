import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    const baseUrl = `https://watchanimeworld.in/series/${slug}/`;

    // Fetch main page
    const htmlRes = await fetch(baseUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)" }
    });
    if (!htmlRes.ok) throw new Error("Failed to load series page");

    const html = await htmlRes.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim();

    // Get seasons list
    const seasonLinks = $(".choose-season ul.aa-cnt li a")
      .map((i, el) => ({
        season: $(el).attr("data-season"),
        slugUrl: `${baseUrl}?season=${$(el).attr("data-season")}`
      }))
      .get();

    let seasonsData = [];

    // Sequential fetch to avoid memory overload
    for (const seasonObj of seasonLinks) {
      try {
        const seasonRes = await fetch(seasonObj.slugUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)" }
        });
        if (!seasonRes.ok) {
          seasonsData.push({ season: seasonObj.season, episodes: [] });
          continue;
        }

        const seasonHtml = await seasonRes.text();
        const $$ = cheerio.load(seasonHtml);

        const episodes = [];
        $$("#episode_by_temp li").each((_, el) => {
          episodes.push({
            ep: $$(el).find(".num-epi").text().trim(),
            title: $$(el).find("h2.entry-title").text().trim(),
            link: $$(el).find("a.lnk-blk").attr("href")
          });
        });

        seasonsData.push({ season: seasonObj.season, episodes });
      } catch {
        seasonsData.push({ season: seasonObj.season, episodes: [] });
      }
    }

    const result = {
      title,
      totalSeasons: seasonsData.length,
      totalEpisodes: seasonsData.reduce((sum, s) => sum + s.episodes.length, 0),
      seasons: seasonsData
    };

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

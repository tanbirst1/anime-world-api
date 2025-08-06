import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    const baseUrl = `https://watchanimeworld.in/series/${slug}/`;

    // Fetch series page
    const htmlRes = await fetch(baseUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!htmlRes.ok) throw new Error("Failed to load series page");

    const html = await htmlRes.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim();
    const postId = $(".choose-season ul.aa-cnt li a").first().attr("data-post");
    if (!postId) throw new Error("Post ID not found");

    const seasons = $(".choose-season ul.aa-cnt li a")
      .map((i, el) => $(el).attr("data-season"))
      .get();

    let seasonsData = [];

    // Fetch each season via AJAX
    for (const seasonNumber of seasons) {
      try {
        const ajaxRes = await fetch(
          "https://watchanimeworld.in/wp-admin/admin-ajax.php",
          {
            method: "POST",
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "Referer": baseUrl
            },
            body: new URLSearchParams({
              action: "action_select_season", // Correct action for dropdown
              post: postId,
              season: seasonNumber
            })
          }
        );

        if (!ajaxRes.ok) {
          seasonsData.push({ season: seasonNumber, episodes: [] });
          continue;
        }

        const ajaxHtml = await ajaxRes.text();
        const $$ = cheerio.load(ajaxHtml);

        const episodes = [];
        $$("#episode_by_temp li").each((_, el) => {
          episodes.push({
            ep: $$(el).find(".num-epi").text().trim(),
            title: $$(el).find("h2.entry-title").text().trim(),
            link: $$(el).find("a.lnk-blk").attr("href")
          });
        });

        seasonsData.push({ season: seasonNumber, episodes });
      } catch {
        seasonsData.push({ season: seasonNumber, episodes: [] });
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

import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const seriesUrl = "https://watchanimeworld.in/series/naruto/";
    const html = await fetch(seriesUrl).then(r => r.text());
    const $ = cheerio.load(html);

    // Find dropdown
    const dropdown = $("select#select_season");
    if (!dropdown.length) {
      return res.status(500).json({ error: "Season dropdown not found" });
    }

    const postId = dropdown.attr("data-post");
    if (!postId) {
      return res.status(500).json({ error: "postId not found" });
    }

    let result = {};

    // Loop seasons
    for (let option of dropdown.find("option")) {
      const seasonNum = $(option).attr("value");
      if (!seasonNum) continue;

      const ajaxUrl = `https://watchanimeworld.in/wp-admin/admin-ajax.php?action=action_select_season&post=${postId}&season=${seasonNum}`;
      try {
        const seasonHtml = await fetch(ajaxUrl).then(r => r.text());
        const $$ = cheerio.load(seasonHtml);
        const episodeCount = $$("li.video-block").length;

        result[`Season ${seasonNum}`] = episodeCount;
      } catch (e) {
        result[`Season ${seasonNum}`] = "error";
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

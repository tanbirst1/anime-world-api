import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    // 1. Get the anime page
    const pageResp = await fetch(`https://watchanimeworld.in/series/${slug}/`);
    const html = await pageResp.text();
    const $ = cheerio.load(html);

    // 2. Extract post ID from "data-post" or from inline scripts
    let postId = $("body").attr("data-postid");
    if (!postId) {
      const scriptContent = $('script:contains("post_id")').html() || "";
      const match = scriptContent.match(/post_id\s*:\s*(\d+)/);
      if (match) postId = match[1];
    }

    if (!postId) {
      return res.status(500).json({ error: "Failed to get postId" });
    }

    // 3. Detect latest season number (fallback to 1)
    let seasonNumber = $('select#season-selector option').last().val();
    if (!seasonNumber) seasonNumber = 1;

    // 4. Fetch episodes for that season
    const episodesResp = await fetch(
      `https://watchanimeworld.in/wp-admin/admin-ajax.php?action=action_select_season&post=${postId}&season=${seasonNumber}`
    );
    const episodesHtml = await episodesResp.text();
    const $$ = cheerio.load(episodesHtml);

    // 5. Parse episodes
    const episodes = [];
    $$(".episode").each((i, el) => {
      const title = $$(el).find(".title").text().trim();
      const url = $$(el).find("a").attr("href");
      episodes.push({ title, url });
    });

    res.json({
      postId,
      season: seasonNumber,
      episodes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const url = "https://watchanimeworld.in/series/naruto/";

    // Step 1: Fetch the main page
    const mainPage = await fetch(url);
    const mainHtml = await mainPage.text();
    let $ = cheerio.load(mainHtml);

    // Step 2: Get post ID
    const postId = $("body").attr("class")?.match(/postid-(\d+)/)?.[1];
    if (!postId) {
      return res.status(500).json({ error: "Post ID not found" });
    }

    // Step 3: Get all available seasons
    let seasons = [];
    $("select#season > option").each((_, el) => {
      const val = $(el).attr("value");
      if (val && !isNaN(val)) seasons.push(parseInt(val));
    });

    if (seasons.length === 0) {
      // Default to season 1 if dropdown missing
      seasons = [1];
    }

    let results = [];

    // Step 4: Loop seasons and get episodes
    for (let seasonNum of seasons) {
      const seasonUrl = `https://watchanimeworld.in/wp-admin/admin-ajax.php?action=action_select_season&post=${postId}&season=${seasonNum}`;
      const seasonRes = await fetch(seasonUrl);
      const seasonHtml = await seasonRes.text();

      $ = cheerio.load(seasonHtml);
      const episodes = $("li.episode").length;

      results.push({
        season: seasonNum,
        totalEpisodes: episodes
      });
    }

    return res.json(results);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

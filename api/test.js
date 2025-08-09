import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function getSeasonData(url) {
  try {
    const html = await fetch(url).then(res => res.text());
    const $ = cheerio.load(html);

    // Extract postId from HTML (data-post attribute or hidden input)
    let postId = $('[data-post]').attr('data-post') || $('input[name="post_id"]').val();
    if (!postId) throw new Error("Post ID not found");

    // Get available seasons from dropdown
    let seasons = [];
    $('select#season option').each((i, el) => {
      let seasonVal = $(el).attr('value');
      if (seasonVal) seasons.push(seasonVal);
    });
    if (!seasons.length) throw new Error("No seasons found");

    // Use the last (latest) season
    let latestSeason = seasons[seasons.length - 1];

    // Make the AJAX request
    const ajaxUrl = `https://watchanimeworld.in/wp-admin/admin-ajax.php?action=action_select_season&post=${postId}&season=${latestSeason}`;
    const seasonHtml = await fetch(ajaxUrl).then(res => res.text());

    // Parse episodes
    const $$ = cheerio.load(seasonHtml);
    let episodes = [];
    $$('.episodiotitle').each((i, el) => {
      episodes.push({
        title: $$(el).text().trim(),
        link: $$(el).find('a').attr('href')
      });
    });

    return {
      postId,
      latestSeason,
      totalEpisodes: episodes.length,
      episodes
    };
  } catch (err) {
    return { error: err.message };
  }
}

// Example usage
getSeasonData("https://watchanimeworld.in/series/naruto/").then(console.log);

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const url = 'https://watchanimeworld.in/series/naruto/';
    const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const $ = cheerio.load(html);

    // Extract all seasons from dropdown
    const seasons = [];
    $('li.sel-temp a').each((_, el) => {
      seasons.push({
        season: $(el).attr('data-season'),
        postId: $(el).attr('data-post'),
        name: $(el).text().trim(),
        isActive: $(el).parent().hasClass('active') || $(el).parent().hasClass('selected')
      });
    });

    const results = [];

    for (const s of seasons) {
      let totalEpisodes = 0;

      if (s.isActive) {
        // This is the season currently loaded in HTML
        totalEpisodes = $('#episode_by_temp li').length;
      } else {
        // Other seasons require AJAX call
        const ajaxUrl = `https://watchanimeworld.in/wp-admin/admin-ajax.php?action=action_name&post=${s.postId}&season=${s.season}`;
        try {
          const seasonHtml = await (await fetch(ajaxUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
          const $$ = cheerio.load(seasonHtml);
          totalEpisodes = $$('#episode_by_temp li').length;
        } catch (err) {
          console.error(`Failed to fetch season ${s.season}:`, err.message);
        }
      }

      results.push({
        season: s.name,
        totalEpisodes
      });
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Scraper failed', details: err.message });
  }
}

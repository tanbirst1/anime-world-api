import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const baseUrl = 'https://watchanimeworld.in/series/naruto/';
    const html = await (await fetch(baseUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })).text();
    const $ = cheerio.load(html);

    // Extract seasons from dropdown list
    const seasons = [];
    $('li.sel-temp a').each((_, el) => {
      seasons.push({
        season: $(el).attr('data-season'),
        postId: $(el).attr('data-post'),
        name: $(el).text().trim()
      });
    });

    const results = [];

    // Fetch episodes per season via AJAX endpoint
    for (const s of seasons) {
      try {
        const ajaxUrl = `https://watchanimeworld.in/wp-admin/admin-ajax.php?action=action_name&post=${s.postId}&season=${s.season}`;
        const seasonHtml = await (await fetch(ajaxUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        })).text();
        const $$ = cheerio.load(seasonHtml);
        const totalEpisodes = $$('li.mark-ep').length;
        results.push({ season: s.name, totalEpisodes });
      } catch (e) {
        results.push({ season: s.name, totalEpisodes: 0, error: e.message });
      }
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Scraper failed', details: err.message });
  }
}

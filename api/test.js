import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const url = 'https://watchanimeworld.in/series/naruto/';
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(html);

    // Grab season list
    const seasons = [];
    $('li.sel-temp a').each((_, el) => {
      const seasonNum = $(el).attr('data-season');
      seasons.push({
        season: seasonNum,
        postId: $(el).attr('data-post'),
        name: $(el).text().trim()
      });
    });

    // For each season, fetch episodes count
    const results = [];
    for (const season of seasons) {
      const seasonUrl = `https://watchanimeworld.in/wp-admin/admin-ajax.php?action=action_name&post=${season.postId}&season=${season.season}`;
      try {
        const { data: seasonHtml } = await axios.get(seasonUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $$ = cheerio.load(seasonHtml);
        const totalEpisodes = $$('li.mark-ep').length;
        results.push({ season: season.name, totalEpisodes });
      } catch {
        results.push({ season: season.name, totalEpisodes: 0 });
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: 'Scraper failed', details: err.message });
  }
}

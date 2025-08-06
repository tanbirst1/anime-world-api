import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const pageParam = req.query.page || '1';

    // Read base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Target URL (page 1 → /movies/, else /movies/page/X/)
    const targetURL = pageParam === '1'
      ? `${baseURL}/movies/`
      : `${baseURL}/movies/page/${pageParam}/`;

    // Fetch HTML
    const response = await fetch(targetURL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html"
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: `Failed to fetch: ${response.status}` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let moviesList = [];

    $('.movies').each((_, el) => {
      const title = $(el).find('.entry-title').text().trim();
      let link = $(el).find('a.lnk-blk').attr('href');
      let image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

      // Normalize URLs
      if (link?.startsWith(baseURL)) link = link.replace(baseURL, '');
      if (image?.startsWith('//')) image = 'https:' + image;

      if (title) {
        moviesList.push({ title, link, image });
      }
    });

    res.status(200).json({
      status: 'ok',
      page: pageParam,
      movies: moviesList
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

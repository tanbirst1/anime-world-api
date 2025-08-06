import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const searchSlug = req.query.slug;
    if (!searchSlug) {
      return res.status(400).json({ error: 'Missing search query' });
    }

    // Read base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Search URL
    const searchURL = `${baseURL}/?s=${encodeURIComponent(searchSlug)}`;

    // Fetch HTML
    const response = await fetch(searchURL, {
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

    let results = [];

    $('ul.post-lst li').each((_, el) => {
      const title = $(el).find('h2.entry-title').text().trim();
      let link = $(el).find('a.lnk-blk').attr('href');
      let image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

      // Normalize link → only keep /{slug}
      if (link?.startsWith(baseURL)) {
        link = link.replace(baseURL, '');
      }
      // Add https if image starts with //
      if (image?.startsWith('//')) {
        image = 'https:' + image;
      }

      if (title && link) {
        results.push({ title, link, image });
      }
    });

    res.status(200).json({
      status: 'ok',
      search: searchSlug,
      results
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const searchSlug = req.query.slug;
    const pageParam = req.query.page || '1';

    if (!searchSlug) {
      return res.status(400).json({ error: 'Missing search query' });
    }

    // Read base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Search URL
    const searchURL = pageParam === '1'
      ? `${baseURL}/?s=${encodeURIComponent(searchSlug)}`
      : `${baseURL}/page/${pageParam}/?s=${encodeURIComponent(searchSlug)}`;

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

    // Extract each result
    $('ul.post-lst li').each((_, el) => {
      const li = $(el);

      const title = li.find('h2.entry-title').text().trim();
      let link = li.find('a.lnk-blk').attr('href');
      let image = li.find('img').attr('src') || li.find('img').attr('data-src');

      // Normalize link → /{slug}
      if (link?.startsWith(baseURL)) {
        link = link.replace(baseURL, '');
      }
      // Normalize image
      if (image?.startsWith('//')) {
        image = 'https:' + image;
      }

      // Extract details
      const postId = li.attr('id') || '';
      const typeMatch = (li.attr('class') || '').match(/type-(\w+)/);
      const type = typeMatch ? typeMatch[1] : '';

      const categoryMatches = (li.attr('class') || '').match(/category-([\w-]+)/g) || [];
      const categories = categoryMatches.map(c => c.replace('category-', ''));

      const yearMatch = (li.attr('class') || '').match(/annee-(\d+)/);
      const year = yearMatch ? yearMatch[1] : '';

      const castMatches = (li.attr('class') || '').match(/cast_tv-([\w-]+)/g) || [];
      const cast = castMatches.map(c => c.replace('cast_tv-', '').replace(/-/g, ' '));

      if (title && link) {
        results.push({
          id: postId,
          title,
          link,
          image,
          type,
          categories,
          year,
          cast
        });
      }
    });

    // Extract total pages
    let totalPages = 1;
    const lastPageLink = $('nav.pagination .page-link')
      .map((_, el) => parseInt($(el).text()))
      .get()
      .filter(n => !isNaN(n));

    if (lastPageLink.length > 0) {
      totalPages = Math.max(...lastPageLink);
    }

    res.status(200).json({
      status: 'ok',
      search: searchSlug,
      currentPage: parseInt(pageParam),
      totalPages,
      results
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

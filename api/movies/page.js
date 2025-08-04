import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const { page } = req.query;
    const pageNum = page && !isNaN(page) ? page : 1;

    // Base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Target page URL
    const targetURL =
      pageNum == 1
        ? `${baseURL}/movies/`
        : `${baseURL}/movies/page/${pageNum}/`;

    const resp = await fetch(targetURL, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html" }
    });

    if (!resp.ok) {
      return res.status(500).json({ error: `Failed to fetch: ${resp.status}` });
    }

    const html = await resp.text();
    const $ = cheerio.load(html);

    let movies = [];
    $('.movies .post, .items .post').each((_, el) => {
      const title = $(el).find('.entry-title').text().trim();
      let poster = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      if (poster?.startsWith('//')) poster = 'https:' + poster;
      let link = $(el).find('a').attr('href');
      if (link?.startsWith(baseURL)) link = link.replace(baseURL, '');
      const year = $(el).find('.year').text().trim();

      if (title) movies.push({ title, poster, link, year });
    });

    res.status(200).json({
      status: "ok",
      page: pageNum,
      total: movies.length,
      movies
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

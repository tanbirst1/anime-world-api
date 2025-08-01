import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Read base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Get Cloudflare cookies
    let cookieHeaders = '';
    const homeResp = await fetch(baseURL, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html" }
    });
    const setCookies = homeResp.headers.get('set-cookie');
    if (setCookies) cookieHeaders = setCookies.split(',').map(c => c.split(';')[0]).join('; ');

    // Fetch homepage with cookies
    const response = await fetch(baseURL + '/', {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html",
        "Cookie": cookieHeaders
      }
    });
    if (!response.ok) return res.status(500).json({ error: `Fetch failed: ${response.status}` });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Helper function to scrape by section title
    function scrapeSection(titleMatch) {
      let sectionData = [];
      $('h3.section-title').each((_, el) => {
        const titleText = $(el).text().trim();
        if (titleText.includes(titleMatch)) {
          // Find nearest swiper-container after this h3
          const swiper = $(el).parent().parent().nextAll().find('.swiper-container').first();
          swiper.find('.swiper-slide').each((i, el2) => {
            const title = $(el2).find('.entry-title').text().trim();
            let link = $(el2).find('a.lnk-blk').attr('href') || '';
            let image = $(el2).find('img').attr('src') || $(el2).find('img').attr('data-src');
            if (image?.startsWith('//')) image = 'https:' + image;
            if (link.startsWith(baseURL)) link = link.replace(baseURL, '');
            if (title) sectionData.push({ title, link, image });
          });
        }
      });
      return sectionData;
    }

    // Existing sections
    let newestDrops = scrapeSection("Newest Drops");
    let mostWatchedShows = scrapeSection("Most-Watched Shows");
    let newAnimeArrivals = scrapeSection("New Anime Arrivals");
    let cartoonSeries = scrapeSection("Just In: Cartoon Series");

    // New sections requested
    let mostWatchedFilms = scrapeSection("Most-Watched Films");
    let latestAnimeMovies = scrapeSection("Latest Anime Movies");

    res.status(200).json({
      status: "ok",
      base: baseURL,
      newestDrops,
      mostWatchedShows,
      newAnimeArrivals,
      cartoonSeries,
      mostWatchedFilms,
      latestAnimeMovies
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

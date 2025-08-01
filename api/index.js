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

    // Helper function for swiper sections
    function scrapeSwiperSection(titleMatch) {
      let sectionData = [];
      $('h3.section-title').each((_, el) => {
        const titleText = $(el).text().trim();
        if (titleText.includes(titleMatch)) {
          const swiper = $(el).closest('header').nextAll('.swiper-container').first();
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

    // Helper function for Top Picks layout
    function scrapeTopPicks(widgetId) {
      let sectionData = [];
      $(`#${widgetId} .top-picks__item`).each((i, el) => {
        let link = $(el).find('a.item__card').attr('href') || '';
        let image = $(el).find('img').attr('src');
        if (image?.startsWith('//')) image = 'https:' + image;
        if (link.startsWith(baseURL)) link = link.replace(baseURL, '');
        const title = $(el).find('img').attr('alt').replace('Image ', '').trim();
        if (title) sectionData.push({ rank: i + 1, title, link, image });
      });
      return sectionData;
    }

    // Sections
    let newestDrops = scrapeSwiperSection("Newest Drops");
    let mostWatchedShows = scrapeTopPicks("torofilm_wdgt_popular-3");
    let mostWatchedFilms = scrapeTopPicks("torofilm_wdgt_popular-2"); // ✅ Fixed
    let newAnimeArrivals = scrapeSwiperSection("New Anime Arrivals");
    let cartoonSeries = scrapeSwiperSection("Just In: Cartoon Series");
    let latestAnimeMovies = scrapeSwiperSection("Latest Anime Movies");

    res.status(200).json({
      status: "ok",
      base: baseURL,
      newestDrops,
      mostWatchedShows,
      mostWatchedFilms,
      newAnimeArrivals,
      cartoonSeries,
      latestAnimeMovies
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Read base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Step 1: Get Cloudflare cookies
    let cookieHeaders = '';
    const homeResp = await fetch(baseURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html"
      }
    });
    const setCookies = homeResp.headers.get('set-cookie');
    if (setCookies) {
      cookieHeaders = setCookies.split(',').map(c => c.split(';')[0]).join('; ');
    }

    // Step 2: Fetch homepage with cookies
    const response = await fetch(baseURL + '/', {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html",
        "Cookie": cookieHeaders
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: `Fetch failed: ${response.status}` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // --- Newest Drops ---
    let newestDrops = [];
    $('.swiper-slide.latest-ep-swiper-slide').each((i, el) => {
      const title = $(el).find('.entry-title').text().trim();
      let link = $(el).find('a.lnk-blk').attr('href') || '';
      let image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      if (image?.startsWith('//')) image = 'https:' + image;
      if (link.startsWith(baseURL)) link = link.replace(baseURL, '');
      const season = $(el).find('.post-ql').text().trim();
      const episodes = $(el).find('.year').text().trim();
      if (title) newestDrops.push({ title, link, image, season, episodes });
    });

    // --- Most Watched Shows (with ranking) ---
    let mostWatched = [];
    $('#torofilm_wdgt_popular-3 .top-picks__item').each((i, el) => {
      let link = $(el).find('a.item__card').attr('href') || '';
      let image = $(el).find('img').attr('src');
      if (image?.startsWith('//')) image = 'https:' + image;
      if (link.startsWith(baseURL)) link = link.replace(baseURL, '');
      const title = $(el).find('img').attr('alt').replace('Image ', '').trim();
      if (title) mostWatched.push({ rank: i + 1, title, link, image });
    });

    // --- New Anime Arrivals ---
    let newAnimeArrivals = [];
    $('.swiper-slide.latest-movies-series-swiper-slide').each((i, el) => {
      const title = $(el).find('.entry-title').text().trim();
      let link = $(el).find('a.lnk-blk').attr('href') || '';
      let image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      if (image?.startsWith('//')) image = 'https:' + image;
      if (link.startsWith(baseURL)) link = link.replace(baseURL, '');
      if (title) newAnimeArrivals.push({ title, link, image });
    });

    // --- Just In: Cartoon Series (Fixed to detect section-title text)
    let cartoonSeries = [];
    $('h3.section-title').each((_, el) => {
      const sectionTitle = $(el).text().trim();
      if (sectionTitle.includes("Just In: Cartoon Series")) {
        // Find the nearest swiper-container after this header
        const swiper = $(el).parent().parent().nextAll('.swiper-container').first();
        swiper.find('.swiper-slide').each((i2, el2) => {
          const title = $(el2).find('.entry-title').text().trim();
          let link = $(el2).find('a.lnk-blk').attr('href') || '';
          let image = $(el2).find('img').attr('src') || $(el2).find('img').attr('data-src');
          if (image?.startsWith('//')) image = 'https:' + image;
          if (link.startsWith(baseURL)) link = link.replace(baseURL, '');
          if (title) cartoonSeries.push({ title, link, image });
        });
      }
    });

    res.status(200).json({
      status: "ok",
      base: baseURL,
      newestDrops,
      mostWatched,
      newAnimeArrivals,
      cartoonSeries
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

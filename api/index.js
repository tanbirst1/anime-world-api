import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const targetURL = "https://watchanimeworld.in/";
    const response = await fetch(targetURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: `Fetch failed: ${response.status}` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let newestDrops = [];
    $('.swiper-slide.latest-ep-swiper-slide').each((i, el) => {
      const title = $(el).find('.entry-title').text().trim();
      const link = $(el).find('a.lnk-blk').attr('href');
      let image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      if (image && image.startsWith('//')) image = 'https:' + image;
      const season = $(el).find('.post-ql').text().trim();
      const episodes = $(el).find('.year').text().trim();

      if (title) {
        newestDrops.push({ title, link, image, season, episodes });
      }
    });

    res.status(200).json({
      status: "ok",
      source: targetURL,
      newestDrops
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

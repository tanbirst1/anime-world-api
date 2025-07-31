import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const targetURL = "https://watchanimeworld.in/";
    const response = await fetch(targetURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VercelBot/1.0)"
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch AnimeWorld" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Slider / Spotlight
    let spotlight = [];
    $('.swiper-slide').each((i, el) => {
      const title = $(el).find('.slide-title').text().trim();
      const link = $(el).find('a').attr('href');
      const image = $(el).find('img').attr('src');
      if (title) spotlight.push({ title, link, image });
    });

    // Latest Episodes
    let latestEpisodes = [];
    $('.episodes-card').each((i, el) => {
      const title = $(el).find('.ep-title').text().trim();
      const link = $(el).find('a').attr('href');
      const image = $(el).find('img').attr('src');
      const episode = $(el).find('.ep-num').text().trim();
      if (title) latestEpisodes.push({ title, link, episode, image });
    });

    // Popular / Recommended
    let popular = [];
    $('.popular-card').each((i, el) => {
      const title = $(el).find('.pop-title').text().trim();
      const link = $(el).find('a').attr('href');
      const image = $(el).find('img').attr('src');
      if (title) popular.push({ title, link, image });
    });

    res.status(200).json({
      status: "ok",
      source: targetURL,
      spotlight,
      latestEpisodes,
      popular
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
                            }

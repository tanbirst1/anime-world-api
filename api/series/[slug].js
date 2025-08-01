import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const { slug } = req.query; 
    if (!slug) {
      return res.status(400).json({ error: "Missing series slug" });
    }

    // Base URL from file
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Ensure trailing slash
    const targetURL = `${baseURL}/series/${slug}/`;

    // Fetch with extra headers to bypass redirect
    const response = await fetch(targetURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": baseURL + "/",
        "Accept-Language": "en-US,en;q=0.9"
      },
      redirect: "manual"
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Detect if page is actually homepage
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Series not found or redirected to homepage" });
    }

    // Series details
    const title = $('h1.entry-title').text().trim();
    let poster = $('.poster img').attr('src') || $('.poster img').attr('data-src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;
    const description = $('.entry-content p').first().text().trim();

    // Episodes
    let episodes = [];
    $('.episodios .episodiotitle a').each((i, el) => {
      let epTitle = $(el).text().trim();
      let epLink = $(el).attr('href') || '';
      if (epLink.startsWith(baseURL)) epLink = './' + epLink.replace(baseURL, '').replace(/^\/+/, '');
      episodes.push({ title: epTitle, link: epLink });
    });

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      episodes
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

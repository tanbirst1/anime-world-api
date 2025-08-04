import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Missing movie slug" });
    }

    // Base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Target URL
    const targetURL = `${baseURL}/movies/${slug}/`;
    const resp = await fetch(targetURL, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html" }
    });

    if (!resp.ok) {
      return res.status(500).json({ error: `Failed to fetch: ${resp.status}` });
    }

    const html = await resp.text();
    const $ = cheerio.load(html);

    // Detect homepage redirect
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected to homepage" });
    }

    // Movie details
    const title = $('h1.entry-title').text().trim();
    let poster = $('.post img').first().attr('src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;
    const description = $('.description p').first().text().trim();
    const year = $('.year .overviewCss').text().trim();
    const duration = $('.duration .overviewCss').text().trim();

    // Genres
    let genres = [];
    $('.genres a').each((_, el) => genres.push($(el).text().trim()));

    // Languages
    let languages = [];
    $('.loadactor a').each((_, el) => languages.push($(el).text().trim()));

    // 🔥 Servers (Match name + iframe URL)
    let servers = [];
    $('.aa-tbs-video li a').each((_, el) => {
      const serverName = $(el).find('.server').text().trim();
      const href = $(el).attr('href'); // Example: #options-0
      if (href && href.startsWith('#')) {
        const optionID = href.substring(1); // remove #
        const iframe = $(`#${optionID} iframe`);
        let videoURL = iframe.attr('src') || iframe.attr('data-src') || '';
        if (videoURL?.startsWith('//')) videoURL = 'https:' + videoURL;
        servers.push({ server: serverName, url: videoURL });
      }
    });

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      year,
      duration,
      genres,
      languages,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

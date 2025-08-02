import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing movie slug" });

    // Read Base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Fetch movie page
    const targetURL = `${baseURL}/movies/${slug}/`;
    const resp = await fetch(targetURL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html"
      }
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    // Detect if redirected to homepage
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected" });
    }

    // Movie Data
    let title = $('h1.entry-title').text().trim();
    let poster = $('img[loading="lazy"]').first().attr('src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;
    let description = $('.description p').text().trim();
    let year = $('.year .overviewCss').text().trim();
    let duration = $('.duration .overviewCss').text().trim();
    let genres = [];
    $('.genres a').each((i, el) => genres.push($(el).text().trim()));
    let languages = [];
    $('.loadactor a').each((i, el) => languages.push($(el).text().trim()));

    // Streaming Links
    let streams = [];
    $('.aa-tbs-video li a').each((i, el) => {
      streams.push({
        server: $(el).find('.server').text().trim(),
        link: $(el).attr('href')
      });
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
      streams
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

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

    // Movie URL
    const targetURL = `${baseURL}/movies/${slug}/`;

    // Fetch movie HTML
    const resp = await fetch(targetURL, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html" }
    });

    if (!resp.ok) {
      return res.status(500).json({ error: `Failed to fetch: ${resp.status}` });
    }

    const html = await resp.text();
    const $ = cheerio.load(html);

    // Detect redirect/homepage
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected to homepage" });
    }

    // Movie info
    const title = $('h1.entry-title').text().trim();
    let poster = $('.post img').first().attr('src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;
    const description = $('.description p').first().text().trim();
    const year = $('.year .overviewCss').text().trim();
    const duration = $('.duration .overviewCss').text().trim();

    // Genres
    let genres = [];
    $('.genres a').each((_, el) => {
      genres.push($(el).text().trim());
    });

    // Languages
    let languages = [];
    $('.loadactor a').each((_, el) => {
      languages.push($(el).text().trim());
    });

    // Servers
    let servers = [];
    $('.aa-tbs-video li a').each((i, el) => {
      const serverName = $(el).find('.server').text().trim();
      const serverID = $(el).attr('href')?.replace('#', '');
      const iframeSrc = $(`${serverID} iframe`).attr('src') || $(`${serverID} iframe`).attr('data-src');
      servers.push({ server: serverName, iframe: iframeSrc });
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

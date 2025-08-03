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

    // Read base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Step 1: Get Cloudflare cookies
    let cookieHeaders = '';
    const homeResp = await fetch(baseURL, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html" }
    });
    const setCookies = homeResp.headers.get('set-cookie');
    if (setCookies) {
      cookieHeaders = setCookies.split(',').map(c => c.split(';')[0]).join('; ');
    }

    // Step 2: Fetch movie page
    const movieURL = `${baseURL}/movies/${slug}/`;
    const resp = await fetch(movieURL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html",
        "Cookie": cookieHeaders,
        "Referer": baseURL + "/"
      }
    });

    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Failed to fetch movie page (${resp.status})` });
    }

    const html = await resp.text();
    const $ = cheerio.load(html);

    // Detect homepage redirect (Cloudflare block)
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected to homepage" });
    }

    // Scrape movie details
    const title = $('h1.entry-title').text().trim();
    let poster = $('article.post.single img').attr('src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;

    const description = $('.description p').first().text().trim();

    const genres = [];
    $('.genres a').each((_, el) => genres.push($(el).text().trim()));

    const languages = [];
    $('.loadactor a').each((_, el) => languages.push($(el).text().trim()));

    const duration = $('.duration .overviewCss').text().trim();
    const year = $('.year .overviewCss').text().trim();

    // Scrape video servers
    let servers = [];
    $('.aa-tbs-video li a').each((i, el) => {
      const serverName = $(el).find('.server').text().trim() || `Server ${i+1}`;
      const href = $(el).attr('href');
      const frameId = href?.replace('#', '');
      const iframeSrc = $(`${frameId} iframe`).attr('src') || $(`${frameId} iframe`).attr('data-src');
      servers.push({ server: serverName, url: iframeSrc });
    });

    // Return JSON
    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      genres,
      languages,
      duration,
      year,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

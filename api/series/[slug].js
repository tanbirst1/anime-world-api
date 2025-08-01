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

    // Read base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Step 1: Fetch homepage to get Cloudflare cookies
    let cookieHeaders = '';
    const homeResp = await fetch(baseURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html",
      }
    });
    const setCookies = homeResp.headers.get('set-cookie');
    if (setCookies) {
      cookieHeaders = setCookies.split(',').map(c => c.split(';')[0]).join('; ');
    }

    // Step 2: Fetch series page with cookies + headers
    const targetURL = `${baseURL}/series/${slug}/`;
    const resp = await fetch(targetURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html",
        "Referer": baseURL + "/",
        "Cookie": cookieHeaders
      }
    });

    const html = await resp.text();
    const $ = cheerio.load(html);

    // Detect homepage redirect
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

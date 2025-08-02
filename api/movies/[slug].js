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

    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Step 1: Warm Cloudflare cookies
    let cookieHeaders = '';
    const homeResp = await fetch(baseURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html"
      }
    });

    if (!homeResp.ok) {
      return res.status(500).json({ error: `Home page fetch failed: ${homeResp.status}` });
    }

    const setCookies = homeResp.headers.get('set-cookie');
    if (setCookies) {
      cookieHeaders = setCookies.split(',').map(c => c.split(';')[0]).join('; ');
    }

    // Step 2: Fetch movie page with cookies
    const targetURL = `${baseURL}/movies/${slug}/`;
    const resp = await fetch(targetURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html",
        "Referer": baseURL + "/",
        "Cookie": cookieHeaders
      }
    });

    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Movie page fetch failed: ${resp.status}` });
    }

    const html = await resp.text();

    // Debug: Log a snippet of html to verify response (limit 1000 chars)
    console.log('HTML snippet:', html.slice(0, 1000));

    const $ = cheerio.load(html);

    // Detect homepage redirect by checking for expected content missing
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected to homepage" });
    }

    // Movie details
    const title = $('h1.entry-title').text().trim();
    let poster = $('.poster img').attr('src') || $('.poster img').attr('data-src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;
    const description = $('.entry-content p').first().text().trim();

    let links = [];
    $('.entry-content a').each((i, el) => {
      let linkText = $(el).text().trim();
      let linkHref = $(el).attr('href');
      if (linkHref?.startsWith(baseURL)) linkHref = './' + linkHref.replace(baseURL, '').replace(/^\/+/, '');
      if (linkHref) links.push({ name: linkText, url: linkHref });
    });

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      links
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
}        "Cookie": cookieHeaders
      }
    });

    const html = await resp.text();
    const $ = cheerio.load(html);

    // Detect homepage redirect
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected to homepage" });
    }

    // Movie details
    const title = $('h1.entry-title').text().trim();
    let poster = $('.poster img').attr('src') || $('.poster img').attr('data-src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;
    const description = $('.entry-content p').first().text().trim();

    // Download/Watch links
    let links = [];
    $('.entry-content a').each((i, el) => {
      let linkText = $(el).text().trim();
      let linkHref = $(el).attr('href');
      if (linkHref?.startsWith(baseURL)) linkHref = './' + linkHref.replace(baseURL, '').replace(/^\/+/, '');
      if (linkHref) links.push({ name: linkText, url: linkHref });
    });

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      links
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

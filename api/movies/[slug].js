import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Slug missing" });

    // Read base URL
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.readFileSync(basePath, 'utf8').trim();

    // Target Movie URL
    const targetURL = `${baseURL}/movies/${slug}/`;

    // Fetch HTML
    const response = await fetch(targetURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!response.ok) return res.status(500).json({ error: `Fetch failed: ${response.status}` });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Movie Title
    const title = $('h1.entry-title').text().trim();
    let coverImage = $('div.poster img').attr('src') || $('div.poster img').attr('data-src');
    if (coverImage?.startsWith('//')) coverImage = 'https:' + coverImage;

    // Movie Description
    const description = $('div.entry-content').text().trim();

    // Additional Info (Year, Genre, Runtime, etc.)
    let details = {};
    $('div.custom_fields div').each((i, el) => {
      const label = $(el).find('b').text().trim();
      const value = $(el).text().replace(label, '').trim();
      if (label) details[label.replace(':', '')] = value;
    });

    // Download / Watch Links
    let links = [];
    $('div.download a, div.watch a').each((i, el) => {
      const linkTitle = $(el).text().trim();
      const linkUrl = $(el).attr('href');
      links.push({ title: linkTitle, url: linkUrl });
    });

    // Response JSON
    res.status(200).json({
      status: "ok",
      slug,
      title,
      coverImage,
      description,
      details,
      links
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

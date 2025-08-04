// api/movies/[slug].js
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const BASE_URL = "https://watchanimeworld.in";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    // Fetch page
    const targetURL = `${BASE_URL}/movies/${slug}/`;
    const response = await fetch(targetURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch movie: ${response.statusText}` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Detect redirect to home
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Extract data
    const title = $('h1.entry-title').text().trim();
    let poster = $('.post img').first().attr('src') || '';
    if (poster.startsWith('//')) poster = 'https:' + poster;
    const description = $('.description p').text().trim();

    // Servers
    let servers = [];
    $('.aa-tbs-video li').each((i, el) => {
      const serverName = $(el).find('.server').text().trim();
      const optionId = $(el).find('a').attr('href')?.replace('#', '');
      const iframeSrc = $(`#${optionId} iframe`).attr('src') || $(`#${optionId} iframe`).attr('data-src') || '';
      servers.push({ server: serverName, url: iframeSrc });
    });

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: "Serverless function crashed", details: err.message });
  }
}

// api/movies/[slug].js
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const BASE_URL = "https://watchanimeworld.in";

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    if (!slug) {
      return res.status(400).json({ error: "Missing movie slug" });
    }

    const movieURL = `${BASE_URL}/movies/${slug}/`;
    const response = await fetch(movieURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch movie page (${response.status})` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Check if redirected to homepage
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Extract title, poster, description
    const title = $('h1.entry-title').text().trim();
    let poster = $('article.post img').first().attr('src') || '';
    if (poster.startsWith('//')) poster = 'https:' + poster;
    const description = $('.description p').text().trim();

    // Extract server list
    let servers = [];
    $('.aa-tbs-video li').each((_, el) => {
      const serverName = $(el).find('.server').text().trim();
      const href = $(el).find('a').attr('href')?.replace('#', '');
      const iframe = $(`#${href} iframe`);
      const videoURL = iframe.attr('src') || iframe.attr('data-src') || '';

      if (serverName && videoURL) {
        servers.push({
          name: serverName,
          url: videoURL
        });
      }
    });

    return res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      servers
    });

  } catch (error) {
    return res.status(500).json({ error: "Serverless crash prevented", details: error.message });
  }
}

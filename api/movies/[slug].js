// api/movies/[slug].js
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Missing movie slug" });
    }

    const baseURL = "https://watchanimeworld.in";
    const movieURL = `${baseURL}/movies/${slug}/`;

    // Step 1: Fetch page safely
    const response = await fetch(movieURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html",
        "Referer": baseURL + "/"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch movie page (${response.status})` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Step 2: Detect homepage redirect
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected" });
    }

    // Step 3: Movie Details
    const title = $('h1.entry-title').text().trim() || slug;
    let poster = $('article.post.single img').first().attr('src') || "";
    if (poster.startsWith("//")) poster = "https:" + poster;

    const description = $('.description p').first().text().trim();

    // Step 4: Server Links
    let servers = [];
    $('.aa-tbs-video li').each((_, li) => {
      const serverName = $(li).find('.server').text().trim();
      const hrefId = $(li).find('a').attr('href')?.replace('#', '');
      if (hrefId) {
        const iframe = $(`#${hrefId} iframe`);
        let videoURL = iframe.attr('src') || iframe.attr('data-src') || "";
        if (videoURL.startsWith("//")) videoURL = "https:" + videoURL;
        if (serverName && videoURL) {
          servers.push({ server: serverName, url: videoURL });
        }
      }
    });

    // Step 5: Send JSON
    return res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      servers
    });

  } catch (err) {
    return res.status(500).json({ error: "Server crashed", details: err.message });
  }
}    if (poster.startsWith('//')) poster = 'https:' + poster;
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

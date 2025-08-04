// api/movies/[slug].js
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

const secretKey = process.env.SECRET_KEY || 'supersecretkey123';
let videoStore = {}; // In-memory mapping { hash: realURL }

function encryptURL(url) {
  const hash = crypto.createHash('md5').update(url + secretKey).digest('hex').slice(0, 8);
  videoStore[hash] = url;
  return `/api/video?token=${hash}`;
}

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing movie slug" });

    const baseURL = "https://watchanimeworld.in";
    const movieURL = `${baseURL}/movies/${slug}/`;

    const response = await fetch(movieURL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return res.status(response.status).json({ error: `Fetch failed (${response.status})` });

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h1.entry-title').text().trim() || slug;
    let poster = $('article.post.single img').first().attr('src') || "";
    if (poster.startsWith("//")) poster = "https:" + poster;
    const description = $('.description p').first().text().trim();

    let servers = [];
    $('.aa-tbs-video li').each((_, li) => {
      const serverName = $(li).find('.server').text().trim();
      const hrefId = $(li).find('a').attr('href')?.replace('#', '');
      if (hrefId) {
        const iframe = $(`#${hrefId} iframe`);
        let videoURL = iframe.attr('src') || iframe.attr('data-src') || "";
        if (videoURL.startsWith("//")) videoURL = "https:" + videoURL;
        if (serverName && videoURL) {
          servers.push({ server: serverName, url: encryptURL(videoURL) });
        }
      }
    });

    return res.status(200).json({ status: "ok", slug, title, poster, description, servers });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export function getVideoFromHash(hash) {
  return videoStore[hash];
}

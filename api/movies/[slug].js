import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ error: "Missing movie slug" });
    }

    const baseURL = "https://watchanimeworld.in";
    const targetURL = `${baseURL}/movies/${slug}/`;

    // 1️⃣ Test fetch
    let html;
    try {
      const response = await fetch(targetURL, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch movie page" });
      }
      html = await response.text();
    } catch (fetchErr) {
      console.error("Fetch error:", fetchErr);
      return res.status(500).json({ error: "Fetch failed", details: fetchErr.message });
    }

    // 2️⃣ Parse HTML
    let data = {};
    try {
      const $ = cheerio.load(html);

      data.title = $('h1.entry-title').text().trim() || "Title not found";
      let poster = $('img[loading="lazy"]').attr('src');
      if (poster?.startsWith('//')) poster = 'https:' + poster;
      data.poster = poster || null;

      data.description = $('.description p').text().trim() || "No description";

      data.genres = [];
      $('.genres a').each((i, el) => {
        data.genres.push($(el).text().trim());
      });

      data.languages = [];
      $('.loadactor a').each((i, el) => {
        data.languages.push($(el).text().trim());
      });

      data.year = $('.fa-calendar .overviewCss').text().trim() || null;

    } catch (parseErr) {
      console.error("Parse error:", parseErr);
      return res.status(500).json({ error: "Parse failed", details: parseErr.message });
    }

    // ✅ Respond safely
    return res.status(200).json({ status: "ok", slug, ...data });

  } catch (err) {
    console.error("General error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}

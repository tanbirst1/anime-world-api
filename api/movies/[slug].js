import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ error: "Slug missing" });
    }

    // ✅ Read base URL from file
    const baseUrlPath = path.join(process.cwd(), "src", "base_url.txt");
    const baseUrl = fs.existsSync(baseUrlPath)
      ? fs.readFileSync(baseUrlPath, "utf8").trim()
      : "https://watchanimeworld.in";

    // ✅ Full Movie URL
    const movieUrl = `${baseUrl}/movies/${slug}/`;

    // 🔍 Fetch movie page
    const { data: html } = await axios.get(movieUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const $ = cheerio.load(html);

    // 🎯 Extract Movie Title
    const title = $("h1.entry-title").text().trim() || slug;

    // 🎯 Extract Movie Poster
    const poster =
      $("div.post-thumbnail img").attr("src") ||
      $("meta[property='og:image']").attr("content");

    // 🎯 Extract Description
    const description =
      $("div.entry-content p").first().text().trim() ||
      $("meta[property='og:description']").attr("content");

    // 🎯 Extract Episodes / Download Links
    const episodes = [];
    $("div.entry-content a").each((_, el) => {
      const link = $(el).attr("href");
      const text = $(el).text().trim();
      if (link && text) {
        episodes.push({ name: text, url: link });
      }
    });

    // 🎯 Extract Tags / Genres
    const genres = [];
    $("span.cat-links a").each((_, el) => {
      genres.push($(el).text().trim());
    });

    // ✅ Final JSON
    return res.status(200).json({
      title,
      poster,
      description,
      genres,
      episodes,
      movieUrl
    });
  } catch (err) {
    console.error("Error scraping movie:", err.message);
    return res.status(500).json({ error: "Failed to fetch movie data" });
  }
}

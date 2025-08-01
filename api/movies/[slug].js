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

    // ✅ Base URL from file or fallback
    const baseUrlPath = path.join(process.cwd(), "src", "base_url.txt");
    const baseUrl = fs.existsSync(baseUrlPath)
      ? fs.readFileSync(baseUrlPath, "utf8").trim()
      : "https://watchanimeworld.in";

    const movieUrl = `${baseUrl}/movies/${slug}/`;

    // 🔍 Fetch HTML
    const { data: html } = await axios.get(movieUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(html);

    // 🎯 Extract movie details
    const title =
      $("h1.entry-title").text().trim() ||
      $("meta[property='og:title']").attr("content") ||
      slug;

    const poster =
      $("div.post-thumbnail img").attr("src") ||
      $("meta[property='og:image']").attr("content");

    const description =
      $("div.entry-content p").first().text().trim() ||
      $("meta[property='og:description']").attr("content");

    const genres = [];
    $("span.cat-links a").each((_, el) => genres.push($(el).text().trim()));

    const links = [];
    $("a").each((_, el) => {
      const link = $(el).attr("href");
      const text = $(el).text().trim();
      if (link && text && /download|watch|episode/i.test(text)) {
        links.push({ name: text, url: link });
      }
    });

    return res.status(200).json({
      title,
      poster,
      description,
      genres,
      links,
      source: movieUrl
    });
  } catch (err) {
    return res.status(500).json({ error: "Scraper failed", detail: err.message });
  }
}
    const poster =
      $("div.post-thumbnail img").attr("src") ||
      $("meta[property='og:image']").attr("content");

    const description =
      $("div.entry-content p").first().text().trim() ||
      $("meta[property='og:description']").attr("content");

    // 🎯 Episodes / Download Links
    const episodes = [];
    $("a").each((_, el) => {
      const link = $(el).attr("href");
      const text = $(el).text().trim();
      if (link && text && /download|watch|episode/i.test(text)) {
        episodes.push({ name: text, url: link });
      }
    });

    // 🎯 Genres
    const genres = [];
    $("span.cat-links a").each((_, el) => {
      genres.push($(el).text().trim());
    });

    // ✅ Respond even if some fields are missing
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
    return res.status(500).json({
      error: "Failed to fetch movie data",
      detail: err.message
    });
  }
}

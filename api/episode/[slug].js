import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Simple in-memory cache
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Slug missing" });
    }

    // Check cache first
    if (cache[slug] && (Date.now() - cache[slug].timestamp < CACHE_TTL)) {
      return res.status(200).json({ ...cache[slug].data, cached: true });
    }

    const baseURL = "https://watchanimeworld.in";    
    const pageURL = `${baseURL}/episode/${slug}/`;

    const response = await fetch(pageURL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000
    });

    if (!response.ok) {
      // Return cached data if exists on 500s
      if (cache[slug]) {
        return res.status(200).json({ ...cache[slug].data, cached: true });
      }
      return res.status(500).json({ error: "Failed to fetch episode page" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Basic episode info
    const title =
      $(".video-player div").first().text().trim() ||
      $("h1.entry-title").text().trim() ||
      $("title").text().trim() ||
      "Unknown";

    const poster =
      $("img").first().attr("src") ||
      $("meta[property='og:image']").attr("content") ||
      "";

    const description =
      $(".description p").first().text().trim() ||
      $("meta[property='og:description']").attr("content") ||
      "";

    // Video servers only (direct URLs)
    const servers = [];
    $(".video-player iframe").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (src.trim()) {
        servers.push({
          server: `Server ${i + 1}`,
          url: src
        });
      }
    });

    if (servers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No video servers found",
        title,
        poster,
        description
      });
    }

    const data = { status: "ok", title, poster, description, servers };

    // Save to cache after successful fetch
    cache[slug] = {
      data,
      timestamp: Date.now()
    };

    res.status(200).json({ ...data, cached: false });

  } catch (err) {
    // On error, return cached data if exists
    const { slug } = req.query;
    if (slug && cache[slug]) {
      return res.status(200).json({ ...cache[slug].data, cached: true });
    }
    res.status(500).json({
      error: "Scraping failed",
      details: err.message
    });
  }
}

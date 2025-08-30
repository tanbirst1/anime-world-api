import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Slug missing" });
    }

    const baseURL = "https://watchanimeworld.in";
    const pageURL = `${baseURL}/episode/${slug}/`;

    const response = await fetch(pageURL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch episode page" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Basic episode info
    let title =
      $(".video-player div").first().text().trim() ||
      $("h1.entry-title").text().trim() ||
      $("title").text().trim() ||
      "Unknown";

    let poster =
      $("img").first().attr("src") ||
      $("meta[property='og:image']").attr("content") ||
      "";

    let description =
      $(".description p").first().text().trim() ||
      $("meta[property='og:description']").attr("content") ||
      "";

    // Video servers only (direct URLs, no encryption)
    let servers = [];
    $(".video-player iframe").each((i, el) => {
      let src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (src.trim()) {
        servers.push({
          server: `Server ${i + 1}`,
          url: src   // direct iframe src
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

    res.status(200).json({
      status: "ok",
      title,
      poster,
      description,
      servers
    });

  } catch (err) {
    res.status(500).json({
      error: "Scraping failed",
      details: err.message
    });
  }
}

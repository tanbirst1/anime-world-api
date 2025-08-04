import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    // Extract search name
    const name = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
    if (!name) return res.status(400).json({ error: "Missing search term" });

    // Build search URL
    const baseURL = "https://watchanimeworld.in";
    const searchQuery = encodeURIComponent(name);
    const searchURL = `${baseURL}/?s=${searchQuery}`;

    // Fetch HTML
    const resp = await fetch(searchURL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) return res.status(500).json({ error: "Failed to fetch search results" });

    const html = await resp.text();
    const $ = cheerio.load(html);

    let results = [];
    $(".items.full .item").each((_, el) => {
      const title = $(el).find(".name").text().trim();
      let link = $(el).find("a").attr("href") || "";
      if (link.startsWith(baseURL)) link = link.replace(baseURL, "");
      let poster = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
      if (poster.startsWith("//")) poster = "https:" + poster;
      const type = $(el).find(".type").text().trim();
      const year = $(el).find(".year").text().trim();

      if (title) {
        results.push({ title, link, poster, type, year });
      }
    });

    // Return JSON
    return res.status(200).json({
      query: name,
      count: results.length,
      results
    });

  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

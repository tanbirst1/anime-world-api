import fetch from "node-fetch";
import * as cheerio from "cheerio";
import crypto from "crypto";

const SECRET_KEY = crypto.createHash("sha256")
  .update(process.env.VIDEO_SECRET || "super_secret_key")
  .digest();
const IV = Buffer.alloc(16, 0);

function encrypt(url) {
  const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, IV);
  let encrypted = cipher.update(url, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Slug missing" });

    const baseURL = "https://watchanimeworld.in";
    const pageURL = `${baseURL}/movies/${slug}/`;

    const response = await fetch(pageURL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return res.status(500).json({ error: "Failed to fetch movie page" });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Title & Poster
    const title = $("h1.entry-title").text().trim() || "Unknown";
    const poster = $(".post img").first().attr("src") || "";
    const description = $(".description p").first().text().trim() || "";

    // Genres
    const genres = [];
    $(".genres a").each((i, el) => genres.push($(el).text().trim()));

    // Languages
    const languages = [];
    $(".loadactor a").each((i, el) => languages.push($(el).text().trim()));

    // Duration
    const duration = $(".duration .overviewCss").text().trim() || "";

    // Year
    const year = $(".year .overviewCss").text().trim() || "";

    // Network (like Crunchyroll)
    const network = $(".network .overviewCss a img").attr("alt") || "";

    // Servers
    let servers = [];
    $(".video-player iframe").each((i, el) => {
      let src = $(el).attr("src") || $(el).attr("data-src");
      let serverName = $(`.aa-tbs-video li:eq(${i}) .server`).text().trim() || `Server ${i + 1}`;
      if (src) {
        servers.push({
          server: serverName,
          url: `/v/${encrypt(src)}`
        });
      }
    });

    res.status(200).json({
      status: "ok",
      title,
      poster,
      description,
      genres,
      languages,
      duration,
      year,
      network,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}

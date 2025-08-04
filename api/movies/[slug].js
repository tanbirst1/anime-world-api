import fetch from "node-fetch";
import * as cheerio from "cheerio";
import crypto from "crypto";

const SECRET    = "super_secret_key"; // change to your own
const SECRET_KEY = crypto.createHash("sha256").update(SECRET).digest();
const IV         = Buffer.alloc(16, 0);

function encryptShort(text) {
  try {
    const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, IV);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  try {
    const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const resp = await fetch(`${baseURL}/movies/${slug}/`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!resp.ok) return res.status(404).json({ error: "Movie not found" });

    const html = await resp.text();
    const $    = cheerio.load(html);

    // Title
    const title = $("h1.entry-title").text().trim() || slug;

    // Poster
    let poster = $(".poster img").attr("src") || "";
    if (poster.startsWith("//")) poster = "https:" + poster;

    // Year
    const year = $(".year .overviewCss").first().text().trim() || "";

    // Description
    const description = $(".description p").text().trim() || "";

    // Genres
    const genres = [];
    $(".genres a").each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    // Servers
    const servers = [];
    $(".video-player iframe").each((i, el) => {
      let link = $(el).attr("src") || $(el).attr("data-src") || "";
      if (!link) return;
      const token = encryptShort(link);
      if (!token) return;
      const proto = req.headers["x-forwarded-proto"] || "https";
      const host  = req.headers.host;
      servers.push({
        server:   `Server ${i + 1}`,
        play_url: `${proto}://${host}/v/${token}`
      });
    });

    return res.status(200).json({
      slug,
      title,
      poster,
      year,
      description,
      genres,
      servers
    });
  } catch (err) {
    console.error("MOVIE SLUG ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// api/movies/[slug].js  
export const config = { runtime: "nodejs18.x" };

import fetch from "node-fetch";
import * as cheerio from "cheerio";
import crypto from "crypto";

const SECRET = "super_secret_key";  
const KEY = crypto.createHash("sha256").update(SECRET).digest();  
const IV = Buffer.alloc(16, 0);

function encryptSafe(text) {
  try {
    const cipher = crypto.createCipheriv("aes-256-cbc", KEY, IV);
    let enc = cipher.update(text, "utf8", "base64");
    enc += cipher.final("base64");
    return enc.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim() || "Untitled";
    const posterSrc = $(".poster img").attr("src") || "";
    const poster = posterSrc.startsWith("//") ? "https:" + posterSrc : posterSrc;
    const description = $(".description p").text().trim() || "";
    const year = $(".year .overviewCss").first().text().trim() || "";
    const genres = [];
    $(".genres a").each((i, el) => genres.push($(el).text().trim()));

    const servers = [];
    $(".video-player iframe").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (!src) return;
      const token = encryptSafe(src);
      if (!token) return;
      const proto = req.headers["x-forwarded-proto"] || "https";
      const host  = req.headers.host;
      servers.push({
        name: `Server ${i+1}`,
        play_url: `${proto}://${host}/v/${token}`
      });
    });

    res.status(200).json({ slug, title, poster, year, description, genres, servers });
  } catch (err) {
    console.error("SLUG ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
}

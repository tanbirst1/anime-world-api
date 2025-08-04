// api/movies/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import crypto from "crypto";

const SECRET_KEY = crypto.createHash("sha256").update(process.env.VIDEO_SECRET || "super_secret_key").digest();
const IV = Buffer.alloc(16, 0);

function encrypt(text) {
  const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, IV);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

// In-memory store for short IDs
global.shortLinks = global.shortLinks || {};

function generateShortId() {
  return Math.random().toString(36).substring(2, 8);
}

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const pageURL = `${baseURL}/movies/${slug}/`;

    const resp = await fetch(pageURL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) throw new Error(`Failed to fetch movie: ${resp.status}`);

    const html = await resp.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim() || "Unknown Title";
    const poster = $(".post img").first().attr("src") ?? "";
    const description = $(".description p").first().text().trim() ?? "";

    let servers = [];
    $(".video-player iframe").each((i, el) => {
      let src = $(el).attr("src") || $(el).attr("data-src");
      if (src) {
        const token = encrypt(src);
        const id = generateShortId();
        global.shortLinks[id] = token;
        servers.push({
          server: `Server ${i + 1}`,
          url: `/v/${id}`
        });
      }
    });

    res.status(200).json({
      status: "ok",
      title,
      poster,
      description,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}      if (src) {
        servers.push({
          server: `Server ${i + 1}`,
          url: `/api/video?token=${encrypt(src)}`
        });
      }
    });

    res.status(200).json({
      status: "ok",
      title,
      poster,
      description,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

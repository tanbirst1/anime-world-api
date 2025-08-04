import fetch from "node-fetch";
import * as cheerio from "cheerio";
import crypto from "crypto";

const SECRET = "super_secret_key";
const SECRET_KEY = crypto.createHash("sha256").update(SECRET).digest();
const IV = Buffer.alloc(16, 0);

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
    const slug = req.query.slug;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const url = `${baseURL}/movies/${slug}/`;

    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) return res.status(404).json({ error: "Movie not found" });

    const html = await resp.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim() || "No Title";
    const description = $(".description p").text().trim() || "No Description";
    const year = $(".year .overviewCss").first().text().trim() || "Unknown";
    const genres = [];
    $(".genres a").each((_, el) => genres.push($(el).text().trim()));

    let poster = $(".poster img").attr("src") || $(".entry-header img").attr("src") || "";
    if (poster.startsWith("//")) poster = "https:" + poster;

    const servers = [];
    $(".video-player iframe").each((i, el) => {
      let link = $(el).attr("src") || $(el).attr("data-src");
      if (link) {
        const token = encryptShort(link);
        servers.push({
          name: `Server ${i + 1}`,
          url: `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/v/${token}`
        });
      }
    });

    res.json({ slug, title, poster, year, description, genres, servers });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server Error" });
  }
}
    const servers = [];
    $(".video-player iframe").each((i, el) => {
      let link = $(el).attr("src") || $(el).attr("data-src");
      if (link) {
        const token = encryptShort(link);
        servers.push({
          name: `Server ${i + 1}`,
          url: `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/v/${token}`
        });
      }
    });

    res.json({ slug, title, poster, year, description, genres, servers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}        servers.push({
          server: `Server ${i + 1}`,
          play_url: `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/v/${token}`
        });
      }
    });

    res.json({ slug, title, poster, servers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

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

    const title = $("h1.entry-title").text().trim() || "Unknown";
    const poster = $(".post img").first().attr("src") || "";
    const description = $(".description p").first().text().trim() || "";

    // Extra details (safe extraction to avoid crash)
    const genre = [];
    $(".movie-details .genres a").each((i, el) => {
      genre.push($(el).text().trim());
    });

    const year = $(".movie-details .year").text().trim() || 
                 $("time[itemprop='datePublished']").text().trim() || "";

    const rating = $(".movie-details .rating").text().trim() || "";
    const releaseDate = $(".movie-details .release-date").text().trim() || "";

    let servers = [];
    $(".video-player iframe").each((i, el) => {
      let src = $(el).attr("src") || $(el).attr("data-src");
      if (src) servers.push({ server: `Server ${i + 1}`, url: `/v/${encrypt(src)}` });
    });

    res.status(200).json({
      status: "ok",
      title,
      poster,
      description,
      genre,
      year,
      rating,
      releaseDate,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}      let src = $(el).attr("src") || $(el).attr("data-src");
      if (src) servers.push({ server: `Server ${i + 1}`, url: `/v/${encrypt(src)}` });
    });

    res.status(200).json({ status: "ok", title, poster, description, servers });

  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}

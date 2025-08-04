// Remove node-fetch import!
import cheerio from "cheerio";
import crypto from "crypto";

const SECRET = process.env.MOVIE_SECRET || "super_secret_key";
const SECRET_KEY = crypto.createHash("sha256").update(SECRET).digest();
const IV = Buffer.alloc(16, 0);

function encryptShort(text) {
  try {
    const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, IV);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (err) {
    console.error("ENCRYPT ERROR:", err);
    return "";
  }
}

export default async function handler(req, res) {
  try {
    let slugParam = req.query.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const url = `${baseURL}/movies/${slug}/`;

    console.log("Fetching URL:", url);

    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) {
      console.error("Failed to fetch movie page:", resp.status);
      return res.status(404).json({ error: "Movie not found" });
    }

    const html = await resp.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim() || "Untitled";
    let poster = $(".poster img").attr("src") || "";
    if (poster.startsWith("//")) poster = "https:" + poster;

    let servers = [];
    $(".video-player iframe").each((i, el) => {
      let link = $(el).attr("src") || $(el).attr("data-src");
      if (link) {
        const token = encryptShort(link);
        let proto = req.headers["x-forwarded-proto"] || "https";
        let host = req.headers.host || "localhost";
        servers.push({
          server: `Server ${i + 1}`,
          play_url: `${proto}://${host}/v/${token}`
        });
      }
    });

    res.status(200).json({
      slug,
      title,
      poster,
      servers
    });

  } catch (err) {
    console.error("SLUG ERROR:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
}

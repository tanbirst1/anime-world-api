// api/movies/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { encryptURL } from "../video.js"; // Import encrypt function

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

    let servers = [];
    $(".video-player iframe").each((i, el) => {
      let src = $(el).attr("src") || $(el).attr("data-src");
      if (src) servers.push({ server: `Server ${i + 1}`, url: `/v/${encryptURL(src)}` });
    });

    res.status(200).json({ status: "ok", title, poster, description, servers });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}      if (src) servers.push({ server: `Server ${i + 1}`, url: `/v/${encrypt(src)}` });
    });

    res.status(200).json({ status: "ok", title, poster, description, servers });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

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
    const pageURL = `${baseURL}/episode/${slug}/`;

    const response = await fetch(pageURL, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return res.status(500).json({ error: "Failed to fetch episode page" });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Episode main details
    const episodeTitle = $(".video-player div").first().text().trim() || "Unknown Episode";
    const currentEpisode = $(".num-epi").first().text().trim() || "";
    
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

    // Episode list (other episodes in season)
    let episodes = [];
    $("#episode_by_temp li").each((i, el) => {
      let epNum = $(el).find(".num-epi").text().trim();
      let epName = $(el).find(".entry-title").text().trim();
      let epThumb = $(el).find("img").attr("src") || "";
      let epUrl = $(el).find("a.lnk-blk").attr("href") || "";
      episodes.push({ episode: epNum, title: epName, thumbnail: epThumb, url: epUrl });
    });

    res.status(200).json({
      status: "ok",
      episodeTitle,
      currentEpisode,
      servers,
      episodes
    });

  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
}

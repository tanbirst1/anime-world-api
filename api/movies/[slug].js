// api/movies/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import crypto from "crypto";

const SECRET_KEY = process.env.VIDEO_SECRET || "my_super_secret_key_123456"; // Must be 32 bytes
const IV = Buffer.alloc(16, 0); // Static IV (demo)

function encrypt(text) {
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(SECRET_KEY.padEnd(32)), IV);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encodeURIComponent(encrypted);
}

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const url = `${baseURL}/movies/${slug}/`;

    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) return res.status(500).json({ error: "Failed to fetch movie page" });

    const html = await resp.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim();
    const poster = $(".post img").first().attr("src");
    const description = $(".description p").text().trim();

    let servers = [];
    $(".video-player iframe").each((i, el) => {
      let src = $(el).attr("src") || $(el).attr("data-src");
      if (src) {
        servers.push({
          server: `Server ${i + 1}`,
          url: `/api/video?token=${encrypt(src)}`
        });
      }
    });

    res.status(200).json({ status: "ok", title, poster, description, servers });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}      const hrefId = $(li).find('a').attr('href')?.replace('#', '');
      if (hrefId) {
        const iframe = $(`#${hrefId} iframe`);
        let videoURL = iframe.attr('src') || iframe.attr('data-src') || "";
        if (videoURL.startsWith("//")) videoURL = "https:" + videoURL;
        if (serverName && videoURL) {
          servers.push({ server: serverName, url: encryptURL(videoURL) });
        }
      }
    });

    return res.status(200).json({ status: "ok", slug, title, poster, description, servers });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export function getVideoFromHash(hash) {
  return videoStore[hash];
}

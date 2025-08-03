import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ success: false, error: "Missing slug parameter" });
  }

  const targetUrl = `https://watchanimeworld.in/series/${slug}`;

  try {
    const { data: html } = await axios.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114 Safari/537.36"
      }
    });

    const $ = cheerio.load(html);
    const title = $("h1.entry-title").text().trim();
    const description = $(".entry-content p").first().text().trim();

    res.status(200).json({
      success: true,
      slug,
      title,
      description
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

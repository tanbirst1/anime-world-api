import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { slug } = req.query;
  const targetUrl = `https://watchanimeworld.in/movies/${slug}`;

  try {
    // Fetch HTML
    const { data: html } = await axios.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114 Safari/537.36"
      }
    });

    // Parse HTML
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim();
    const description = $(".entry-content p").first().text().trim();
    const image = $(".entry-content img").first().attr("src");

    // Collect genres if available
    const genres = [];
    $(".genres a").each((i, el) => {
      genres.push($(el).text().trim());
    });

    // Collect download or streaming links
    const links = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("http") && !href.includes("watchanimeworld.in")) {
        links.push(href);
      }
    });

    res.status(200).json({
      success: true,
      source: targetUrl,
      title,
      description,
      image,
      genres,
      links
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      url: targetUrl
    });
  }
}

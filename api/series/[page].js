import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { page } = req.query;
    if (!page) {
      return res.status(400).json({ error: "Missing page number" });
    }

    const baseURL = "https://watchanimeworld.in";
    const targetURL = `${baseURL}/series/page/${page}/`;

    // Fetch HTML
    const response = await fetch(targetURL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html"
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: `Failed to fetch: ${response.status}` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let seriesList = [];

    $(".post").each((i, el) => {
      const title = $(el).find(".entry-title").text().trim();
      let link = $(el).find("a").attr("href");
      let image = $(el).find("img").attr("src") || $(el).find("img").attr("data-src");

      if (link?.startsWith("//")) link = "https:" + link;
      if (image?.startsWith("//")) image = "https:" + image;

      if (title) {
        seriesList.push({
          title,
          link,
          image
        });
      }
    });

    res.status(200).json({
      status: "ok",
      page,
      total: seriesList.length,
      series: seriesList
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
                          }

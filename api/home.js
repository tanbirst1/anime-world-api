import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const url = "https://watchanimeworld.in/";
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      timeout: 5000 // prevent Vercel timeout
    });

    const $ = cheerio.load(data);
    let homeData = [];

    $(".item a").each((i, el) => {
      const title = $(el).attr("title");
      const link = $(el).attr("href");
      const img = $(el).find("img").attr("src");
      if (title && link) {
        homeData.push({
          title,
          link: link.startsWith("http") ? link : `https://watchanimeworld.in${link}`,
          image: img
        });
      }
    });

    res.status(200).json(homeData);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch homepage",
      details: err.message
    });
  }
}

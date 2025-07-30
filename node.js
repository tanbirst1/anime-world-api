import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    const url = `https://watchanimeworld.in/series/${slug}/`;
    
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const animeName = $("h1").first().text().trim();
    let seasons = {};

    $(".season-list a").each((i, el) => {
      const seasonText = $(el).text().trim();
      const seasonNum = seasonText.match(/\d+/)?.[0] || (i+1);
      seasons[seasonNum] = [];
    });

    // Collect episodes from all seasons (default visible season too)
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("/episode/")) {
        const epMatch = href.match(/(\d+)x(\d+)/);
        if (epMatch) {
          const seasonNum = epMatch[1];
          const episodeNum = epMatch[2];
          if (!seasons[seasonNum]) seasons[seasonNum] = [];
          seasons[seasonNum].push({
            episode_number: episodeNum,
            url: href.startsWith("http") ? href : `https://watchanimeworld.in${href}`
          });
        }
      }
    });

    res.status(200).json({
      anime: animeName,
      seasons
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch series" });
  }
}

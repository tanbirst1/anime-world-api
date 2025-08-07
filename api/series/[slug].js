// api/series/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { slug } = req.query;

  // Only fetch season 1
  const baseUrl = `https://watchanimeworld.in/episode/${slug}-1x1/`;

  try {
    const response = await fetch(baseUrl, {
      headers: {
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      console.error("❌ Failed to fetch page:", response.status);
      throw new Error("Invalid response");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const seriesTitle = $('h1.entry-title').text().trim() || slug.replace(/-/g, " ");

    const episodes = [];
    const firstSeasonSection = $(".se-c").first();

    if (firstSeasonSection.length === 0) {
      console.warn("⚠️ No season section found.");
    }

    firstSeasonSection.find(".episodios li").each((_, el) => {
      const epLink = $(el).find("a").attr("href");
      const epTitle = $(el).find(".episodiotitle").text().trim();

      if (epLink && epTitle) {
        const epSlug = epLink.split("/episode/")[1]?.replaceAll("/", "") || null;
        episodes.push({ title: epTitle, slug: epSlug });
      }
    });

    return res.status(200).json({
      title: seriesTitle,
      totalSeasons: 1,
      currentSeason: 1,
      episodes
    });

  } catch (err) {
    console.error("🔥 Error in /api/series/[slug]:", err.message);
    return res.status(200).json({
      title: slug.replace(/-/g, " "),
      totalSeasons: 1,
      currentSeason: 1,
      episodes: [],
      error: "Episodes could not be loaded at this time."
    });
  }
}    console.error("Failed to fetch episodes:", err.message);
    return res.status(200).json({
      title: slug.replace(/-/g, ' '),
      totalSeasons: 1,
      currentSeason: 1,
      episodes: [],
      error: "Episodes could not be loaded. Please try again later."
    });
  }
};    console.error("Failed to fetch episodes:", err.message);
    return res.status(200).json({
      title: slug.replace(/-/g, ' '),
      totalSeasons: 1,
      currentSeason: 1,
      episodes: [],
      error: "Episodes could not be loaded. Please try again later."
    });
  }
};

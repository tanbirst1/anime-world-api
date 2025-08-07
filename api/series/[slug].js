// api/series/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async (req, res) => {
  const { slug } = req.query;
  const seasonNumber = 1;

  const episodeUrl = `https://watchanimeworld.in/episode/${slug}-1x1/`;

  try {
    const response = await fetch(episodeUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const seriesTitle = $('h1.entry-title').text().trim() || slug.replace(/-/g, ' ');

    const episodes = [];

    $(".se-c").first().find(".episodios li").each((i, el) => {
      const epTitle = $(el).find(".episodiotitle").text().trim();
      const epLink = $(el).find("a").attr("href");
      const epSlug = epLink ? epLink.split("/episode/")[1]?.replaceAll("/", "") : null;

      if (epSlug && epTitle) {
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
    console.error("Failed to fetch episodes:", err.message);
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

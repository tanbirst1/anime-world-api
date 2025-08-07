// api/series/[slug].js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async (req, res) => {
  try {
    const { slug, season } = req.query;
    const seasonNumber = season || "1";

    const episodeUrl = `https://watchanimeworld.in/episode/${slug}-${seasonNumber}x1/`;
    const response = await fetch(episodeUrl);
    if (!response.ok) throw new Error("Episode page not found");

    const html = await response.text();
    const $ = cheerio.load(html);

    const seriesTitle = $('h1.entry-title').text().trim() || slug.replace(/-/g, ' ');

    // Get all available seasons (guessed from the selector)
    const seasons = [];
    $(".se-c").each((i, el) => {
      const seasonName = $(el).find(".season-title").text().trim();
      if (seasonName) seasons.push(seasonName);
    });

    // Get current season block
    const seasonBlock = $(".se-c").get(seasonNumber - 1);
    const episodes = [];

    if (seasonBlock) {
      $(seasonBlock)
        .find(".episodios li")
        .each((i, el) => {
          const epTitle = $(el).find(".episodiotitle").text().trim();
          const epLink = $(el).find("a").attr("href");
          const epSlug = epLink ? epLink.split("/episode/")[1].replaceAll("/", "") : null;
          if (epSlug) {
            episodes.push({ title: epTitle, slug: epSlug });
          }
        });
    }

    res.status(200).json({
      title: seriesTitle,
      totalSeasons: seasons.length,
      currentSeason: parseInt(seasonNumber),
      episodes,
    });
  } catch (err) {
    res.status(500).json({ error: "Serverless function crashed", message: err.message });
  }
};        title: $(el).find("h2.entry-title").text().trim(),
        link: $(el).find("a.lnk-blk").attr("href"),
        thumbnail: $(el).find("img").attr("src")
      });
    });

    return res.status(200).json({
      title,
      totalSeasons,
      currentSeason,
      totalEpisodes: episodes.length,
      episodes
    });
  } catch (err) {
    return res.status(200).json({
      error: err.message,
      title: slug,
      totalSeasons: 0,
      currentSeason: "1",
      totalEpisodes: 0,
      episodes: []
    });
  }
};

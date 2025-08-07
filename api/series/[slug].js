import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug, season } = req.query;
    const seasonNumber = parseInt(season) || 1;

    if (!slug) {
      return res.status(400).json({ error: "Missing slug in query." });
    }

    const episodeUrl = `https://watchanimeworld.in/episode/${slug}-${seasonNumber}x1/`;
    const response = await fetch(episodeUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(404).json({ error: "Episode page not found." });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const seriesTitle =
      $("h1.entry-title").text().trim() || slug.replace(/-/g, " ");

    // Extract all available seasons
    const seasons = [];
    $(".se-c").each((i, el) => {
      const seasonTitle = $(el).find(".season-title").text().trim();
      if (seasonTitle) {
        seasons.push(seasonTitle);
      }
    });

    const seasonIndex = seasonNumber - 1;
    const seasonBlock = $(".se-c").get(seasonIndex);

    const episodes = [];

    if (seasonBlock) {
      $(seasonBlock)
        .find(".episodios li")
        .each((i, el) => {
          const epTitle = $(el).find(".episodiotitle").text().trim();
          const epLink = $(el).find("a").attr("href");

          const epSlug = epLink?.split("/episode/")[1]?.replaceAll("/", "");
          if (epSlug) {
            episodes.push({
              title: epTitle || `Episode ${i + 1}`,
              slug: epSlug,
            });
          }
        });
    } else {
      return res.status(404).json({ error: "Season not found." });
    }

    return res.status(200).json({
      title: seriesTitle,
      totalSeasons: seasons.length,
      currentSeason: seasonNumber,
      episodes,
    });
  } catch (err) {
    console.error("Scraper error:", err.message);
    return res.status(500).json({
      error: "Scraper failed",
      message: err.message,
    });
  }
}          if (epSlug) {
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

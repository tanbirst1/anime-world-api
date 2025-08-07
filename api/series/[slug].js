import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Logger with timestamp
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) console.dir(data, { depth: null });
}

// Sanitize slug (remove -1x1 etc.)
function normalizeSlug(slug) {
  const match = slug.match(/^(.*)-\d+x\d+$/);
  return match ? match[1] : slug;
}

export default async function handler(req, res) {
  try {
    const { slug: rawSlug } = req.query;
    const season = parseInt(req.query.season) || 1;

    if (!rawSlug) {
      log("Missing slug in query");
      return res.status(400).json({ error: "Missing slug in query" });
    }

    const slug = normalizeSlug(rawSlug);
    const url = `https://watchanimeworld.in/episode/${rawSlug}/`;

    log("Fetching episode URL", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      const msg = `Failed to fetch episode page. Status ${response.status}`;
      log(msg);
      return res.status(404).json({ error: msg });
    }

    const html = await response.text();
    if (!html || html.length < 500) {
      return res.status(500).json({ error: "Empty or blocked HTML response." });
    }

    const $ = cheerio.load(html);

    // Extract main title
    const rawTitle = $("h1.entry-title").text().trim();
    const title = rawTitle.replace(/Episode\s\d+/, "").trim() || slug.replace(/-/g, " ");
    log("Parsed title", title);

    // Try to find .se-c block
    const seasonBlocks = $(".se-c");
    if (!seasonBlocks || seasonBlocks.length === 0) {
      log("No season blocks found on episode page");
      return res.status(404).json({
        error: "Season block not found. Maybe try different episode or slug."
      });
    }

    const seasonIndex = season - 1;
    const seasonBlock = seasonBlocks.get(seasonIndex);
    if (!seasonBlock) {
      log(`Season ${season} not found. Only ${seasonBlocks.length} available.`);
      return res.status(404).json({
        error: `Season ${season} not found. Available: ${seasonBlocks.length}`
      });
    }

    const episodes = [];

    $(seasonBlock)
      .find(".episodios li")
      .each((i, el) => {
        try {
          const epTitle = $(el).find(".episodiotitle").text().trim();
          const epHref = $(el).find("a").attr("href");
          const epSlug = epHref?.split("/episode/")[1]?.replace(/\//g, "");

          if (epSlug) {
            episodes.push({
              title: epTitle || `Episode ${i + 1}`,
              slug: epSlug
            });
          }
        } catch (e) {
          log("Failed to parse one episode item", e.message);
        }
      });

    if (episodes.length === 0) {
      log("No episodes found inside season block");
      return res.status(404).json({ error: "No episodes found for this season." });
    }

    return res.status(200).json({
      title,
      totalSeasons: seasonBlocks.length,
      currentSeason: season,
      episodes
    });
  } catch (err) {
    log("Fatal serverless crash", err.stack || err.message);
    return res.status(500).json({
      error: "Serverless function crashed.",
      message: err.message,
      stack: err.stack
    });
  }
}
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract actual series page link from breadcrumb or meta
    const canonical = $('link[rel="canonical"]').attr("href");
    const match = canonical?.match(/\/episode\/(.+?)-\d+x\d+\//);
    const cleanedSlug = match?.[1] || slug.replace(/-\d+x\d+$/, "");

    const seriesTitle =
      $("h1.entry-title").text().replace(/Episode \d+/, "").trim() ||
      cleanedSlug.replace(/-/g, " ");

    log("Detected series title", seriesTitle);

    // Now search for episodes list block in this episode page
    const seasonBlock = $(".se-c");

    if (!seasonBlock || seasonBlock.length === 0) {
      log("No season block found on episode page.");
      return res.status(404).json({
        error:
          "Episode page does not contain episode list. Try another slug or check site structure.",
      });
    }

    const episodes = [];

    seasonBlock.find(".episodios li").each((i, el) => {
      const epTitle = $(el).find(".episodiotitle").text().trim();
      const epLink = $(el).find("a").attr("href") || "";

      const epSlugMatch = epLink.match(/\/episode\/(.+?)\//);
      const epSlug = epSlugMatch ? epSlugMatch[1] : null;

      if (epSlug) {
        episodes.push({
          title: epTitle || `Episode ${i + 1}`,
          slug: epSlug,
        });
      }
    });

    log("Episodes found", episodes.length);

    if (episodes.length === 0) {
      return res.status(404).json({
        error: "No episodes found on episode page. Try again or update parser.",
      });
    }

    return res.status(200).json({
      title: seriesTitle,
      totalSeasons: 1, // episode page only includes current season
      currentSeason: season,
      episodes,
    });
  } catch (err) {
    log("Fatal error", err.stack || err.message);
    return res.status(500).json({
      error: "Unexpected crash",
      message: err.message,
      stack: err.stack,
    });
  }
}    const $ = cheerio.load(html);

    const seriesTitle =
      $("h1.entry-title").text().trim() || slug.replace(/-/g, " ");
    log("Series title", seriesTitle);

    const seasons = [];
    $(".se-c").each((i, el) => {
      const seasonTitle = $(el).find(".season-title").text().trim();
      if (seasonTitle) seasons.push(seasonTitle);
    });
    log("Total seasons found", seasons.length);

    const seasonIndex = seasonNumber - 1;
    const seasonBlock = $(".se-c").get(seasonIndex);

    if (!seasonBlock) {
      const msg = `Season ${seasonNumber} not found. Total available: ${seasons.length}`;
      log(msg);
      return res.status(404).json({ error: msg });
    }

    const episodes = [];

    $(seasonBlock)
      .find(".episodios li")
      .each((i, el) => {
        const epTitle = $(el).find(".episodiotitle").text().trim();
        const epLink = $(el).find("a").attr("href") || "";

        let epSlug = null;
        if (epLink.includes("/episode/")) {
          const parts = epLink.split("/episode/");
          if (parts[1]) epSlug = parts[1].replace(/\//g, "");
        }

        if (epSlug) {
          episodes.push({
            title: epTitle || `Episode ${i + 1}`,
            slug: epSlug,
          });
        } else {
          log("Invalid episode link found", epLink);
        }
      });

    log("Episodes extracted", episodes.length);

    return res.status(200).json({
      title: seriesTitle,
      totalSeasons: seasons.length,
      currentSeason: seasonNumber,
      episodes,
    });
  } catch (err) {
    log("Unexpected error", err.stack || err.message);
    return res.status(500).json({
      error: "Unexpected error",
      message: err.message,
      stack: err.stack,
    });
  }
}

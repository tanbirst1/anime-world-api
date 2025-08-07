const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  const slug = req.query.slug;
  if (!slug) {
    return res.status(400).json({ error: "Missing slug" });
  }

  try {
    const seriesUrl = `https://watchanimeworld.in/series/${slug}/`;
    const response = await fetch(seriesUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9"
      },
      timeout: 8000
    });

    const html = await response.text();
    if (!html || html.length < 500) {
      throw new Error("Invalid or blocked HTML");
    }

    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim() || slug;
    const seasons = $(".choose-season ul.aa-cnt li a").map((_, el) => $(el).attr("data-season")).get();
    const totalSeasons = seasons.length || 1;
    const currentSeason = "1"; // fallback to season 1 by default

    const episodes = [];
    $("#episode_by_temp li").each((_, el) => {
      episodes.push({
        ep: $(el).find(".num-epi").text().trim(),
        title: $(el).find("h2.entry-title").text().trim(),
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

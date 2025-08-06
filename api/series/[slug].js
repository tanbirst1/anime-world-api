const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  try {
    const slug = req.query.slug;
    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    const baseUrl = `https://watchanimeworld.in/series/${slug}/`;

    // Step 1: Fetch main series page
    const htmlRes = await fetch(baseUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!htmlRes.ok) {
      return res.status(500).json({ error: `Failed to load series page (${htmlRes.status})` });
    }
    const html = await htmlRes.text();
    if (!html || html.trim().length < 100) {
      return res.status(500).json({ error: "Empty or invalid HTML from series page" });
    }

    const $ = cheerio.load(html);
    const title = $("h1.entry-title").text().trim() || slug;
    const postId = $(".choose-season ul.aa-cnt li a").first().attr("data-post");
    if (!postId) {
      return res.status(500).json({ error: "Post ID not found" });
    }

    const seasonList = $(".choose-season ul.aa-cnt li a")
      .map((_, el) => $(el).attr("data-season"))
      .get();

    let seasonsData = [];

    // Step 2: Loop through each season
    for (const seasonNum of seasonList) {
      try {
        const formData = new URLSearchParams();
        formData.append("action", "action_select_season");
        formData.append("post", postId);
        formData.append("season", seasonNum);

        const ajaxRes = await fetch("https://watchanimeworld.in/wp-admin/admin-ajax.php", {
          method: "POST",
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": baseUrl
          },
          body: formData
        });

        if (!ajaxRes.ok) {
          seasonsData.push({ season: seasonNum, episodes: [], error: `AJAX failed (${ajaxRes.status})` });
          continue;
        }

        const ajaxHtml = await ajaxRes.text();
        if (!ajaxHtml || ajaxHtml.trim().length < 50) {
          seasonsData.push({ season: seasonNum, episodes: [], error: "Empty AJAX HTML" });
          continue;
        }

        const $$ = cheerio.load(ajaxHtml);
        const episodes = [];
        $$("#episode_by_temp li").each((_, el) => {
          episodes.push({
            ep: $$(el).find(".num-epi").text().trim(),
            title: $$(el).find("h2.entry-title").text().trim(),
            link: $$(el).find("a.lnk-blk").attr("href"),
            thumbnail: $$(el).find("img").attr("src")
          });
        });

        seasonsData.push({ season: seasonNum, episodes });
      } catch (err) {
        seasonsData.push({ season: seasonNum, episodes: [], error: err.message });
      }
    }

    // Step 3: Respond
    return res.status(200).json({
      title,
      totalSeasons: seasonsData.length,
      totalEpisodes: seasonsData.reduce((sum, s) => sum + s.episodes.length, 0),
      seasons: seasonsData
    });

  } catch (err) {
    return res.status(500).json({ error: `Crash: ${err.message}` });
  }
};

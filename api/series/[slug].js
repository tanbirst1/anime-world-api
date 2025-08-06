const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  try {
    const slug = req.query.slug;
    const seasonParam = req.query.season || "1"; // Default season = 1
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseUrl = `https://watchanimeworld.in/series/${slug}/`;

    // Step 1: Fetch main series page
    const htmlRes = await fetch(baseUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!htmlRes.ok) {
      return res.status(500).json({ error: `Failed to load series page (${htmlRes.status})` });
    }
    const html = await htmlRes.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim() || slug;
    const postId = $(".choose-season ul.aa-cnt li a").first().attr("data-post");
    if (!postId) return res.status(500).json({ error: "Post ID not found" });

    const totalSeasons = $(".choose-season ul.aa-cnt li a").length || 1;

    // Step 2: Fetch chosen season via AJAX
    const formData = new URLSearchParams();
    formData.append("action", "action_select_season");
    formData.append("post", postId);
    formData.append("season", seasonParam);

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
      return res.status(500).json({ error: `Failed to load season ${seasonParam}` });
    }

    const ajaxHtml = await ajaxRes.text();
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

    // Step 3: Respond JSON
    return res.status(200).json({
      title,
      totalSeasons,
      currentSeason: seasonParam,
      totalEpisodes: episodes.length,
      episodes
    });

  } catch (err) {
    return res.status(500).json({ error: `Crash: ${err.message}` });
  }
};

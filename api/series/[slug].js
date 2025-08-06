const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  const slug = req.query.slug;
  const seasonParam = req.query.season || "1";

  if (!slug) {
    return res.status(400).json({ error: "Missing slug" });
  }

  try {
    const baseUrl = `https://watchanimeworld.in/series/${slug}/`;

    // --- STEP 1: Fetch main series page ---
    let html;
    try {
      const htmlRes = await fetch(baseUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9"
        },
        timeout: 8000
      });

      html = await htmlRes.text();
      if (!html || html.length < 500 || html.includes("cf-browser-verification")) {
        return res.status(200).json({
          error: "Blocked or invalid HTML",
          title: slug,
          totalSeasons: 0,
          currentSeason: seasonParam,
          episodes: []
        });
      }
    } catch (err) {
      return res.status(200).json({
        error: `Series page fetch failed: ${err.message}`,
        title: slug,
        totalSeasons: 0,
        currentSeason: seasonParam,
        episodes: []
      });
    }

    // --- STEP 2: Extract metadata ---
    let title, postId, totalSeasons;
    try {
      const $ = cheerio.load(html);
      title = $("h1.entry-title").text().trim() || slug;
      postId = $(".choose-season ul.aa-cnt li a").first().attr("data-post");
      totalSeasons = $(".choose-season ul.aa-cnt li a").length || 1;
    } catch (err) {
      return res.status(200).json({
        error: `Metadata parse failed: ${err.message}`,
        title: slug,
        totalSeasons: 0,
        currentSeason: seasonParam,
        episodes: []
      });
    }

    if (!postId) {
      return res.status(200).json({
        error: "Post ID not found",
        title,
        totalSeasons,
        currentSeason: seasonParam,
        episodes: []
      });
    }

    // --- STEP 3: Fetch season episodes ---
    let episodes = [];
    try {
      const formData = new URLSearchParams();
      formData.append("action", "action_select_season");
      formData.append("post", postId);
      formData.append("season", seasonParam);

      const ajaxRes = await fetch("https://watchanimeworld.in/wp-admin/admin-ajax.php", {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": baseUrl
        },
        body: formData,
        timeout: 8000
      });

      const ajaxHtml = await ajaxRes.text();
      if (ajaxHtml && ajaxHtml.length > 100) {
        const $$ = cheerio.load(ajaxHtml);
        $$("#episode_by_temp li").each((_, el) => {
          episodes.push({
            ep: $$(el).find(".num-epi").text().trim(),
            title: $$(el).find("h2.entry-title").text().trim(),
            link: $$(el).find("a.lnk-blk").attr("href"),
            thumbnail: $$(el).find("img").attr("src")
          });
        });
      }
    } catch (err) {
      return res.status(200).json({
        error: `Episodes fetch failed: ${err.message}`,
        title,
        totalSeasons,
        currentSeason: seasonParam,
        episodes: []
      });
    }

    // --- STEP 4: Return safe JSON ---
    return res.status(200).json({
      title,
      totalSeasons,
      currentSeason: seasonParam,
      totalEpisodes: episodes.length,
      episodes
    });

  } catch (err) {
    return res.status(200).json({
      error: `Unhandled crash: ${err.message}`,
      title: slug,
      totalSeasons: 0,
      currentSeason: seasonParam,
      episodes: []
    });
  }
};

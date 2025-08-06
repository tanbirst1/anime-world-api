const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  try {
    const slug = req.query.slug;
    const seasonParam = req.query.season || "1"; // default Season 1
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseUrl = `https://watchanimeworld.in/series/${slug}/`;

    // Step 1: Fetch series page
    const htmlRes = await fetch(baseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!htmlRes.ok) {
      return res.status(500).json({ error: `Series page error: ${htmlRes.status}` });
    }

    const html = await htmlRes.text();
    if (!html || html.length < 500) {
      return res.status(500).json({ error: "Blocked or invalid HTML" });
    }

    const $ = cheerio.load(html);
    const title = $("h1.entry-title").text().trim() || slug;
    const postId = $(".choose-season ul.aa-cnt li a").first().attr("data-post");
    const totalSeasons = $(".choose-season ul.aa-cnt li a").length || 1;

    if (!postId) {
      return res.status(500).json({ error: "Post ID not found (maybe Cloudflare block)" });
    }

    // Step 2: Fetch Season episodes via AJAX
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
      body: formData
    });

    if (!ajaxRes.ok) {
      return res.status(500).json({ error: `Season ${seasonParam} fetch failed: ${ajaxRes.status}` });
    }

    const ajaxHtml = await ajaxRes.text();
    if (!ajaxHtml || ajaxHtml.length < 100) {
      return res.status(500).json({ error: "Empty season HTML (possibly blocked)" });
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

    // Step 3: Respond
    return res.status(200).json({
      title,
      totalSeasons,
      currentSeason: seasonParam,
      totalEpisodes: episodes.length,
      episodes
    });

  } catch (err) {
    return res.status(500).json({ error: `Crash caught: ${err.message}` });
  }
};

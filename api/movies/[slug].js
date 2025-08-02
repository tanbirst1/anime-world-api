import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const baseURL = "https://watchanimeworld.in";
    const movieURL = `${baseURL}/movies/${slug}/`;

    // 1. Fetch movie page with Cloudflare bypass
    const resp = await fetch(movieURL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: "Failed to fetch movie" });
    }

    const html = await resp.text();
    const $ = cheerio.load(html);

    // 2. If redirected to home
    if ($("h3.section-title").first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // 3. Extract movie info safely
    const title = $("h1.entry-title").text().trim();
    let poster = $("article.post.single img").attr("src") || "";
    if (poster.startsWith("//")) poster = "https:" + poster;
    const description = $("div.description p").text().trim();

    const genres = [];
    $(".genres a").each((_, el) => genres.push($(el).text().trim()));

    const languages = [];
    $(".loadactor a").each((_, el) => languages.push($(el).text().trim()));

    const runtime = $("span.duration .overviewCss").text().trim();
    const year = $("span.year .overviewCss").text().trim();

    const servers = [];
    $("iframe").each((i, el) => {
      let src = $(el).attr("src") || $(el).attr("data-src");
      if (src?.startsWith("//")) src = "https:" + src;
      servers.push({ server: i + 1, url: src });
    });

    res.json({ title, poster, description, genres, languages, runtime, year, servers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

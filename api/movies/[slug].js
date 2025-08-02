import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Missing movie slug" });
    }

    // 1) Read base URL
    const baseUrlPath = path.join(process.cwd(), "src", "base_url.txt");
    const baseURL = fs.existsSync(baseUrlPath)
      ? fs.readFileSync(baseUrlPath, "utf8").trim()
      : "https://watchanimeworld.in";

    // 2) Warm Cloudflare cookies
    let cookieHeaders = "";
    const homeResp = await fetch(baseURL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html",
      },
    });
    if (!homeResp.ok) {
      return res
        .status(500)
        .json({ error: `Homepage fetch failed: ${homeResp.status}` });
    }
    const setCookie = homeResp.headers.get("set-cookie");
    if (setCookie) {
      cookieHeaders = setCookie
        .split(",")
        .map((c) => c.split(";")[0])
        .join("; ");
    }

    // 3) Fetch movie page
    const targetURL = `${baseURL}/movies/${slug}/`;
    const resp = await fetch(targetURL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html",
        Referer: baseURL + "/",
        Cookie: cookieHeaders,
      },
    });
    if (!resp.ok) {
      return res
        .status(resp.status)
        .json({ error: `Movie page fetch failed: ${resp.status}` });
    }
    const html = await resp.text();

    // 4) Parse only the <article class="post single">…</article> block to save memory
    const articleMatch = html.match(
      /<article class="post single"[\s\S]*?<\/article>/
    );
    const snippet = articleMatch ? articleMatch[0] : html;

    const $ = cheerio.load(snippet);

    // 5) Detect redirect back to home
    if ($("h3.section-title").first().text().includes("Newest Drops")) {
      return res
        .status(404)
        .json({ error: "Movie not found or redirected to homepage" });
    }

    // 6) Extract fields
    const title = $("h1.entry-title").text().trim() || slug;

    // Poster is inside <img src="//...">
    let poster =
      $("article.post.single img").attr("src") ||
      $("article.post.single img").attr("data-src") ||
      "";
    if (poster.startsWith("//")) poster = "https:" + poster;

    // Description under <div class="description"><p>…</p></div>
    const description =
      $("div.description p").first().text().trim() ||
      $("meta[property='og:description']").attr("content") ||
      "";

    // Genres & Languages
    const genres = [];
    $("ul.cast-lst li")
      .filter((_, li) => $(li).find("span").text().trim() === "Genres")
      .find("p.genres a")
      .each((_, a) => genres.push($(a).text().trim()));

    const languages = [];
    $("ul.cast-lst li")
      .filter((_, li) => $(li).find("span").text().trim() === "Languages")
      .find("p.loadactor a")
      .each((_, a) => languages.push($(a).text().trim()));

    // Runtime & Year
    const runtime = $("span.duration .overviewCss").text().trim() || "";
    const year = $("span.year .overviewCss").text().trim() || "";

    // 7) Player iframe links under <section class="player ...">
    const servers = [];
    snippet
      .match(/<section class="section player[\s\S]*?<\/section>/)?.[0]
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .match(/<iframe[^>]+src="([^"]+)"/g)
      ?.forEach((iframeTag, idx) => {
        const srcMatch = iframeTag.match(/src="([^"]+)"/);
        if (srcMatch) {
          servers.push({ server: idx + 1, url: srcMatch[1] });
        }
      });

    // 8) Return JSON
    return res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      genres,
      languages,
      runtime,
      year,
      servers,
      source: targetURL,
    });
  } catch (err) {
    console.error("Movies handler crashed:", err);
    return res.status(500).json({ error: err.message });
  }
}
    // Detect homepage redirect
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected" });
    }

    // Movie info
    let title = $('h1.entry-title').text().trim();
    let poster = $('article.post.single img').first().attr('src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;
    let description = $('.description p').text().trim();
    let duration = $('.duration .overviewCss').text().trim();
    let year = $('.year .overviewCss').text().trim();

    // Genres & Languages
    let genres = [];
    $('.genres a').each((i, el) => genres.push($(el).text().trim()));
    let languages = [];
    $('.loadactor a').each((i, el) => languages.push($(el).text().trim()));

    // Servers
    let servers = [];
    $('.aa-tbs-video li a').each((i, el) => {
      let serverName = $(el).find('.server').text().trim() || `Server ${i+1}`;
      let frameId = $(el).attr('href');
      if (frameId && frameId.startsWith('#')) {
        let iframeSrc = $(`${frameId} iframe`).attr('src') || $(`${frameId} iframe`).attr('data-src');
        if (iframeSrc?.startsWith('//')) iframeSrc = 'https:' + iframeSrc;
        servers.push({ name: serverName, url: iframeSrc });
      }
    });

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      duration,
      year,
      genres,
      languages,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html",
        "Referer": baseURL + "/",
        "Cookie": cookieHeaders
      }
    });

    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Movie page fetch failed: ${resp.status}` });
    }

    const html = await resp.text();

    // Debug: Log a snippet of html to verify response (limit 1000 chars)
    console.log('HTML snippet:', html.slice(0, 1000));

    const $ = cheerio.load(html);

    // Detect homepage redirect by checking for expected content missing
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected to homepage" });
    }

    // Movie details
    const title = $('h1.entry-title').text().trim();
    let poster = $('.poster img').attr('src') || $('.poster img').attr('data-src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;
    const description = $('.entry-content p').first().text().trim();

    let links = [];
    $('.entry-content a').each((i, el) => {
      let linkText = $(el).text().trim();
      let linkHref = $(el).attr('href');
      if (linkHref?.startsWith(baseURL)) linkHref = './' + linkHref.replace(baseURL, '').replace(/^\/+/, '');
      if (linkHref) links.push({ name: linkText, url: linkHref });
    });

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      links
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
}        "Cookie": cookieHeaders
      }
    });

    const html = await resp.text();
    const $ = cheerio.load(html);

    // Detect homepage redirect
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected to homepage" });
    }

    // Movie details
    const title = $('h1.entry-title').text().trim();
    let poster = $('.poster img').attr('src') || $('.poster img').attr('data-src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;
    const description = $('.entry-content p').first().text().trim();

    // Download/Watch links
    let links = [];
    $('.entry-content a').each((i, el) => {
      let linkText = $(el).text().trim();
      let linkHref = $(el).attr('href');
      if (linkHref?.startsWith(baseURL)) linkHref = './' + linkHref.replace(baseURL, '').replace(/^\/+/, '');
      if (linkHref) links.push({ name: linkText, url: linkHref });
    });

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      links
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

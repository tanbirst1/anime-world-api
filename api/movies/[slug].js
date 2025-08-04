import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';

const MAP_FILE = path.join(process.cwd(), 'api', 'map.json');

// Save mapping
function saveMap(map) {
  fs.writeFileSync(MAP_FILE, JSON.stringify(map));
}

// Load mapping
function loadMap() {
  if (!fs.existsSync(MAP_FILE)) return {};
  return JSON.parse(fs.readFileSync(MAP_FILE));
}

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    if (!slug) return res.status(400).json({ error: "Missing movie slug" });

    const baseURL = "https://watchanimeworld.in";
    const targetURL = `${baseURL}/movies/${slug}/`;

    const response = await fetch(targetURL, { headers: { "User-Agent": "Mozilla/5.0" }});
    if (!response.ok) return res.status(500).json({ error: `Fetch failed: ${response.status}` });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Movie info
    const title = $('h1.entry-title').text().trim();
    const poster = $('.post.single img').first().attr('src');
    const description = $('.description p').first().text().trim();

    let servers = [];
    const mapData = loadMap();

    $('.aa-tbs-video li a').each((i, el) => {
      const serverName = $(el).find('.server').text().trim() || `Server ${i+1}`;
      const iframeId = $(el).attr('href').replace('#options-', '');
      const iframeSrc = $(`#options-${iframeId} iframe`).attr('src') || $(`#options-${iframeId} iframe`).attr('data-src');

      if (iframeSrc) {
        const shortId = `v${Date.now().toString(36)}${i}`;
        mapData[shortId] = iframeSrc;
        servers.push({
          server: serverName,
          url: `/video/${shortId}`
        });
      }
    });

    saveMap(mapData);

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}    const mapData = loadMap();

    $('.aa-tbs-video li a').each((i, el) => {
      const serverName = $(el).find('.server').text().trim() || `Server ${i+1}`;
      const iframeId = $(el).attr('href').replace('#options-', '');
      const iframeSrc = $(`#options-${iframeId} iframe`).attr('src') || $(`#options-${iframeId} iframe`).attr('data-src');

      if (iframeSrc) {
        const shortId = `vid${Date.now()}${i}`;
        mapData[shortId] = iframeSrc; // store mapping
        servers.push({
          server: serverName,
          url: `/video/${shortId}`
        });
      }
    });

    saveMap(mapData);

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}    let poster = $('.post img').first().attr('src');
    if (poster?.startsWith('//')) poster = 'https:' + poster;
    const description = $('.description p').first().text().trim();
    const year = $('.year .overviewCss').text().trim();
    const duration = $('.duration .overviewCss').text().trim();

    // Genres
    let genres = [];
    $('.genres a').each((_, el) => genres.push($(el).text().trim()));

    // Languages
    let languages = [];
    $('.loadactor a').each((_, el) => languages.push($(el).text().trim()));

    // 🔥 Servers (Match name + iframe URL)
    let servers = [];
    $('.aa-tbs-video li a').each((_, el) => {
      const serverName = $(el).find('.server').text().trim();
      const href = $(el).attr('href'); // Example: #options-0
      if (href && href.startsWith('#')) {
        const optionID = href.substring(1); // remove #
        const iframe = $(`#${optionID} iframe`);
        let videoURL = iframe.attr('src') || iframe.attr('data-src') || '';
        if (videoURL?.startsWith('//')) videoURL = 'https:' + videoURL;
        servers.push({ server: serverName, url: videoURL });
      }
    });

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      year,
      duration,
      genres,
      languages,
      servers
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

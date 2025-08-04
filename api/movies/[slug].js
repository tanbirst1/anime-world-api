import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const MAP_FILE = path.join(process.cwd(), 'api', 'map.json');

// Load existing map (ID → real URL)
function loadMap() {
  if (!fs.existsSync(MAP_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')); }
  catch { return {}; }
}
// Save updated map
function saveMap(m) {
  fs.writeFileSync(MAP_FILE, JSON.stringify(m));
}

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing movie slug" });

    // Base URL (read from base_url.txt or default)
    const basePath = path.join(process.cwd(), 'src', 'base_url.txt');
    const baseURL = fs.existsSync(basePath)
      ? fs.readFileSync(basePath, 'utf8').trim()
      : "https://watchanimeworld.in";

    // Fetch movie page
    const url = `${baseURL}/movies/${slug}/`;
    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) return res.status(500).json({ error: `Fetch failed (${resp.status})` });
    const html = await resp.text();
    const $ = cheerio.load(html);

    // Redirect detection
    if ($('h3.section-title').first().text().includes("Newest Drops")) {
      return res.status(404).json({ error: "Movie not found or redirected" });
    }

    // Extract details
    const title       = $('h1.entry-title').text().trim();
    let poster        = $('.post.single img').first().attr('src') || '';
    if (poster.startsWith('//')) poster = 'https:' + poster;
    const description = $('.description p').first().text().trim();
    const year        = $('.year .overviewCss').text().trim();
    const duration    = $('.duration .overviewCss').text().trim();

    const genres     = $('.genres a').map((i,e)=>$(e).text().trim()).get();
    const languages  = $('.loadactor a').map((i,e)=>$(e).text().trim()).get();

    // Build servers array with short IDs
    const mapData = loadMap();
    let servers = [];
    $('.aa-tbs-video li a').each((i, el) => {
      const name = $(el).find('.server').text().trim() || `Server ${i+1}`;
      const href = $(el).attr('href') || '';
      if (!href.startsWith('#')) return;
      const idNum = href.slice(1); // e.g. "options-0"
      const iframe = $(`#${idNum} iframe`);
      let realURL = iframe.attr('src') || iframe.attr('data-src') || '';
      if (realURL.startsWith('//')) realURL = 'https:' + realURL;
      if (!realURL) return;

      // generate a stable short ID: slug + "_" + idNum
      const shortId = `${slug}_${idNum}`;
      mapData[shortId] = realURL;
      servers.push({
        server: name,
        url: `/video/${shortId}`
      });
    });
    saveMap(mapData);

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

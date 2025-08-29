import fetch from "node-fetch";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const HIANIME_API_BASE = "https://hianime-orpin.vercel.app";

/**
 * Utility: Extract clean keywords (remove extra words, punctuation)
 */
function cleanTitle(title) {
  return title
    .replace(/:.*$/, "") // remove subtitles after colon
    .replace(/\(.*\)/g, "") // remove parentheses
    .trim();
}

export default async function handler(req, res) {
  try {
    const { tmdb_id, name, type } = req.query;

    if (!tmdb_id && !name) {
      return res
        .status(400)
        .json({ error: "You must provide either tmdb_id or name" });
    }

    let tmdbData = null;
    let finalType = type;

    // ----------------------------
    // If TMDB ID provided
    // ----------------------------
    if (tmdb_id) {
      // Try both tv and movie if type not given
      const typesToTry = type ? [type] : ["tv", "movie"];
      for (const t of typesToTry) {
        const url = `https://api.themoviedb.org/3/${t}/${tmdb_id}?api_key=${TMDB_API_KEY}`;
        const resp = await fetch(url);
        if (resp.ok) {
          tmdbData = await resp.json();
          finalType = t; // detected type
          break;
        }
      }
      if (!tmdbData) {
        return res.status(404).json({ error: "TMDB ID not found" });
      }
    }

    // ----------------------------
    // If name provided
    // ----------------------------
    if (name && !tmdbData) {
      const searchType = type || "multi";
      const url = `https://api.themoviedb.org/3/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        name
      )}`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (!data.results || data.results.length === 0) {
        return res.status(404).json({ error: "No TMDB results found" });
      }

      tmdbData = data.results[0];
      finalType = tmdbData.media_type || searchType;
    }

    // ----------------------------
    // Extract Title
    // ----------------------------
    const tmdbName =
      tmdbData.title || tmdbData.name || tmdbData.original_title || tmdbData.original_name;
    const cleanName = cleanTitle(tmdbName);

    // ----------------------------
    // Search HiAnime
    // ----------------------------
    const searchUrl = `${HIANIME_API_BASE}/search?keyw=${encodeURIComponent(
      cleanName
    )}`;
    const aniResp = await fetch(searchUrl);
    const aniData = await aniResp.json();

    let hianime = aniData.results?.[0] || null;

    res.status(200).json({
      tmdb_id: tmdbData.id || tmdb_id,
      type: finalType,
      name: cleanName,
      hianime_id: hianime?.id || null,
      hianime_name: hianime?.title || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

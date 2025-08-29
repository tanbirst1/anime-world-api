import fetch from "node-fetch";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const HIANIME_API_BASE = "https://hianime-api-production.up.railway.app/api/v1";

function toKebabCase(str = "") {
  return str
    .replace(/[’‘]/g, "")        // Remove fancy apostrophes
    .replace(/[^A-Za-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/-+/g, "-")          // Consolidate multiple hyphens
    .replace(/(^-|-$)/g, "")      // Trim leading/trailing hyphens
    .toLowerCase();
}

async function fetchTMDB({ tmdb_id, name, type }) {
  let tmdbData = null;
  let finalType = type;

  if (tmdb_id) {
    const typesToTry = type ? [type] : ["tv", "movie"];
    for (const t of typesToTry) {
      const url = `https://api.themoviedb.org/3/${t}/${tmdb_id}?api_key=${TMDB_API_KEY}`;
      const resp = await fetch(url);
      if (resp.ok) {
        tmdbData = await resp.json();
        finalType = t;
        break;
      }
    }
    if (!tmdbData) throw { status: 404, error: "TMDB ID not found" };
  } else if (name) {
    const searchType = type || "multi";
    const url = `https://api.themoviedb.org/3/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data.results || data.results.length === 0) {
      throw { status: 404, error: "No TMDB results found" };
    }

    tmdbData = data.results[0];
    finalType = tmdbData.media_type || searchType;
  }

  const tmdbName = tmdbData.title || tmdbData.name || tmdbData.original_title || tmdbData.original_name;
  return { tmdbData, finalType, tmdbName };
}

export default async function handler(req, res) {
  try {
    const { tmdb_id, name, type } = req.query;

    if (!tmdb_id && !name) {
      return res.status(400).json({ error: "Provide either tmdb_id or name" });
    }

    const { tmdbData, finalType, tmdbName } = await fetchTMDB({ tmdb_id, name, type });
    const keyword = toKebabCase(tmdbName);

    const aniUrl = `${HIANIME_API_BASE}/search?keyword=${keyword}&page=1`;
    const aniResp = await fetch(aniUrl);
    const aniJson = await aniResp.json();

    const hianimeResult = aniJson.data?.[0] || aniJson.response?.[0] || null;

    return res.status(200).json({
      tmdb_id: tmdbData.id,
      type: finalType,
      name: tmdbName,
      hianime_id: hianimeResult?.id || null,
      hianime_name: hianimeResult?.title || hianimeResult?.name || null,
    });
  } catch (err) {
    console.error(err);
    const code = err.status || 500;
    return res.status(code).json({ error: err.error || "Server error", details: err.message });
  }
}

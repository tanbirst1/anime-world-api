import fetch from "node-fetch";

const TMDB_API_KEY = process.env.TMDB_API_KEY; // Put your TMDB key in Vercel env

export default async function handler(req, res) {
  try {
    const { tmdb_id, name } = req.query;

    let animeName = name;

    // Step 1: If tmdb_id provided, fetch name from TMDB
    if (tmdb_id) {
      const tmdbUrl = `https://api.themoviedb.org/3/tv/${tmdb_id}?api_key=${TMDB_API_KEY}&language=en-US`;
      const tmdbRes = await fetch(tmdbUrl);
      if (!tmdbRes.ok) {
        return res.status(400).json({ error: "Invalid TMDB ID or request failed" });
      }
      const tmdbData = await tmdbRes.json();

      // Use name or original_name
      animeName = tmdbData.name || tmdbData.original_name;
    }

    if (!animeName) {
      return res.status(400).json({ error: "Either tmdb_id or name must be provided" });
    }

    // Step 2: Search HiAnime API
    const searchUrl = `https://hianime-orpin.vercel.app/api/v2/hianime/search?q=${encodeURIComponent(animeName)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData || !searchData.data || !searchData.data.animes) {
      return res.status(404).json({ error: "Anime not found on HiAnime" });
    }

    // Step 3: Try exact keyword match (case-insensitive, trimmed)
    const normalizedName = animeName.toLowerCase().trim();
    const exactMatch = searchData.data.animes.find(anime =>
      anime.name.toLowerCase().trim() === normalizedName
    );

    const bestMatch = exactMatch || searchData.data.animes[0]; // fallback to first result

    return res.status(200).json({
      tmdb_id: tmdb_id || null,
      name: animeName,
      hianime_id: bestMatch?.id || null,
      hianime_name: bestMatch?.name || null,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

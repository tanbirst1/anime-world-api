import fetch from "node-fetch";

const TMDB_API_KEY = process.env.TMDB_API_KEY; // Add in Vercel env

export default async function handler(req, res) {
  try {
    let { tmdb_id, name } = req.query;

    let animeName = name;
    let resolvedTmdbId = tmdb_id;

    // Step 1: If tmdb_id provided → fetch official name from TMDB
    if (tmdb_id) {
      const tmdbUrl = `https://api.themoviedb.org/3/tv/${tmdb_id}?api_key=${TMDB_API_KEY}&language=en-US`;
      const tmdbRes = await fetch(tmdbUrl);
      if (!tmdbRes.ok) {
        return res.status(400).json({ error: "Invalid TMDB ID or request failed" });
      }
      const tmdbData = await tmdbRes.json();

      animeName = tmdbData.name || tmdbData.original_name;
      resolvedTmdbId = tmdbData.id;
    }

    // Step 2: If only name provided → search TMDB to get id + correct title
    if (!tmdb_id && animeName) {
      const tmdbSearchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(animeName)}`;
      const tmdbSearchRes = await fetch(tmdbSearchUrl);
      const tmdbSearchData = await tmdbSearchRes.json();

      if (tmdbSearchData.results && tmdbSearchData.results.length > 0) {
        const bestTmdbMatch = tmdbSearchData.results[0];
        resolvedTmdbId = bestTmdbMatch.id;
        animeName = bestTmdbMatch.name || bestTmdbMatch.original_name;
      }
    }

    if (!animeName) {
      return res.status(400).json({ error: "Either tmdb_id or name must be provided" });
    }

    // Step 3: Search HiAnime API by final name
    const searchUrl = `https://hianime-orpin.vercel.app/api/v2/hianime/search?q=${encodeURIComponent(animeName)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData || !searchData.data || !searchData.data.animes) {
      return res.status(404).json({ error: "Anime not found on HiAnime" });
    }

    // Step 4: Match HiAnime title
    const normalizedName = animeName.toLowerCase().trim();
    const exactMatch = searchData.data.animes.find(anime =>
      anime.name.toLowerCase().trim() === normalizedName
    );

    const bestMatch = exactMatch || searchData.data.animes[0];

    // Step 5: Return JSON
    return res.status(200).json({
      tmdb_id: resolvedTmdbId || null,
      name: animeName,
      hianime_id: bestMatch?.id || null,
      hianime_name: bestMatch?.name || null,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

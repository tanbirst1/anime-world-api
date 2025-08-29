import fetch from "node-fetch";

const TMDB_API_KEY = process.env.TMDB_API_KEY; // Set in Vercel env

export default async function handler(req, res) {
  try {
    let { tmdb_id, name, type } = req.query; // type = 'tv' or 'movie'

    let animeName = name;
    let resolvedTmdbId = tmdb_id;
    let resolvedType = type ? type.toLowerCase() : null; // final type

    // Validate type
    if (resolvedType && !['tv', 'movie'].includes(resolvedType)) {
      return res.status(400).json({ error: "Invalid type. Use 'tv' or 'movie'." });
    }

    // Step 1: If tmdb_id provided → fetch official name + type from TMDB
    if (tmdb_id) {
      // Default to TV if type not given
      const tmdbUrl = `https://api.themoviedb.org/3/${resolvedType || 'tv'}/${tmdb_id}?api_key=${TMDB_API_KEY}&language=en-US`;
      let tmdbRes = await fetch(tmdbUrl);

      // If first fetch failed (maybe wrong type), try the other one
      if (!tmdbRes.ok && !resolvedType) {
        const fallbackUrl = `https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${TMDB_API_KEY}&language=en-US`;
        tmdbRes = await fetch(fallbackUrl);
      }

      if (!tmdbRes.ok) {
        return res.status(400).json({ error: "Invalid TMDB ID or request failed" });
      }

      const tmdbData = await tmdbRes.json();
      animeName = tmdbData.name || tmdbData.original_name || tmdbData.title || tmdbData.original_title;
      resolvedTmdbId = tmdbData.id;
      resolvedType = tmdbData.media_type || (tmdbData.first_air_date ? "tv" : "movie");
    }

    // Step 2: If only name provided → search TMDB to get id + correct title + type
    if (!tmdb_id && animeName) {
      const searchType = resolvedType || "tv"; // default TV search
      const tmdbSearchUrl = `https://api.themoviedb.org/3/search/${searchType}?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(animeName)}`;
      const tmdbSearchRes = await fetch(tmdbSearchUrl);
      const tmdbSearchData = await tmdbSearchRes.json();

      if (tmdbSearchData.results && tmdbSearchData.results.length > 0) {
        const bestTmdbMatch = tmdbSearchData.results[0];
        resolvedTmdbId = bestTmdbMatch.id;
        animeName = bestTmdbMatch.name || bestTmdbMatch.original_name || bestTmdbMatch.title || bestTmdbMatch.original_title;
        resolvedType = searchType;
      } else {
        resolvedTmdbId = null;
      }
    }

    // If neither id nor name works
    if (!animeName) {
      return res.status(400).json({ error: "Either tmdb_id or name must be provided" });
    }

    // Step 3: Search HiAnime API by final name
    let searchUrl = `https://hianime-orpin.vercel.app/api/v2/hianime/search?q=${encodeURIComponent(animeName)}`;
    if (resolvedType) searchUrl += `&type=${resolvedType}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData || !searchData.data || !searchData.data.animes) {
      return res.status(404).json({ error: "Anime not found on HiAnime" });
    }

    // Step 4: Match HiAnime title (strict keyword match)
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
      type: resolvedType || null
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

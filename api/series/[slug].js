import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { slug, season = '1' } = req.query;

  try {
    // Remove trailing slash if present
    const cleanSlug = slug.replace(/\/$/, '');

    // Construct base episode URL
    const episodeBaseURL = `https://api.consumet.org/anime/gogoanime/${cleanSlug}-1x1`;

    // Fetch the first episode to determine the internal anime ID
    const firstEpisodeRes = await fetch(episodeBaseURL);
    const firstEpisodeData = await firstEpisodeRes.json();

    if (!firstEpisodeData || firstEpisodeData.error) {
      return res.status(404).json({ error: 'Series not found or invalid slug' });
    }

    const internalId = firstEpisodeData.id.split('-episode-')[0];

    // Fetch all episodes using internal ID
    const episodesRes = await fetch(`https://api.consumet.org/anime/gogoanime/info/${internalId}`);
    const episodesData = await episodesRes.json();

    if (!episodesData || episodesData.error) {
      return res.status(404).json({ error: 'Failed to fetch episode info' });
    }

    const allEpisodes = episodesData.episodes || [];
    const totalEpisodes = allEpisodes.length;

    // Group episodes into seasons of 12
    const episodesPerSeason = 12;
    const totalSeasons = Math.ceil(totalEpisodes / episodesPerSeason);
    const currentSeason = parseInt(season);

    if (currentSeason < 1 || currentSeason > totalSeasons) {
      return res.status(400).json({ error: 'Invalid season number' });
    }

    // Slice the episodes for the current season
    const start = (currentSeason - 1) * episodesPerSeason;
    const end = start + episodesPerSeason;
    const currentEpisodes = allEpisodes.slice(start, end);

    return res.json({
      title: episodesData.title,
      image: episodesData.image,
      description: episodesData.description,
      totalSeasons,
      currentSeason,
      episodes: currentEpisodes,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

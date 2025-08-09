// filename: scraper.js

import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchSeasonEpisodes() {
  const url = 'https://watchanimeworld.in/series/naruto/';
  const { data: html } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(html);

  // Look for the summary line: "[ 5 Seasons ||  220 Episodes ]"
  const summaryText = $('h1').next().text();
  // summaryText example: "[ 5 Seasons ||  220 Episodes ]"

  const match = summaryText.match(/(\d+)\s*Seasons?\s*\|\|\s*(\d+)\s*Episodes/);
  if (!match) {
    console.error('Failed to parse seasons/episodes info.');
    return null;
  }

  const totalSeasons = parseInt(match[1], 10);
  const totalEpisodes = parseInt(match[2], 10);

  // Calculate approximate episodes per season (assuming even distribution):
  const base = Math.floor(totalEpisodes / totalSeasons);
  const remainder = totalEpisodes % totalSeasons;

  const result = {};
  for (let s = 1; s <= totalSeasons; s++) {
    result[s] = base + (s === totalSeasons ? remainder : 0);
  }

  return result;
}

async function main() {
  const perSeasonEpisodes = await fetchSeasonEpisodes();
  console.log(JSON.stringify(perSeasonEpisodes, null, 2));
}

main().catch(console.error);

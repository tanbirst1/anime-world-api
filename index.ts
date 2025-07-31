import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * WatchAnimeWorld Home Scraper API
 * Deploy on Vercel root
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const BASE_URL = "https://watchanimeworld.in/";

    // Fetch homepage HTML
    const { data } = await axios.get(BASE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const $ = cheerio.load(data);

    /** 
     * ======================
     * SCRAPE LATEST ANIME
     * ======================
     * Replace `.latest-anime` and `.anime-card` selectors
     */
    const latestAnime: any[] = [];
    $(".latest-anime .anime-card").each((_, el) => {
      latestAnime.push({
        title: $(el).find(".anime-title").text().trim(),
        link: BASE_URL + ($(el).find("a").attr("href") || ""),
        image: $(el).find("img").attr("src") || ""
      });
    });

    /** 
     * ======================
     * SCRAPE POPULAR ANIME
     * ======================
     */
    const popularAnime: any[] = [];
    $(".popular-anime .anime-card").each((_, el) => {
      popularAnime.push({
        title: $(el).find(".anime-title").text().trim(),
        link: BASE_URL + ($(el).find("a").attr("href") || ""),
        image: $(el).find("img").attr("src") || ""
      });
    });

    /** 
     * ======================
     * SCRAPE FEATURED / BANNER
     * ======================
     */
    const featured: any[] = [];
    $(".featured-anime .banner-card").each((_, el) => {
      featured.push({
        title: $(el).find(".banner-title").text().trim(),
        link: BASE_URL + ($(el).find("a").attr("href") || ""),
        image: $(el).find("img").attr("src") || ""
      });
    });

    // Send response
    res.status(200).json({
      success: true,
      source: BASE_URL,
      fetchedAt: new Date().toISOString(),
      featured,
      latest: latestAnime,
      popular: popularAnime
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

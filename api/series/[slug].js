import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    const baseUrl = `https://watchanimeworld.in/series/${slug}/`;

    // Fetch main page
    const htmlRes = await fetch(baseUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!htmlRes.ok) throw new Error("Failed to load series page");

    const html = await htmlRes.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim();

    // Get all seasons from dropdown
    const seasonLinks = $(".choose-season ul.aa-cnt li a")
      .map((i, el) => ({
        season: $(el).attr("data-season"),
        post: $(el).attr("data-post"),
        slugUrl: `${baseUrl}?season=${$(el).attr("data-season")}`
      }))
      .get();

    // Fetch all seasons in parallel
    const seasonResults = await Promise.all(
      seasonLinks.map(async (seasonObj) => {
        try {
          const seasonRes = await fetch(seasonObj.slugUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
          });
          if (!seasonRes.ok) return { season: seasonObj.season, episodes: [] };

          const seasonHtml = await seasonRes.text();
          const $$ = cheerio.load(seasonHtml);

          const episodes = [];
          $$("#episode_by_temp li").each((_, el) => {
            episodes.push({
              ep: $$(el).find(".num-epi").text().trim(),
              title: $$(el).find("h2.entry-title").text().trim(),
              link: $$(el).find("a.lnk-blk").attr("href")
            });
          });

          return { season: seasonObj.season, episodes };
        } catch {
          return { season: seasonObj.season, episodes: [] };
        }
      })
    );

    const result = {
      title,
      totalSeasons: seasonResults.length,
      totalEpisodes: seasonResults.reduce(
        (sum, s) => sum + s.episodes.length,
        0
      ),
      seasons: seasonResults
    };

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}                "X-Requested-With": "XMLHttpRequest",
                "Referer": baseUrl
              },
              body: new URLSearchParams({
                action: "aa_load_episodes", // Correct action for AA themes
                post: postId,
                season: seasonNumber
              })
            }
          );

          if (!ajaxRes.ok) return { season: seasonNumber, episodes: [] };
          const ajaxHtml = await ajaxRes.text();
          const $$ = cheerio.load(ajaxHtml);

          const episodes = [];
          $$("#episode_by_temp li").each((_, el) => {
            episodes.push({
              ep: $$(el).find(".num-epi").text().trim(),
              title: $$(el).find("h2.entry-title").text().trim(),
              link: $$(el).find("a.lnk-blk").attr("href")
            });
          });

          return { season: seasonNumber, episodes };
        } catch {
          return { season: seasonNumber, episodes: [] };
        }
      })
    );

    const result = {
      title,
      totalSeasons: seasonResults.length,
      totalEpisodes: seasonResults.reduce(
        (sum, s) => sum + s.episodes.length,
        0
      ),
      seasons: seasonResults
    };

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

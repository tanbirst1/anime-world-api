import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    const baseUrl = `https://watchanimeworld.in/series/${slug}/`;

    // Step 1: Fetch main series page
    const htmlRes = await fetch(baseUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await htmlRes.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim();
    const postId = $(".choose-season ul.aa-cnt li a").attr("data-post");
    const seasonList = $(".choose-season ul.aa-cnt li a")
      .map((_, el) => $(el).attr("data-season"))
      .get();

    let seasonsData = [];

    // Step 2: Loop through each season
    for (const seasonNum of seasonList) {
      const formData = new URLSearchParams();
      formData.append("action", "action_select_season");
      formData.append("post", postId);
      formData.append("season", seasonNum);

      const ajaxRes = await fetch("https://watchanimeworld.in/wp-admin/admin-ajax.php", {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": baseUrl
        },
        body: formData
      });

      const ajaxHtml = await ajaxRes.text();
      const $$ = cheerio.load(ajaxHtml);

      const episodes = [];
      $$("#episode_by_temp li").each((_, el) => {
        episodes.push({
          ep: $$(el).find(".num-epi").text().trim(),
          title: $$(el).find("h2.entry-title").text().trim(),
          link: $$(el).find("a.lnk-blk").attr("href"),
          thumbnail: $$(el).find("img").attr("src")
        });
      });

      seasonsData.push({
        season: seasonNum,
        episodes
      });
    }

    // Step 3: Build JSON output
    const result = {
      title,
      totalSeasons: seasonsData.length,
      totalEpisodes: seasonsData.reduce((sum, s) => sum + s.episodes.length, 0),
      seasons: seasonsData
    };

    res.status(200).json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}              "Referer": seriesUrl
            },
            body: new URLSearchParams({
              action: "action_select_season", // Common AA theme action
              post: postId,
              season: seasonNum
            })
          }
        );

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

        seasonsData.push({ season: seasonNum, episodes });
      } catch {
        seasonsData.push({ season: seasonNum, episodes: [] });
      }
    }

    const result = {
      title,
      totalSeasons: seasonsData.length,
      totalEpisodes: seasonsData.reduce((sum, s) => sum + s.episodes.length, 0),
      seasons: seasonsData
    };

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    const baseUrl = `https://watchanimeworld.in/series/${slug}/`;

    const htmlRes = await fetch(baseUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await htmlRes.text();
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim();
    const postId = $(".choose-season ul.aa-cnt li a").first().data("post");

    let seasons = [];
    const seasonLinks = $(".choose-season ul.aa-cnt li a");

    // Loop each season
    for (let i = 0; i < seasonLinks.length; i++) {
      const seasonNumber = $(seasonLinks[i]).data("season");
      const ajaxUrl = `https://watchanimeworld.in/wp-admin/admin-ajax.php?action=action_select_season&post=${postId}&season=${seasonNumber}`;

      const ajaxRes = await fetch(ajaxUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const ajaxHtml = await ajaxRes.text();
      const $$ = cheerio.load(ajaxHtml);

      let episodes = [];
      $$("#episode_by_temp li").each((j, el) => {
        const epCode = $$(el).find(".num-epi").text().trim();
        const epTitle = $$(el).find("h2.entry-title").text().trim();
        const epLink = $$(el).find("a.lnk-blk").attr("href");

        episodes.push({ ep: epCode, title: epTitle, link: epLink });
      });

      seasons.push({ season: seasonNumber, episodes });
    }

    const result = {
      title,
      totalSeasons: seasons.length,
      totalEpisodes: seasons.reduce((sum, s) => sum + s.episodes.length, 0),
      seasons
    };

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}            ep: epCode,
            title: epTitle,
            link: epLink
          });
        }
      }
    });

    const result = {
      title: title,
      totalSeasons: seasons.length,
      totalEpisodes: seasons.reduce((sum, s) => sum + s.episodes.length, 0),
      seasons: seasons
    };

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

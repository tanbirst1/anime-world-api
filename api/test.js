import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function fetchSeason(postId, seasonNumber) {
    const formData = new URLSearchParams();
    formData.append("action", "action_select_season");
    formData.append("post", postId);
    formData.append("season", seasonNumber);

    const res = await fetch("https://watchanimeworld.in/wp-admin/admin-ajax.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0"
        },
        body: formData
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    let episodes = [];
    $(".episode-item").each((_, el) => {
        episodes.push({
            title: $(el).find(".episode-title").text().trim(),
            url: $(el).find("a").attr("href")
        });
    });

    return episodes;
}

// Example usage:
(async () => {
    const postId = "12345"; // get this dynamically from main page
    const seasons = [1, 2, 3]; // get this dynamically
    for (let season of seasons) {
        let eps = await fetchSeason(postId, season);
        console.log(`Season ${season}:`, eps);
    }
})();

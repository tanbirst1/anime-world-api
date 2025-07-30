import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

// Home API
app.get("/api/home", async (req, res) => {
  try {
    const url = "https://watchanimeworld.in/";
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const $ = cheerio.load(data);

    let homeData = [];
    $(".item a").each((i, el) => {
      const title = $(el).attr("title");
      const link = $(el).attr("href");
      const img = $(el).find("img").attr("src");
      if (title && link) {
        homeData.push({
          title,
          link: link.startsWith("http") ? link : `https://watchanimeworld.in${link}`,
          image: img
        });
      }
    });

    res.json(homeData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

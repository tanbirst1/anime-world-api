export default async function handler(req, res) {
  try {
    const response = await fetch("https://watchanimeworld.in/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114 Safari/537.36"
      }
    });

    if (!response.ok) {
      return res.status(500).json({ success: false, status: response.status });
    }

    // If fetch succeeded
    res.status(200).json({ success: true, test: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}      return link;
    }

    // Helper: Fix image URL (add https: if starts with //)
    function fixImage(src) {
      if (!src) return '';
      if (src.startsWith('//')) return 'https:' + src;
      return src;
    }

    // Scrape Swiper-based sections (Newest Drops, New Anime Arrivals, Cartoon Series, Latest Anime Movies)
    function scrapeSwiperSection(titleMatch) {
      let data = [];
      $('h3.section-title').each((_, el) => {
        const headingText = $(el).text().trim();
        if (headingText.includes(titleMatch)) {
          // Find the closest parent section or div that contains swiper-container(s)
          const parent = $(el).closest('header').parent();
          // Search recursively inside the parent for any .swiper-container
          parent.find('.swiper-container').first().find('.swiper-slide').each((i, slide) => {
            const title = $(slide).find('.entry-title').text().trim();
            let link = $(slide).find('a.lnk-blk').attr('href');
            let image = $(slide).find('img').attr('src') || $(slide).find('img').attr('data-src');
            link = cleanLink(link);
            image = fixImage(image);
            if (title) data.push({ title, link, image });
          });
        }
      });
      return data;
    }

    // Scrape Top-Picks based sections (Most-Watched Shows, Most-Watched Films)
    function scrapeTopPicksByHeading(headingText) {
      let data = [];
      $('h3.widget-title').each((_, el) => {
        const hText = $(el).text().trim();
        if (hText.includes(headingText)) {
          const container = $(el).closest('.widget');
          container.find('.top-picks__item').each((i, el2) => {
            let link = $(el2).find('a.item__card').attr('href');
            let image = $(el2).find('img').attr('src');
            const title = $(el2).find('img').attr('alt')?.replace('Image ', '').trim();
            link = cleanLink(link);
            image = fixImage(image);
            if (title) data.push({ rank: i + 1, title, link, image });
          });
        }
      });
      return data;
    }

    // Collect all sections
    const newestDrops = scrapeSwiperSection("Newest Drops");
    const mostWatchedShows = scrapeTopPicksByHeading("Most-Watched Shows");
    const mostWatchedFilms = scrapeTopPicksByHeading("Most-Watched Films");
    const newAnimeArrivals = scrapeSwiperSection("New Anime Arrivals");
    const cartoonSeries = scrapeSwiperSection("Just In: Cartoon Series");
    const latestAnimeMovies = scrapeSwiperSection("Latest Anime Movies");

    // Send JSON response
    res.status(200).json({
      status: "ok",
      base: baseURL,
      newestDrops,
      mostWatchedShows,
      mostWatchedFilms,
      newAnimeArrivals,
      cartoonSeries,
      latestAnimeMovies,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}      return link;
    }

    // Helper: Fix image URL (add https: if starts with //)
    function fixImage(src) {
      if (!src) return '';
      if (src.startsWith('//')) return 'https:' + src;
      return src;
    }

    // Scrape Swiper-based sections (Newest Drops, New Anime Arrivals, Cartoon Series, Latest Anime Movies)
    function scrapeSwiperSection(titleMatch) {
      let data = [];
      $('h3.section-title').each((_, el) => {
        const headingText = $(el).text().trim();
        if (headingText.includes(titleMatch)) {
          // Find the closest parent section or div that contains swiper-container(s)
          const parent = $(el).closest('header').parent();
          // Search recursively inside the parent for any .swiper-container
          parent.find('.swiper-container').first().find('.swiper-slide').each((i, slide) => {
            const title = $(slide).find('.entry-title').text().trim();
            let link = $(slide).find('a.lnk-blk').attr('href');
            let image = $(slide).find('img').attr('src') || $(slide).find('img').attr('data-src');
            link = cleanLink(link);
            image = fixImage(image);
            if (title) data.push({ title, link, image });
          });
        }
      });
      return data;
    }

    // Scrape Top-Picks based sections (Most-Watched Shows, Most-Watched Films)
    function scrapeTopPicksByHeading(headingText) {
      let data = [];
      $('h3.widget-title').each((_, el) => {
        const hText = $(el).text().trim();
        if (hText.includes(headingText)) {
          const container = $(el).closest('.widget');
          container.find('.top-picks__item').each((i, el2) => {
            let link = $(el2).find('a.item__card').attr('href');
            let image = $(el2).find('img').attr('src');
            const title = $(el2).find('img').attr('alt')?.replace('Image ', '').trim();
            link = cleanLink(link);
            image = fixImage(image);
            if (title) data.push({ rank: i + 1, title, link, image });
          });
        }
      });
      return data;
    }

    // Collect all sections
    const newestDrops = scrapeSwiperSection("Newest Drops");
    const mostWatchedShows = scrapeTopPicksByHeading("Most-Watched Shows");
    const mostWatchedFilms = scrapeTopPicksByHeading("Most-Watched Films");
    const newAnimeArrivals = scrapeSwiperSection("New Anime Arrivals");
    const cartoonSeries = scrapeSwiperSection("Just In: Cartoon Series");
    const latestAnimeMovies = scrapeSwiperSection("Latest Anime Movies");

    // Send JSON response
    res.status(200).json({
      status: "ok",
      base: baseURL,
      newestDrops,
      mostWatchedShows,
      mostWatchedFilms,
      newAnimeArrivals,
      cartoonSeries,
      latestAnimeMovies,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

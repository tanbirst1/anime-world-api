export default function handler(req, res) {
  try {
    const slug = req.query.slug || "no-slug";
    res.status(200).json({ status: "ok", route: "movies", slug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
    let duration = $('.duration .overviewCss').text().trim();
    let genres = [];
    $('.genres a').each((i, el) => genres.push($(el).text().trim()));
    let languages = [];
    $('.loadactor a').each((i, el) => languages.push($(el).text().trim()));

    // Streaming Links
    let streams = [];
    $('.aa-tbs-video li a').each((i, el) => {
      streams.push({
        server: $(el).find('.server').text().trim(),
        link: $(el).attr('href')
      });
    });

    res.status(200).json({
      status: "ok",
      slug,
      title,
      poster,
      description,
      year,
      duration,
      genres,
      languages,
      streams
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

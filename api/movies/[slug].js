export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Slug missing" });
    }

    // Base URL (can later be read from /src/base_url.txt if needed)
    const baseURL = "https://watchanimeworld.in";
    const targetURL = `${baseURL}/movies/${slug}/`;

    // Fake browser headers
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": baseURL + "/",
      "Connection": "keep-alive"
    };

    // Fetch page
    const response = await fetch(targetURL, { headers });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch movie page (${response.status})` });
    }

    const html = await response.text();

    // 🔍 Instead of parsing everything, test output like CF Worker
    return res.status(200).send(html);

  } catch (err) {
    console.error("Movies error:", err);
    return res.status(500).json({ error: err.message });
  }
}

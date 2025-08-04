// api/video.js
import { getVideoFromHash } from './movies/[slug].js';

export default async function handler(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("❌ Missing token");

    const realURL = getVideoFromHash(token);
    if (!realURL) return res.status(404).send("❌ Invalid token");

    // HTML Player Page
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Video Player</title>
        <style>
          body { margin:0; background:#000; display:flex; flex-direction:column; align-items:center; }
          .ad-banner { background:#111; color:#fff; padding:10px; text-align:center; width:100%; }
          iframe { width:100%; height:90vh; border:none; }
        </style>
      </head>
      <body>
        <div class="ad-banner">
          🔥 Your Ad Here — Click to Support Us 🔥
        </div>
        <iframe src="${realURL}" allowfullscreen allow="autoplay; encrypted-media"></iframe>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);

  } catch (err) {
    res.status(500).send("⚠️ Error: " + err.message);
  }
}                style="width:100%;height:calc(100vh - 60px);border:none;"
                allow="autoplay; encrypted-media" allowfullscreen>
        </iframe>
      </body>
      </html>
    `);

  } catch (err) {
    res.status(500).send(err.message);
  }
}

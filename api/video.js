import fs from 'fs';
import path from 'path';

const MAP_FILE = path.join(process.cwd(), 'api', 'map.json');

// Load map
function loadMap() {
  if (!fs.existsSync(MAP_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')); }
  catch { return {}; }
}

export default function handler(req, res) {
  try {
    // slug_optionsID or via ?slug
    const id = req.query.id || req.url.split('/').pop();
    if (!id) return res.status(400).send("Missing video ID");

    const mapData = loadMap();
    const realURL = mapData[id];
    if (!realURL) return res.status(404).send("Video not found");

    // Serve minimal HTML with ad + iframe
    res.setHeader("Content-Type", "text/html");
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>Player</title></head>
      <body style="margin:0;background:black;">
        <div style="height:60px;background:#222;color:#fff;
                    display:flex;align-items:center;justify-content:center;
                    font-family:sans-serif;">
          <!-- Your Ad Slot Here -->
          🚀 Your Ad Banner
        </div>
        <iframe src="${realURL}" 
                style="width:100%;height:calc(100vh - 60px);border:none;"
                allow="autoplay; encrypted-media" allowfullscreen>
        </iframe>
      </body>
      </html>
    `);

  } catch (err) {
    res.status(500).send(err.message);
  }
}

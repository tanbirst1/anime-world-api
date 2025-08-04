// api/video.js  
export const config = { runtime: "nodejs18.x" };

import crypto from "crypto";

const SECRET = "super_secret_key";  
const KEY = crypto.createHash("sha256").update(SECRET).digest();  
const IV = Buffer.alloc(16, 0);

function decryptSafe(token) {
  try {
    let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, IV);
    let dec = decipher.update(b64, "base64", "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const url = decryptSafe(id);
    res.setHeader("Content-Type", "text/html");
    if (!url) {
      return res.status(400).send(`
        <html><body style="color:white;background:#000;
          display:flex;align-items:center;justify-content:center;
          height:100vh;font-family:sans-serif;">
          <div>❌ Invalid or expired link</div>
        </body></html>`);
    }
    res.send(`
      <html><head>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>body{margin:0;background:#000}iframe{border:0;width:100%;height:100vh;}</style>
      </head>
      <body><iframe src="${url}" allowfullscreen allow="autoplay;encrypted-media"></iframe></body>
      </html>`);
  } catch (err) {
    console.error("VIDEO ERROR:", err);
    res.status(500).send("⚠️ Server Error");
  }
}

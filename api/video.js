import crypto from "crypto";

const SECRET     = "super_secret_key"; // same as above
const SECRET_KEY = crypto.createHash("sha256").update(SECRET).digest();
const IV         = Buffer.alloc(16, 0);

function decryptSafe(token) {
  try {
    let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
    let decrypted = decipher.update(b64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
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
        <!DOCTYPE html>
        <html><body style="margin:0;background:#000;color:#fff;
        display:flex;align-items:center;justify-content:center;height:100vh;
        font-family:sans-serif;">
          <div>❌ Invalid or expired link</div>
        </body></html>`);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Video Player</title>
        <style>
          body { margin:0; background:#000; }
          iframe { border:none; width:100%; height:100vh; }
        </style>
      </head>
      <body>
        <iframe src="${url}" allowfullscreen allow="autoplay;encrypted-media"></iframe>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("VIDEO ERROR:", err);
    res.status(500).send("⚠️ Server Error");
  }
}

// api/video.js
import crypto from "crypto";

const SECRET_KEY = crypto.createHash("sha256").update(process.env.VIDEO_SECRET || "super_secret_key").digest();
const IV = Buffer.alloc(16, 0);

function decrypt(token) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
  let decrypted = decipher.update(decodeURIComponent(token), "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export default function handler(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("Missing token");

    const iframeURL = decrypt(token);

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Player</title></head>
      <body style="margin:0;background:#000">
        <iframe src="${iframeURL}" 
                style="border:none;width:100%;height:100vh;" 
                allowfullscreen allow="autoplay; encrypted-media">
        </iframe>
      </body>
      </html>
    `);
  } catch {
    res.status(500).send("Invalid token or decryption error");
  }
}

// api/video.js
import crypto from "crypto";

const SECRET_KEY = crypto.createHash("sha256").update(process.env.VIDEO_SECRET || "super_secret_key").digest();
const IV = Buffer.alloc(16, 0);

function decrypt(token) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
  let decrypted = decipher.update(token, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id || !global.shortLinks || !global.shortLinks[id]) {
      return res.status(400).send("Invalid link");
    }

    const token = global.shortLinks[id];
    const iframeURL = decrypt(token);

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Player</title>
        <style>
          body { margin:0; background:#000; }
          iframe { border:none; width:100%; height:100vh; }
        </style>
      </head>
      <body>
        <iframe src="${iframeURL}" allowfullscreen allow="autoplay; encrypted-media"></iframe>
      </body>
      </html>
    `);
  } catch {
    res.status(500).send("Decryption error");
  }
}

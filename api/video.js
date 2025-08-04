// api/video.js
import crypto from "crypto";

const SECRET_KEY = process.env.VIDEO_SECRET || "my_super_secret_key_123456"; // Same as above
const IV = Buffer.alloc(16, 0);

function decrypt(token) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(SECRET_KEY.padEnd(32)), IV);
  let decrypted = decipher.update(decodeURIComponent(token), "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export default async function handler(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("Missing token");

    const url = decrypt(token);

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Player</title></head>
      <body style="margin:0">
        <iframe src="${url}" style="border:none;width:100%;height:100vh;" allowfullscreen></iframe>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Invalid or expired token");
  }
}

// api/video.js
import crypto from "crypto";

const SECRET_KEY = crypto.createHash("sha256").update(process.env.VIDEO_SECRET || "super_secret_key").digest();
const IV = Buffer.alloc(16, 0);

// Base58 alphabet (shorter + URL safe)
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58encode(buffer) {
  let num = BigInt("0x" + buffer.toString("hex"));
  let encoded = "";
  while (num > 0) {
    let remainder = Number(num % 58n);
    num = num / 58n;
    encoded = ALPHABET[remainder] + encoded;
  }
  return encoded;
}

function base58decode(str) {
  let num = 0n;
  for (const char of str) {
    num = num * 58n + BigInt(ALPHABET.indexOf(char));
  }
  let hex = num.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  return Buffer.from(hex, "hex");
}

function encryptURL(url) {
  const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, IV);
  let encrypted = Buffer.concat([cipher.update(url, "utf8"), cipher.final()]);
  return base58encode(encrypted);
}

function decryptToken(token) {
  try {
    const encrypted = base58decode(token);
    const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
    let decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export default function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing token");

  const iframeURL = decryptToken(id);
  if (!iframeURL) return res.status(400).send("Invalid token");

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>html,body{margin:0;padding:0;height:100%;background:#000}iframe{width:100%;height:100%;border:none}</style>
    </head>
    <body>
      <iframe src="${iframeURL}" allowfullscreen allow="autoplay; encrypted-media"></iframe>
    </body>
    </html>
  `);
}

export { encryptURL }; // Export so movies API can use it      <body>
        <iframe src="${iframeURL}" allowfullscreen allow="autoplay; encrypted-media"></iframe>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Server Error");
  }
}

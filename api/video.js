import crypto from "crypto";

const SECRET = "super_secret_key";
const SECRET_KEY = crypto.createHash("sha256").update(SECRET).digest();
const IV = Buffer.alloc(16, 0);

function decryptShort(token) {
  token = token.replace(/-/g, "+").replace(/_/g, "/");
  const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
  let decrypted = decipher.update(token, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Invalid token");

    const iframeURL = decryptShort(id);

    res.setHeader("Content-Type", "text/html");
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
        <iframe src="${iframeURL}" allowfullscreen></iframe>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Invalid or expired link");
  }
}      </html>
    `);
  } catch (err) {
    res.status(500).send("Invalid or expired link");
  }
}

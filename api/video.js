import crypto from "crypto";

const SECRET_KEY = crypto.createHash("sha256")
  .update(process.env.VIDEO_SECRET || "super_secret_key")
  .digest();
const IV = Buffer.alloc(16, 0);

function safeDecrypt(token) {
  try {
    if (!token || typeof token !== "string") return null;
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
    let decrypted = decipher.update(base64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return null; // Never crash
  }
}

export default function handler(req, res) {
  try {
    const { id } = req.query;

    // Debug if id missing
    if (!id) {
      res.status(400).send(`
        <h2 style="color:white;background:black;text-align:center;padding:20px">
          Missing or invalid token<br>ID Param: ${JSON.stringify(req.query)}
        </h2>
      `);
      return;
    }

    const realURL = safeDecrypt(id);
    if (!realURL) {
      res.status(400).send(`
        <h2 style="color:white;background:black;text-align:center;padding:20px">
          Failed to decrypt token
        </h2>
      `);
      return;
    }

    // Return iframe with blob (hidden real URL)
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <style>
          html,body { margin:0; padding:0; height:100%; background:#000; }
          iframe { width:100%; height:100%; border:none; }
        </style>
      </head>
      <body>
        <iframe id="player" allowfullscreen allow="autoplay; encrypted-media"></iframe>
        <script>
          (async () => {
            try {
              const blobData = await fetch("${realURL}").then(r => r.blob());
              const blobURL = URL.createObjectURL(blobData);
              document.getElementById("player").src = blobURL;
            } catch (e) {
              document.body.innerHTML = "<h2 style='color:white;text-align:center;'>Video load failed</h2>";
            }
          })();
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    // Catch any unexpected crash
    res.status(500).send(`
      <h2 style="color:white;background:black;text-align:center;padding:20px">
        Internal Server Error
      </h2>
    `);
  }
}

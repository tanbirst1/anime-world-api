import crypto from "crypto";

const SECRET_KEY = crypto.createHash("sha256")
  .update(process.env.VIDEO_SECRET || "super_secret_key")
  .digest();
const IV = Buffer.alloc(16, 0);

// Decrypt Base64URL safely
function decrypt(token) {
  try {
    if (!token) return null;
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
    let decrypted = decipher.update(base64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return null; // Prevent crash
  }
}

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing token");

    const iframeURL = decrypt(id);
    if (!iframeURL) return res.status(400).send("Invalid token");

    // Hide iframe src (load dynamically with JS)
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
        <div id="player" style="width:100%;height:100%"></div>
        <script>
          // Load iframe only after DOM ready
          document.addEventListener("DOMContentLoaded", function(){
            const iframe = document.createElement("iframe");
            iframe.src = atob("${Buffer.from(iframeURL).toString("base64")}");
            iframe.allowFullscreen = true;
            iframe.allow = "autoplay; encrypted-media";
            document.getElementById("player").appendChild(iframe);
          });
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Server Error");
  }
}    <body>
      <iframe src="${iframeURL}" allowfullscreen allow="autoplay; encrypted-media"></iframe>
    </body>
    </html>
  `);
}
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

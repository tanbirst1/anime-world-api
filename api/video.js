// api/video.js
import crypto from "crypto";

const SECRET_KEY = crypto.createHash("sha256").update(process.env.VIDEO_SECRET || "super_secret_key").digest();
const IV = Buffer.alloc(16, 0);

// Safe base64url decode
function decrypt(token) {
try {
let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
while (base64.length % 4) base64 += "=";
const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
let decrypted = decipher.update(base64, "base64", "utf8");
decrypted += decipher.final("utf8");
return decrypted;
} catch (err) {
return null; // Instead of crash
}
}

export default function handler(req, res) {
try {
const { id } = req.query;
if (!id) return res.status(400).send("Invalid or missing token");

const iframeURL = decrypt(id);  
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

} catch (err) {
res.status(500).send("Server Error");
}
}

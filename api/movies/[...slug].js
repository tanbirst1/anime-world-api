export default function handler(req, res) {
  const slugPath = req.query.slug; 
  const slug = Array.isArray(slugPath) ? slugPath.join('/') : slugPath;

  if (!slug) {
    return res.status(400).json({ error: "Slug missing" });
  }

  res.status(200).json({
    status: "ok",
    slug,
    message: "Dynamic route works perfectly"
  });
}

export default function handler(req, res) {
  try {
    const { slug } = req.query;
    res.status(200).json({ status: "ok", type: "movies", slug: slug || "no-slug" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

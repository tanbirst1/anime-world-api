export default async function handler(req, res) {
  try {
    // slug now comes from ?slug=$1
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Missing movie slug" });
    }
    // Simply echo back
    return res.status(200).json({
      status: "ok",
      type: "movie",
      slug
    });
  } catch (err) {
    console.error("MOVIES HANDLER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}

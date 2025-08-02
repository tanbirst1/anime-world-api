module.exports = async (req, res) => {
  try {
    const slug = req.query.slug || req.url.split("/").pop();
    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    // Just return test response
    return res.status(200).json({
      message: "Movies API is working ✅",
      slug: slug
    });
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

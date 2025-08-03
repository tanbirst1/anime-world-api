export default async function handler(req, res) {
  const { slug } = req.query;
  return res.status(200).json({
    status: "ok",
    type: "movie",
    slug: slug || "no-slug"
  });
}

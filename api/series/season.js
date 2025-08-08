import { getSeasonData } from "./[slug].js";

export default async function handler(req, res) {
  const season = parseInt(req.query.season || "1");
  return getSeasonData(req, res, season);
}

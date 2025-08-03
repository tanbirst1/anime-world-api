import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const response = await fetch("https://watchanimeworld.in/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114 Safari/537.36"
      }
    });

    if (!response.ok) {
      return res.status(500).json({ success: false, status: response.status });
    }

    // Test OK
    res.status(200).json({ success: true, test: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

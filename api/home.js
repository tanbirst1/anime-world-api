export const config = {
  runtime: "edge", // Runs at edge for speed
};

export default async function handler(req) {
  try {
    const siteRes = await fetch("https://watchanimeworld.in/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
    });

    if (!siteRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch homepage" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const html = await siteRes.text();

    // Extract anime cards
    const animeCards = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]+title="([^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"/g)]
      .map(m => ({
        title: m[2],
        link: m[1].startsWith("http") ? m[1] : `https://watchanimeworld.in${m[1]}`,
        image: m[3]
      }));

    return new Response(JSON.stringify({ home: animeCards }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

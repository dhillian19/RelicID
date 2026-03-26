export const maxDuration = 30;

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return Response.json({ error: { message: "API key not configured" } }, { status: 500 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model || "claude-sonnet-4-20250514",
        max_tokens: body.max_tokens || 1500,
        messages: body.messages,
      }),
    });

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    console.error("[RelicID API] Scan error:", err);
    return Response.json({ error: { message: "Server error: " + err.message } }, { status: 500 });
  }
}

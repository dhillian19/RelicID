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
        max_tokens: Math.min(body.max_tokens || 1000, 1000),
        messages: body.messages,
      }),
    });

    const data = await res.json();

    // ─── COST LOGGING ─────────────────────────────────
    if (data.usage) {
      const input = data.usage.input_tokens || 0;
      const output = data.usage.output_tokens || 0;
      const inputCost = (input / 1000000) * 3;
      const outputCost = (output / 1000000) * 15;
      const totalCost = inputCost + outputCost;
      console.log(`[RelicID Quick Scan] Tokens: ${input} in / ${output} out | Cost: $${totalCost.toFixed(4)}`);
    }

    return Response.json(data);
  } catch (err) {
    console.error("[RelicID API] Scan error:", err);
    return Response.json({ error: { message: "Server error: " + err.message } }, { status: 500 });
  }
}

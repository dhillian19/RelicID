export const maxDuration = 60;

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
        max_tokens: Math.min(body.max_tokens || 2048, 2048),
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: body.messages,
      }),
    });

    const data = await res.json();

    // ─── COST LOGGING ─────────────────────────────────
    if (data.usage) {
      const input = data.usage.input_tokens || 0;
      const output = data.usage.output_tokens || 0;
      const searchCount = (data.content || []).filter(b => b.type === "web_search_tool_result").length;
      const inputCost = (input / 1000000) * 3;
      const outputCost = (output / 1000000) * 15;
      const searchCost = searchCount * 0.01;
      const totalCost = inputCost + outputCost + searchCost;
      console.log(`[RelicID Deep Scan] Tokens: ${input} in / ${output} out | Searches: ${searchCount} | Cost: $${totalCost.toFixed(4)} (input: $${inputCost.toFixed(4)}, output: $${outputCost.toFixed(4)}, search: $${searchCost.toFixed(4)})`);
    }

    return Response.json(data);
  } catch (err) {
    console.error("[RelicID API] Deep scan error:", err);
    return Response.json({ error: { message: "Server error: " + err.message } }, { status: 500 });
  }
}

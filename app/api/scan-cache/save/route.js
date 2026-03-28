export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export async function POST(request) {
  try {
    const { cache_key, item_name, category, valuation, confidence_percent } = await request.json();

    if (!cache_key || !item_name || !valuation) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Only cache high confidence results
    if (confidence_percent && confidence_percent < 75) {
      return Response.json({ skipped: true, reason: "Low confidence" });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/scan_cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        cache_key,
        item_name,
        category: category || "Other",
        valuation: JSON.stringify(valuation),
        confidence_percent: confidence_percent || 80,
        last_updated: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[RelicID Cache Save] Error:", err);
      return Response.json({ error: "Failed to save" }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error("[RelicID Cache Save] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

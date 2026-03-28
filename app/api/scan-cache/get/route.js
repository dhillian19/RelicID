export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const CACHE_TTL_DAYS = 30;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) return Response.json({ found: false });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CACHE_TTL_DAYS);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/scan_cache?cache_key=eq.${encodeURIComponent(key)}&last_updated=gte.${cutoff.toISOString()}&select=*`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!res.ok) return Response.json({ found: false });

    const data = await res.json();
    if (!data || data.length === 0) return Response.json({ found: false });

    const row = data[0];

    // Increment scan_count
    await fetch(`${SUPABASE_URL}/rest/v1/scan_cache?cache_key=eq.${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ scan_count: (row.scan_count || 1) + 1 }),
    });

    return Response.json({
      found: true,
      valuation: typeof row.valuation === "string" ? JSON.parse(row.valuation) : row.valuation,
      item_name: row.item_name,
      category: row.category,
      scan_count: row.scan_count,
      last_updated: row.last_updated,
    });

  } catch (err) {
    console.error("[RelicID Cache Get] Error:", err.message);
    return Response.json({ found: false });
  }
}

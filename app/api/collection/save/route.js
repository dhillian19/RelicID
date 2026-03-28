export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export async function POST(request) {
  try {
    const { pin, items } = await request.json();
    if (!pin || !items) {
      return Response.json({ error: "Missing pin or items" }, { status: 400 });
    }
    if (!/^\d{4}$/.test(pin)) {
      return Response.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/collections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        pin,
        items: JSON.stringify(items),
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[RelicID Save] Supabase error:", err);
      return Response.json({ error: "Failed to save" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("[RelicID Save] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

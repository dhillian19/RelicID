export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get("pin");

    if (!pin) {
      return Response.json({ error: "Missing pin" }, { status: 400 });
    }
    if (!/^\d{4}$/.test(pin)) {
      return Response.json({ error: "Invalid PIN format" }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/collections?pin=eq.${pin}&select=items`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[RelicID Load] Supabase error:", err);
      return Response.json({ error: "Failed to load" }, { status: 500 });
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      return Response.json({ found: false });
    }

    const items = typeof data[0].items === "string"
      ? JSON.parse(data[0].items)
      : data[0].items;

    return Response.json({ found: true, items });
  } catch (err) {
    console.error("[RelicID Load] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

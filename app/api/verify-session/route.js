import Stripe from "stripe";

// ─── PLAN CONFIG ──────────────────────────────────────────
const PLANS = {
  ds15: { scans: 15, label: "15 Deep Scans" },
  ds30: { scans: 30, label: "30 Deep Scans" },
  ds60: { scans: 60, label: "60 Deep Scans" },
};

export async function POST(request) {
  try {
    const { planId } = await request.json();
    const plan = PLANS[planId];
    if (!plan) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Determine environment
    const mode = process.env.STRIPE_MODE || "test";
    const secretKey = mode === "live"
      ? process.env.STRIPE_LIVE_SECRET_KEY
      : process.env.STRIPE_TEST_SECRET_KEY;

    if (!secretKey) {
      console.error(`[RelicID Checkout] Missing STRIPE_${mode.toUpperCase()}_SECRET_KEY`);
      return Response.json({ error: "Payment not configured" }, { status: 500 });
    }

    // Get the correct price ID for this plan + environment
    const priceKey = `STRIPE_PRICE_${planId.toUpperCase()}_${mode.toUpperCase()}`;
    const priceId = process.env[priceKey];

    if (!priceId) {
      console.error(`[RelicID Checkout] Missing env var: ${priceKey}`);
      return Response.json({ error: "Price not configured" }, { status: 500 });
    }

    console.log(`[RelicID Checkout] Mode: ${mode} | Plan: ${planId} | Price: ${priceId}`);

    const stripe = new Stripe(secretKey);

    // Determine base URL for redirects
    const origin = request.headers.get("origin") || "https://getrelicid.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/scan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/scan`,
      metadata: {
        plan_id: planId,
        scans: String(plan.scans),
      },
    });

    console.log(`[RelicID Checkout] Session created: ${session.id}`);
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[RelicID Checkout] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import Stripe from "stripe";

const PLANS = {
  ds15: { scans: 15, priceAmount: 299 },
  ds30: { scans: 30, priceAmount: 499 },
  ds60: { scans: 60, priceAmount: 999 },
};

export async function POST(request) {
  try {
    const { planId } = await request.json();

    if (!planId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    const mode = process.env.STRIPE_MODE || "test";
    const secretKey = mode === "live"
      ? process.env.STRIPE_LIVE_SECRET_KEY
      : process.env.STRIPE_TEST_SECRET_KEY;

    if (!secretKey) {
      return Response.json({ error: "Payment not configured" }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://getrelicid.com";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.priceAmount,
            product_data: {
              name: `RelicID — ${plan.scans} Deep Scans`,
              description: `${plan.scans} deep scan credits for RelicID`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan_id: planId,
        scans: String(plan.scans),
      },
      success_url: `${baseUrl}/scan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/scan?cancelled=true`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[RelicID Checkout] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

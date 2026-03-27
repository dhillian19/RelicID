import Stripe from "stripe";

export async function POST(request) {
  try {
    const { planId, scans, priceAmount } = await request.json();

    if (!planId || !scans || !priceAmount) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const mode = process.env.STRIPE_MODE || "test";
    const secretKey = mode === "live"
      ? process.env.STRIPE_LIVE_SECRET_KEY
      : process.env.STRIPE_TEST_SECRET_KEY;

    if (!secretKey) {
      return Response.json({ error: "Payment not configured" }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: priceAmount, // in cents, e.g. 499 for $4.99
            product_data: {
              name: `RelicID - ${planId}`,
              description: `${scans} deep scan credits`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan_id: planId,
        scans: String(scans),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/scan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/scan?cancelled=true`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[RelicID Checkout] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import Stripe from "stripe";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return Response.json({ error: "Missing session_id" }, { status: 400 });
    }

    // Determine environment
    const mode = process.env.STRIPE_MODE || "test";
    const secretKey = mode === "live"
      ? process.env.STRIPE_LIVE_SECRET_KEY
      : process.env.STRIPE_TEST_SECRET_KEY;

    if (!secretKey) {
      return Response.json({ error: "Payment not configured" }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log(`[RelicID Verify] Session ${sessionId} | Status: ${session.payment_status} | Plan: ${session.metadata?.plan_id}`);

    if (session.payment_status !== "paid") {
      return Response.json({ error: "Payment not completed", status: session.payment_status }, { status: 402 });
    }

    const scans = parseInt(session.metadata?.scans) || 0;
    const planId = session.metadata?.plan_id || "unknown";

    if (scans <= 0) {
      return Response.json({ error: "Invalid session metadata" }, { status: 400 });
    }

    return Response.json({
      verified: true,
      scans,
      planId,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("[RelicID Verify] Error:", err.message);
    // Handle invalid session IDs gracefully
    if (err.type === "StripeInvalidRequestError") {
      return Response.json({ error: "Invalid session" }, { status: 400 });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
}

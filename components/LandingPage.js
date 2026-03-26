"use client";

import { useEffect, useRef } from "react";

// ─── DESIGN SYSTEM (matches the app) ─────────────────────
const C = {
  bg: "#0f0e0b", bgSurface: "#1a1814", bgCard: "#222019",
  accent: "#c9a555", accentDim: "#8b7234", accentGlow: "rgba(201,165,85,0.12)",
  text: "#ece4d4", textDim: "#a89e8c", textMuted: "#6b6354",
  border: "#302b22", borderLight: "#403a2e",
  buy: "#4ade80", pass: "#ef4444",
};
const F = {
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'Nunito Sans', 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ─── SCROLL OBSERVER ─────────────────────────────────────
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(".reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ─── COMPONENTS ──────────────────────────────────────────

function Nav() {
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1100, margin: "0 auto", padding: "24px 28px" }}>
      <a href="/" style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, background: `linear-gradient(135deg, ${C.accent}, #e8d5a0, ${C.accentDim})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none" }}>
        RelicID
      </a>
      <a href="/scan" style={{ padding: "10px 24px", borderRadius: 8, fontFamily: F.body, fontSize: 14, fontWeight: 600, textDecoration: "none", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", letterSpacing: 0.3, transition: "transform 0.2s" }}>
        Open App
      </a>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 28px 60px", textAlign: "center" }}>
      <div className="reveal" style={{ display: "inline-block", fontFamily: F.mono, fontSize: 11, color: C.accent, padding: "6px 16px", borderRadius: 20, border: "1px solid rgba(201,165,85,0.25)", background: C.accentGlow, letterSpacing: 2, textTransform: "uppercase", marginBottom: 28 }}>
        AI-Powered Value Scanner
      </div>
      <h1 className="reveal" style={{ fontFamily: F.display, fontWeight: 700, lineHeight: 1.05, fontSize: "clamp(42px, 7vw, 76px)", marginBottom: 20, background: `linear-gradient(135deg, ${C.text}, #e8d5a0, ${C.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        Scan anything.<br/>See what it's worth.
      </h1>
      <p className="reveal" style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: C.textDim, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.6, fontWeight: 300 }}>
        Point your camera at any item and instantly get an ID, real market value, and a clear BUY or PASS recommendation.
      </p>
      <div className="reveal" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/scan" style={{ padding: "16px 40px", borderRadius: 10, fontFamily: F.display, fontSize: 18, fontWeight: 600, textDecoration: "none", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", letterSpacing: 0.5, transition: "transform 0.2s, box-shadow 0.2s" }}>
          Start Scanning — Free
        </a>
        <a href="#how" style={{ padding: "16px 32px", borderRadius: 10, fontFamily: F.body, fontSize: 15, fontWeight: 600, textDecoration: "none", background: "transparent", color: C.accent, border: "1px solid rgba(201,165,85,0.3)", transition: "all 0.2s" }}>
          See How It Works
        </a>
      </div>
      <div className="reveal" style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", maxWidth: 700, margin: "48px auto 0", paddingTop: 32, borderTop: `1px solid ${C.border}` }}>
        {[
          { num: "3", label: "Free scans per day" },
          { num: "<10s", label: "Instant identification" },
          { num: "Live", label: "Real sold prices" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: C.accent }}>{s.num}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: "📸", title: "Snap a Photo", desc: "Take a photo of anything — a thrift store find, a trading card, a pair of shoes, something you're curious about." },
    { icon: "⚡", title: "Get an Instant ID", desc: "RelicID identifies the exact item, assesses condition, and gives you a quick value estimate — all in seconds." },
    { icon: "💰", title: "Know If It's a Deal", desc: "Run a Deep Scan to pull real sold prices. Enter what they're asking and get a clear BUY or PASS with flip profit calculated." },
  ];
  return (
    <section id="how" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 28px" }}>
      <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.accent, marginBottom: 12, textAlign: "center" }}>How It Works</div>
      <h2 style={{ fontFamily: F.display, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: C.text, marginBottom: 48, textAlign: "center" }}>Three steps. Real answers.</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {steps.map((s, i) => (
          <div key={i} className="reveal" style={{ padding: "32px 28px", background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, position: "relative", transition: "border-color 0.3s, transform 0.3s" }}>
            <div style={{ fontFamily: F.display, fontSize: 48, fontWeight: 700, color: "rgba(201,165,85,0.12)", position: "absolute", top: 16, right: 24, lineHeight: 1 }}>{i + 1}</div>
            <div style={{ fontSize: 28, marginBottom: 16 }}>{s.icon}</div>
            <h3 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 8 }}>{s.title}</h3>
            <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.6 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    { icon: "🛒", title: "Thrift Stores", desc: "Spot underpriced gems hiding on the shelves" },
    { icon: "🏷️", title: "Garage Sales", desc: "Know what something's worth before you haggle" },
    { icon: "🃏", title: "Trading Cards", desc: "ID the exact card, set, and edition in seconds" },
    { icon: "👟", title: "Sneakers & Clothes", desc: "Check resale value on brands and styles" },
    { icon: "📦", title: "Marketplace Finds", desc: "Verify if that listing is actually a good deal" },
    { icon: "🏺", title: "Vintage & Collectibles", desc: "From vinyl to ceramics — find what it's really worth" },
    { icon: "🔌", title: "Electronics", desc: "Old consoles, cameras, tools — they might surprise you" },
    { icon: "❓", title: "Random Stuff", desc: "No idea what it is? Scan it anyway." },
  ];
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 80px" }}>
      <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.accent, marginBottom: 12, textAlign: "center" }}>Works On Everything</div>
      <h2 style={{ fontFamily: F.display, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: C.text, marginBottom: 48, textAlign: "center" }}>Scan it. Price it. Decide.</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {cases.map((c, i) => (
          <div key={i} className="reveal" style={{ padding: 20, background: C.bgSurface, borderRadius: 10, border: `1px solid ${C.border}`, textAlign: "center", transition: "border-color 0.3s, background 0.3s" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VerdictDemo() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 28px 80px" }}>
      <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.accent, marginBottom: 12, textAlign: "center" }}>The Verdict</div>
      <h2 style={{ fontFamily: F.display, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: C.text, marginBottom: 48, textAlign: "center" }}>Stop guessing. Start knowing.</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "center" }}>
        {/* BUY */}
        <div className="reveal" style={{ padding: 32, borderRadius: 16, textAlign: "center", background: "rgba(74,222,128,0.06)", border: "2px solid rgba(74,222,128,0.25)" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", margin: "0 auto 12px", background: C.buy, boxShadow: "0 0 20px rgba(74,222,128,0.4)" }} />
          <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, letterSpacing: 3, color: C.buy }}>BUY</div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 6 }}>Good deal — potential profit ahead</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: "You Pay", val: "$20" },
              { label: "Market Value", val: "$85" },
              { label: "Flip Profit", val: "+$65" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "8px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.buy }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
        {/* PASS */}
        <div className="reveal" style={{ padding: 32, borderRadius: 16, textAlign: "center", background: "rgba(239,68,68,0.06)", border: "2px solid rgba(239,68,68,0.25)" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", margin: "0 auto 12px", background: C.pass, boxShadow: "0 0 20px rgba(239,68,68,0.4)" }} />
          <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, letterSpacing: 3, color: C.pass }}>PASS</div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 6 }}>Overpriced — you'd likely lose money</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: "They Want", val: "$120" },
              { label: "Market Value", val: "$45" },
              { label: "You'd Lose", val: "-$75" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "8px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.pass }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const reasons = [
    { title: "Real prices, not guesses", desc: "Deep Scan pulls actual sold listings from eBay, TCGPlayer, and resale platforms. You see what people actually paid — not what some random seller is hoping for." },
    { title: "Works on almost anything", desc: "Trading cards, sneakers, vintage toys, power tools, designer bags, random kitchen gadgets. If it exists, RelicID can probably tell you what it's worth." },
    { title: "Built for fast decisions", desc: "You're standing in a thrift store. Someone else is eyeing the same thing. RelicID gives you the answer in seconds so you can move with confidence." },
    { title: "Condition-aware pricing", desc: "A mint-condition item and a beat-up one aren't worth the same. RelicID reads condition from your photos and adjusts the valuation accordingly." },
  ];
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 28px 80px" }}>
      <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.accent, marginBottom: 12, textAlign: "center" }}>Why RelicID</div>
      <h2 style={{ fontFamily: F.display, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: C.text, marginBottom: 48, textAlign: "center" }}>Your unfair advantage at every sale.</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        {reasons.map((r, i) => (
          <div key={i} className="reveal" style={{ padding: "28px 24px", background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, color: C.accent, marginBottom: 8 }}>{r.title}</h3>
            <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.65 }}>{r.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 28px 100px", textAlign: "center" }}>
      <div style={{ padding: "60px 40px", borderRadius: 20, background: `linear-gradient(135deg, ${C.accentGlow}, ${C.bgCard}, ${C.accentGlow})`, border: "1px solid rgba(201,165,85,0.2)" }}>
        <h2 style={{ fontFamily: F.display, fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, color: C.text, marginBottom: 12 }}>
          Next time you see something interesting — scan it.
        </h2>
        <p style={{ fontSize: 16, color: C.textDim, maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Three free scans a day. No account required. Just point, shoot, and find out what it's worth.
        </p>
        <a href="/scan" style={{ display: "inline-block", padding: "16px 40px", borderRadius: 10, fontFamily: F.display, fontSize: 18, fontWeight: 600, textDecoration: "none", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", letterSpacing: 0.5 }}>
          Try RelicID Free
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 28px 40px", borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
      <p style={{ fontSize: 11, color: C.textMuted }}>RelicID · AI-powered identification & valuation · Not financial advice · getrelicid.com</p>
    </footer>
  );
}

// ─── MAIN LANDING PAGE ───────────────────────────────────
export default function LandingPage() {
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body }}>
      <style>{`
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal { opacity: 0; transform: translateY(24px); transition: none; }
        .revealed { animation: revealUp 0.5s ease forwards; }

        /* Hover effects via CSS */
        a[href="/scan"]:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(201,165,85,0.3); }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 600px 400px at 20% 10%, rgba(201,165,85,0.07) 0%, transparent 70%), radial-gradient(ellipse 500px 500px at 80% 60%, rgba(201,165,85,0.04) 0%, transparent 70%)" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Nav />
        <Hero />
        <HowItWorks />
        <UseCases />
        <VerdictDemo />
        <WhySection />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ─── PROMPTS ───────────────────────────────────────────────
// LIGHT prompt — quick ID + basic value estimate (1 API call, no web search)
const LIGHT_PROMPT = (photoCount) => `You are an expert product identifier and valuation specialist. Your job is to identify ${photoCount > 1 ? "these items" : "this item"}, determine what it is, and estimate value — but ONLY after classifying what you're actually looking at.

═══ STEP 1: CLASSIFY WHAT YOU SEE ═══
Before identifying anything, determine the OBJECT TYPE:

• "Physical Object" — a real 3D item (toy, shoe, card, tool, device, clothing, etc.)
• "Printed Media" — a poster, art print, playmat, book cover, photograph of a flat printed item
• "Screen Capture" — a photo of a phone screen, monitor, TV, or digital display
• "Packaging Only" — just a box, wrapper, or container with no visible item inside

Use these signals:
FLAT / PRINTED indicators: uniform flat surface, consistent lighting across entire image, no true depth separation, printed textures or pixelation, visible paper/canvas edges, perspective distortion consistent with a flat plane.
REAL 3D OBJECT indicators: visible depth and layering, shadows cast between objects, irregular lighting, perspective changes, physical wear patterns (not printed wear).
SCREEN indicators: visible pixels, screen glare, device bezels, backlit glow, moire patterns.

If you are NOT confident about the object type, say so. "Appears to be" and "may be" are always better than a wrong confident call.

═══ STEP 2: IDENTIFY & VALUE (conditional) ═══
Your behavior depends on the object type:

IF Physical Object → proceed with full identification. Be as specific as possible:
- For trading cards: EXACT card name, set, card number, edition, language, holo status
- For branded items: brand, exact model/product name, colorway, size if visible, release year
- For vintage/older items: maker marks, stamps, signatures, patent numbers
- For condition: note whether graded/slabbed or raw/ungraded/loose — this dramatically affects value
- For HANDMADE / CUSTOM / ONE-OF-A-KIND items (cross-stitch, paintings, custom builds, hand-sewn, woodwork, pottery without maker marks, fan art, custom jewelry, etc.): these will NOT have exact matches on the market. Instead:
  • Identify the MEDIUM (cross-stitch, oil painting, woodworking, etc.)
  • Estimate SIZE if possible from context clues
  • Identify the SUBJECT MATTER (video game, sports, portrait, etc.)
  • Note the level of DETAIL and CRAFTSMANSHIP
  • Set is_unique to true
  • Build search_query around COMPARABLE pieces, not exact matches (e.g. "large completed cross stitch video game pixel art sold" or "handmade WWF wrestling wall art sold")

IF Printed Media → describe what is depicted, identify the type (poster, art print, playmat, promotional material), note any value it may have as printed media. Do NOT treat it as the physical item it depicts.

IF Screen Capture → note this is a photo of a screen, BUT still identify and value the item SHOWN on the screen as if you were looking at the real thing. Users often screenshot marketplace listings or social media posts to check value before buying. Identify the depicted item as specifically as possible, estimate its value, but set confidence_percent lower (40-60) since you can't verify condition or authenticity from a screenshot. Add a note in object_type_note explaining what detail is lost (e.g. "Cannot assess true condition, color accuracy, or authenticity from a screenshot").

IF Packaging Only → identify the product from the packaging, but note that the actual item is not visible. Value should reflect "sealed/boxed" pricing if applicable, or note that contents cannot be verified.

CRITICAL RULES:
- Your #1 job is PRECISE IDENTIFICATION. Find the EXACT product: model number, set name, card number, edition, version, SKU, ISBN, year of release.
- Only name a specific pattern, motif, or symbol if you are 100% certain. If there is ANY doubt, describe what you physically see instead.
- NEVER speculate about religious motifs or culturally sensitive imagery.
- Be honest about what you CAN'T determine. "Cannot confirm from photos" is better than a wrong guess.
${photoCount > 1 ? "- Consider ALL photos together." : ""}

Respond ONLY with this JSON (no markdown, no backticks):
{
  "object_type": "One of: Physical Object, Printed Media, Screen Capture, Packaging Only",
  "object_type_confidence": "High, Medium, or Low",
  "object_type_note": "Brief explanation if confidence is not High, or if there's ambiguity. null if straightforward.",
  "item_name": "Most specific name possible. For cards: 'Venusaur 15/102 Base Set Unlimited Holo'. For shoes: 'Nike Air Jordan 1 Retro High OG Chicago 2015'. For vintage items: 'Roseville Pottery Pinecone Vase 712-10 Brown'. For printed media: 'Poster depicting [subject]'. For screen captures: name the DEPICTED ITEM, not the screenshot itself (e.g. 'WWF Wrestling Challenge Arcade Cabinet' not 'Screenshot of WWF game'). Always include identifying numbers/editions when visible.",
  "category": "One of: Furniture, Pottery/Porcelain, Glassware, Coins/Currency, Jewelry/Metals, Toys/Games, Art/Prints, Textiles, Books/Ephemera, Tools/Instruments, Clothing/Accessories, Electronics, Trading Cards, Sneakers/Footwear, Other",
  "estimated_era": "Date range or specific year",
  "style_period": "Style, period, set name, or product line",
  "likely_origin": "Country or region",
  "maker": "Brand or maker. Only name specific maker if confirmed by visible marks. Otherwise: 'Unconfirmed — possible: [X, Y, Z].'",
  "materials": ["materials"],
  "condition_notes": "Observable condition. State if graded/slabbed or raw/ungraded. Note specific flaws. For non-physical items, describe the media condition.",
  "condition_grade": "One of: Mint, Near Mint, Excellent, Very Good, Good, Fair, Poor — or 'Graded [grade]' if in a grading slab. null if not a physical object.",
  "key_features": ["Specific identifying details you can see — card numbers, set symbols, edition stamps, maker marks, model numbers, serial numbers, signatures, tags, labels"],
  "search_query": "The most effective search query to find this item's market value. For mass-produced items: be specific with brand, model, set, number, edition. For handmade/unique items: search for COMPARABLE pieces by medium + subject + size (e.g. 'large completed cross stitch pixel art video game sold' or 'handmade wrestling fan art framed sold'). For printed media: search for the print/poster specifically.",
  "is_unique": false,
  "confidence_percent": 75,
  "description": "2-3 sentence summary. Lead with object type if it's NOT a straightforward physical object. Then the specific identification, condition, and notable features.",
  "low_estimate": 20,
  "high_estimate": 100,
  "demand_level": "High, Medium, or Low",
  "sell_speed": "Fast, Moderate, or Slow",
  "market_trend": "Rising, Stable, or Declining"
}

IMPORTANT: low_estimate and high_estimate are plain numbers. confidence_percent is a number 0-100. For screen captures, estimate the value of the DEPICTED ITEM but use a wider range to reflect uncertainty. Be as specific as humanly possible in item_name and search_query — vague descriptions produce bad valuations.`;

// DEEP prompt — full valuation with web search (expensive, only on demand)
const DEEP_PROMPT = (info) => `You are a market valuation researcher. Search for recent SOLD prices and current listings for this ${info.is_unique ? "type of item" : "specific item"}.

Item: ${info.item_name}
Object Type: ${info.object_type || "Physical Object"}
${info.is_unique ? "⚠️ UNIQUE / HANDMADE ITEM — no exact match will exist. Search for COMPARABLE pieces.\n" : ""}Era: ${info.estimated_era}
Style/Set: ${info.style_period}
Origin: ${info.likely_origin}
Maker/Brand: ${info.maker}
Category: ${info.category}
Condition: ${info.condition_notes || "Unknown"}
${info.condition_grade ? `Condition Grade: ${info.condition_grade}` : ""}
${info.search_query ? `Suggested Search: ${info.search_query}` : ""}

CRITICAL SEARCH RULES:
1. Use the Suggested Search query as your starting point. If it's specific (includes model numbers, set names, card numbers), search for that EXACT item.
2. Search for SOLD/COMPLETED listings, not just active listings. Sold prices are real market data. Active listings are just asking prices.
3. Match the item's condition when pulling comps. If the item is raw/ungraded, prioritize raw/ungraded sold prices. Do NOT mix graded prices (PSA 8, BGS 9, etc.) with raw prices — they are completely different markets.
4. For each sale you report, include the SOURCE URL from your search results. This is critical — users need to verify the data.
5. If you find conflicting prices, weight recent sold prices over active listings, and condition-matched comps over mismatched ones.
6. If the Object Type is "Printed Media", search for the print/poster/media itself — NOT the physical item it depicts. A poster of a toy is worth poster prices, not toy prices.
7. If the Object Type is "Packaging Only", search for sealed/boxed pricing if applicable, and note that contents cannot be verified.
8. If the Object Type is "Screen Capture", search for the DEPICTED ITEM as if it were a physical object. The user is checking value before buying. Note in your response that condition cannot be confirmed from a screenshot.
9. FOR UNIQUE / HANDMADE ITEMS: There will be NO exact match. Do NOT give up or return empty results. Instead:
   a. Search for comparable pieces by MEDIUM (e.g. "completed cross stitch", "handmade oil painting", "custom woodwork")
   b. Add the SUBJECT MATTER to narrow results (e.g. "video game cross stitch", "wrestling fan art")
   c. Factor in SIZE — larger handmade pieces command higher prices
   d. Factor in DETAIL LEVEL — highly detailed work with many colors/stitches is worth more
   e. Search Etsy, eBay, and craft marketplaces for comparable sold pieces
   f. Try multiple searches: one for the medium + subject, one for the medium + size, one broader if needed
   g. In recent_sales, label comps clearly as "Comparable piece" not "Same item"
   h. In notes, explain how you arrived at the estimate since there's no exact match

Respond ONLY with this JSON (no markdown, no backticks):
{
  "low_estimate": 25,
  "high_estimate": 150,
  "recent_sales": [
    {"price": "$45", "platform": "eBay", "date": "Mar 15, 2026", "description": "Same item, raw/ungraded, similar condition", "url": "https://www.ebay.com/itm/..."},
    {"price": "$60", "platform": "TCGPlayer", "date": "Mar 10, 2026", "description": "Near Mint condition listing", "url": "https://www.tcgplayer.com/..."}
  ],
  "demand_level": "High",
  "sell_speed": "Fast",
  "value_factors": ["Factor 1", "Factor 2"],
  "market_trend": "Stable",
  "where_to_sell": ["eBay", "TCGPlayer"],
  "notes": "Any important caveats about condition, grading, edition, or market volatility"
}

IMPORTANT: low_estimate and high_estimate must be plain numbers reflecting the item's ACTUAL CONDITION (not best-case graded prices). recent_sales must be an array of objects with price, platform, date, description, and url fields. Only include sales/listings you actually found — never invent data. If a URL is not available for a sale, set url to null.`;

// ─── DESIGN SYSTEM ─────────────────────────────────────────
const C = {
  bg: "#0f0e0b", bgSurface: "#1a1814", bgCard: "#222019", bgCardHover: "#2c2921",
  accent: "#c9a555", accentDim: "#8b7234", accentGlow: "rgba(201,165,85,0.12)",
  text: "#ece4d4", textDim: "#a89e8c", textMuted: "#6b6354",
  border: "#302b22", borderLight: "#403a2e",
  danger: "#bf5545", success: "#5e9454", info: "#5a8ab4",
  buy: "#4ade80", risky: "#facc15", pass: "#ef4444",
  buyBg: "rgba(74,222,128,0.08)", riskyBg: "rgba(250,204,21,0.08)", passBg: "rgba(239,68,68,0.08)",
  buyBorder: "rgba(74,222,128,0.3)", riskyBorder: "rgba(250,204,21,0.3)", passBorder: "rgba(239,68,68,0.3)",
};
const F = {
  display: "'Cormorant Garamond', 'Georgia', serif",
  body: "'Nunito Sans', 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Nunito+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

const FREE_SCAN_LIMIT = 3;
const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const CACHE_VERSION = "v2"; // bump to invalidate old cache

// ─── IMAGE COMPRESSION ────────────────────────────────────
function compressImage(dataUrl, maxWidth = 1024, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * (maxWidth / w)); w = maxWidth; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      console.log(`[RelicID] Compressed: ${(dataUrl.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl); // fallback to original
    img.src = dataUrl;
  });
}

// ─── SIMPLE IMAGE HASH (for cache keying) ──────────────────
function quickHash(str) {
  let hash = 0;
  const sample = str.slice(0, 2000) + str.slice(-2000) + str.length;
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  return "relic_" + Math.abs(hash).toString(36);
}

// ─── HELPERS ───────────────────────────────────────────────
function parseDollar(s) {
  if (s == null || s === "N/A") return null;
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}
function getDecision(askingPrice, lowVal, highVal) {
  if (askingPrice == null || lowVal == null || highVal == null) return null;
  const avg = (lowVal + highVal) / 2;
  if (askingPrice <= avg * 0.7) return "BUY";
  if (askingPrice <= avg) return "RISKY";
  return "PASS";
}
function getFlipProfit(askingPrice, lowVal, highVal) {
  if (askingPrice == null || lowVal == null || highVal == null) return null;
  return Math.round((lowVal + highVal) / 2 - askingPrice);
}
function getFlipTier(profit) {
  if (profit == null) return null;
  return profit >= 50 ? "High" : profit >= 20 ? "Medium" : "Low";
}
const decisionStyles = {
  BUY: { icon: "🟢", label: "BUY", color: C.buy, bg: C.buyBg, border: C.buyBorder, sub: "Good deal — potential profit ahead" },
  RISKY: { icon: "⚠️", label: "RISKY", color: C.risky, bg: C.riskyBg, border: C.riskyBorder, sub: "Close to market value — slim margins" },
  PASS: { icon: "❌", label: "PASS", color: C.pass, bg: C.passBg, border: C.passBorder, sub: "Overpriced — you'd likely lose money" },
};

function parseJson(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  // Strategy 1: find JSON objects with our key fields
  const matches = clean.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
  if (matches) {
    for (let j = matches.length - 1; j >= 0; j--) {
      try {
        const c = JSON.parse(matches[j]);
        if (c.item_name || c.low_estimate !== undefined) return c;
      } catch {}
    }
  }
  // Strategy 2: whole text
  try { return JSON.parse(clean); } catch {}
  // Strategy 3: first { to last }
  const a = clean.indexOf("{"), b = clean.lastIndexOf("}");
  if (a !== -1 && b > a) { try { return JSON.parse(clean.slice(a, b + 1)); } catch {} }
  return null;
}

// ─── SCAN LIMIT TRACKING ───────────────────────────────────
function getTodayKey() { return "relicid-scans-" + new Date().toISOString().slice(0, 10); }
async function getScansToday() {
  try { return parseInt(localStorage.getItem(getTodayKey())) || 0; } catch { return 0; }
}
async function incrementScans() {
  try { const c = await getScansToday(); localStorage.setItem(getTodayKey(), String(c + 1)); return c + 1; } catch { return 1; }
}

// ─── RESULT CACHE ──────────────────────────────────────────
async function getCachedResult(hash) {
  try {
    const raw = localStorage.getItem(CACHE_VERSION + "_" + hash);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > CACHE_TTL_MS) return null;
    console.log("[RelicID] Cache HIT for", hash);
    return data.result;
  } catch { return null; }
}
async function setCachedResult(hash, result) {
  try { localStorage.setItem(CACHE_VERSION + "_" + hash, JSON.stringify({ ts: Date.now(), result })); } catch {}
}

// ─── API CALLS ─────────────────────────────────────────────
async function callLightAnalysis(images) {
  console.log("[RelicID] Light analysis — calling /api/scan");
  const content = images.map(p => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: p } }));
  content.push({ type: "text", text: LIGHT_PROMPT(images.length) });
  const res = await fetch("/api/scan", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, messages: [{ role: "user", content }] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.content?.map(b => b.text || "").join("");
  return parseJson(text);
}

async function callDeepValuation(analysis) {
  console.log("[RelicID] Deep valuation — calling /api/deep-scan");
  const res = await fetch("/api/deep-scan", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8192, messages: [{ role: "user", content: DEEP_PROMPT(analysis) }] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  return parseJson(text);
}

// ─── STORAGE ───────────────────────────────────────────────
async function loadCollection() {
  try { const raw = localStorage.getItem("relicid-collection"); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
async function saveCollection(items) {
  try { localStorage.setItem("relicid-collection", JSON.stringify(items)); } catch (e) { console.error("Save:", e); }
}

// ─── UI COMPONENTS (unchanged) ─────────────────────────────
function TabBar({ active, onChange, counts }) {
  const tabs = [{ id: "scan", label: "Scan", icon: "🔍" }, { id: "collection", label: "Collection", icon: "📦", count: counts }, { id: "guide", label: "Photo Tips", icon: "📸" }];
  return (
    <div style={{ display: "flex", gap: 4, background: C.bgSurface, borderRadius: 10, padding: 4, marginBottom: 32, border: `1px solid ${C.border}` }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{ flex: 1, padding: "12px 8px", background: active === t.id ? C.bgCard : "transparent", border: active === t.id ? `1px solid ${C.border}` : "1px solid transparent", borderRadius: 8, cursor: "pointer", transition: "all 0.25s", color: active === t.id ? C.accent : C.textMuted, fontFamily: F.body, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span>{t.icon}</span> {t.label}
          {t.count > 0 && <span style={{ fontSize: 10, background: C.accent, color: C.bg, borderRadius: 10, padding: "1px 7px", fontWeight: 700 }}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function PhotoSlot({ label, hint, dataUrl, onAdd, onRemove }) {
  const ref = useRef(null);
  return (
    <div style={{ flex: "1 1 140px", minWidth: 140 }}>
      <div style={{ fontSize: 11, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{label}</div>
      {dataUrl ? (
        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, aspectRatio: "1", background: C.bgCard }}>
          <img src={dataUrl} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <button onClick={onRemove} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} style={{ borderRadius: 8, border: `2px dashed ${C.border}`, aspectRatio: "1", background: C.bgSurface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 24, opacity: 0.4, marginBottom: 4 }}>+</div>
          <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center", padding: "0 8px" }}>{hint}</div>
          <input ref={ref} type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (f) onAdd(f); }} style={{ display: "none" }} />
        </div>
      )}
    </div>
  );
}

function DecisionBadge({ decision, askingPrice, lowVal, highVal }) {
  if (!decision) return (
    <div style={{ padding: "16px 20px", background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`, textAlign: "center", marginBottom: 20 }}>
      <div style={{ fontSize: 14, color: C.textMuted }}>💡 Enter an asking price to evaluate deal quality</div>
    </div>
  );
  const s = decisionStyles[decision];
  const profit = getFlipProfit(askingPrice, lowVal, highVal);
  const flipTier = getFlipTier(profit);
  const avg = lowVal != null && highVal != null ? Math.round((lowVal + highVal) / 2) : null;
  return (
    <div style={{ padding: "20px 24px", background: s.bg, borderRadius: 12, border: `2px solid ${s.border}`, marginBottom: 20, textAlign: "center" }}>
      <div style={{ fontSize: 42, marginBottom: 4 }}>{s.icon}</div>
      <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: s.color, letterSpacing: 2 }}>{s.label}</div>
      <div style={{ fontSize: 13, color: C.textDim, marginTop: 4 }}>{s.sub}</div>
      {profit != null && (
        <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ padding: "8px 16px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Flip Potential</div>
            <div style={{ fontSize: 22, fontFamily: F.display, fontWeight: 700, color: profit > 0 ? C.buy : C.pass }}>{profit > 0 ? "+" : ""}${profit}</div>
            {flipTier && <div style={{ fontSize: 10, fontFamily: F.mono, color: flipTier === "High" ? C.buy : flipTier === "Medium" ? C.risky : C.textMuted }}>{flipTier} margin</div>}
          </div>
          <div style={{ padding: "8px 16px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>You Pay</div>
            <div style={{ fontSize: 22, fontFamily: F.display, fontWeight: 700, color: C.text }}>${askingPrice}</div>
          </div>
          {avg != null && <div style={{ padding: "8px 16px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Avg Value</div>
            <div style={{ fontSize: 22, fontFamily: F.display, fontWeight: 700, color: C.accent }}>${avg}</div>
          </div>}
        </div>
      )}
    </div>
  );
}

function ConfidenceBar({ percent }) {
  const p = parseInt(percent) || 0;
  const color = p >= 75 ? C.success : p >= 50 ? C.accent : C.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2, flexShrink: 0 }}>Confidence</div>
      <div style={{ flex: 1, height: 8, background: C.bg, borderRadius: 4, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ width: `${p}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s" }} />
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color, minWidth: 40, textAlign: "right" }}>{p}%</div>
      {p < 50 && <div style={{ fontSize: 11, color: C.danger }}>⚠️ Low</div>}
    </div>
  );
}

function RecentSales({ sales, loading, isUnique }) {
  const title = isUnique ? "Comparable Sales" : "Recent Sales";
  if (loading) return (
    <div style={{ padding: 16, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 16, textAlign: "center" }}>
      <div style={{ fontSize: 9, fontFamily: F.mono, color: C.accent, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.textMuted, animation: "pulse 1.5s infinite" }}>🔍 Searching recent sales...</div>
    </div>
  );
  if (!sales || sales.length === 0) return (
    <div style={{ padding: 16, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 16 }}>
      <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.textMuted, fontStyle: "italic" }}>No recent sales data found</div>
    </div>
  );
  return (
    <div style={{ padding: 16, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 16 }}>
      <div style={{ fontSize: 9, fontFamily: F.mono, color: C.accent, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>{title}</div>
      {sales.map((s, i) => {
        // Handle both old string format and new object format
        const isObject = typeof s === "object" && s !== null;
        const text = isObject
          ? `${s.price || "?"} on ${s.platform || "Unknown"} (${s.date || "Recently"}) — ${s.description || "Similar item"}`
          : String(s);
        const url = isObject ? s.url : null;
        return (
          <div key={i} style={{ fontSize: 13, color: C.text, padding: "8px 0", borderBottom: i < sales.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: C.accentDim, flexShrink: 0 }}>•</span>
            <span style={{ flex: 1 }}>{text}</span>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, fontSize: 11, fontFamily: F.mono, padding: "3px 8px", borderRadius: 4, background: C.accentGlow, color: C.accent, border: `1px solid ${C.accentDim}40`, textDecoration: "none", cursor: "pointer" }}>
                View →
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DemandBadges({ demand, speed }) {
  const dc = demand === "High" ? C.buy : demand === "Medium" ? C.risky : C.textMuted;
  const sc = speed === "Fast" ? C.buy : speed === "Moderate" ? C.risky : C.textMuted;
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      {demand && demand !== "Unknown" && <div style={{ padding: "6px 14px", background: C.bgCard, borderRadius: 6, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 11, color: C.textMuted }}>Demand:</span><span style={{ fontSize: 12, fontWeight: 600, color: dc }}>{demand}</span></div>}
      {speed && speed !== "Unknown" && <div style={{ padding: "6px 14px", background: C.bgCard, borderRadius: 6, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 11, color: C.textMuted }}>Sell Speed:</span><span style={{ fontSize: 12, fontWeight: 600, color: sc }}>{speed}</span></div>}
    </div>
  );
}

function ResultCard({ item, compact, onClick }) {
  const hasDeep = !!item.valuation;
  const lowVal = parseDollar(hasDeep ? item.valuation?.low_estimate : item.analysis?.low_estimate);
  const highVal = parseDollar(hasDeep ? item.valuation?.high_estimate : item.analysis?.high_estimate);
  const decision = hasDeep && item.askingPrice != null ? getDecision(item.askingPrice, lowVal, highVal) : null;
  const ds = decision ? decisionStyles[decision] : null;
  return (
    <div onClick={onClick} style={{ background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", cursor: onClick ? "pointer" : "default" }}>
      {item.thumbnail && (
        <div style={{ aspectRatio: "1", overflow: "hidden", background: C.bgSurface, position: "relative" }}>
          <img src={item.thumbnail} alt={item.analysis?.item_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {ds && <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 10px", borderRadius: 6, background: "rgba(0,0,0,0.75)", color: ds.color, fontFamily: F.mono, fontSize: 11, fontWeight: 700 }}>{ds.icon} {ds.label}</div>}
          {!hasDeep && <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 10px", borderRadius: 6, background: "rgba(0,0,0,0.65)", color: C.textMuted, fontFamily: F.mono, fontSize: 9, fontWeight: 600 }}>Quick Scan</div>}
        </div>
      )}
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontFamily: F.mono, padding: "2px 7px", borderRadius: 3, background: C.accentGlow, color: C.accent, border: `1px solid ${C.accentDim}40` }}>{item.analysis?.category}</span>
          {lowVal != null && <span style={{ fontSize: 9, fontFamily: F.mono, padding: "2px 7px", borderRadius: 3, color: hasDeep ? C.success : C.textMuted, border: `1px solid ${hasDeep ? C.success : C.textMuted}40` }}>~${lowVal}–${highVal}{!hasDeep ? " est." : ""}</span>}
        </div>
        <h3 style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: C.text, margin: "0 0 4px", lineHeight: 1.25 }}>{item.analysis?.item_name}</h3>
        <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{item.analysis?.style_period} · {item.analysis?.estimated_era}</p>
      </div>
    </div>
  );
}

// ─── DETAIL VIEW ───────────────────────────────────────────
function DetailView({ item, onBack, onDelete, onLoadDeep, deepLoading }) {
  const a = item.analysis;
  const v = item.valuation;
  const hasDeep = !!v;
  const objectType = a?.object_type || "Physical Object";
  const isPhysical = objectType === "Physical Object";
  const isScreen = objectType === "Screen Capture";

  // Use deep values when available, fall back to quick estimate
  const quickLow = parseDollar(a?.low_estimate);
  const quickHigh = parseDollar(a?.high_estimate);
  const deepLow = parseDollar(v?.low_estimate);
  const deepHigh = parseDollar(v?.high_estimate);
  const lowVal = hasDeep && deepLow != null ? deepLow : quickLow;
  const highVal = hasDeep && deepHigh != null ? deepHigh : quickHigh;

  // Decision ONLY from deep data
  const decision = hasDeep && item.askingPrice != null ? getDecision(item.askingPrice, deepLow, deepHigh) : null;
  const confPercent = a?.confidence_percent || 60;

  // Check if deep values differ significantly from quick
  const hasDiscrepancy = hasDeep && quickLow != null && deepLow != null && (Math.abs(((quickLow + quickHigh) / 2) - ((deepLow + deepHigh) / 2)) > ((quickLow + quickHigh) / 2) * 0.25);

  const exportText = () => {
    const useLow = hasDeep ? deepLow : quickLow;
    const useHigh = hasDeep ? deepHigh : quickHigh;
    let txt = `RELICID VALUE REPORT\n${"═".repeat(40)}\n`;
    txt += hasDeep ? `Source: Deep Scan (live market data)\n` : `Source: Quick Scan (AI estimate — verify with Deep Scan)\n`;
    if (decision) txt += `VERDICT: ${decision}\n`;
    if (hasDeep && item.askingPrice != null) txt += `Asking Price: $${item.askingPrice}\nFlip Potential: $${getFlipProfit(item.askingPrice, useLow, useHigh)}\n`;
    txt += `\nItem: ${a?.item_name}\nCategory: ${a?.category}\nEra: ${a?.estimated_era}\nStyle: ${a?.style_period}\nOrigin: ${a?.likely_origin}\nMaker: ${a?.maker}\nMaterials: ${a?.materials?.join(", ")}\nConfidence: ${confPercent}%\n\n`;
    txt += `Description:\n${a?.description}\n\nKey Features:\n${a?.key_features?.map(f => `  • ${f}`).join("\n")}\n\nCondition:\n${a?.condition_notes}\n`;
    if (useLow != null) {
      txt += `\n${"─".repeat(40)}\nVALUATION${hasDeep ? " (Live Market)" : " (AI Estimate)"}\n\nValue: $${useLow} — $${useHigh}\n`;
      if (v?.recent_sales?.length) txt += `\nRecent Sales:\n${v.recent_sales.map(s => {
        if (typeof s === "string") return `  • ${s}`;
        return `  • ${s.price || "?"} on ${s.platform || "Unknown"} (${s.date || "Recently"}) — ${s.description || "Similar item"}${s.url ? `\n    ${s.url}` : ""}`;
      }).join("\n")}\n`;
      if (v?.where_to_sell?.length) txt += `\nVenues: ${v.where_to_sell.join(", ")}\n`;
    }
    txt += `\n${"─".repeat(40)}\nGenerated by RelicID · ${new Date(item.scannedAt).toLocaleDateString()} · getrelicid.com`;
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url;
    link.download = `relicid-${a?.item_name?.replace(/\s+/g, "-").toLowerCase() || "report"}.txt`;
    link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.accent, fontFamily: F.body, fontSize: 14, cursor: "pointer", padding: "0 0 16px", fontWeight: 600 }}>← Back</button>

      {/* ═══ OBJECT TYPE WARNING — for non-physical items ═══ */}
      {!isPhysical && (
        <div style={{ padding: "14px 18px", background: `${C.info}10`, borderRadius: 10, border: `1px solid ${C.info}30`, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{isScreen ? "📱" : objectType === "Printed Media" ? "🖼️" : "📦"}</span>
            <span style={{ fontSize: 12, fontFamily: F.mono, fontWeight: 600, color: C.info, textTransform: "uppercase", letterSpacing: 1 }}>{objectType}</span>
          </div>
          <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>
            {isScreen && "This appears to be a screenshot. We've identified and valued the item shown, but condition, color accuracy, and authenticity can't be verified from a screen photo."}
            {objectType === "Printed Media" && "This appears to be printed media (poster, print, or flat image) rather than a physical object. Value reflects the print itself, not the item depicted."}
            {objectType === "Packaging Only" && "Only packaging is visible — the actual item inside cannot be verified from these photos."}
          </div>
          {a?.object_type_note && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, fontStyle: "italic" }}>{a.object_type_note}</div>}
        </div>
      )}

      {/* ═══ DECISION — only after Deep Scan ═══ */}
      {hasDeep ? (
        <DecisionBadge decision={decision} askingPrice={item.askingPrice} lowVal={deepLow} highVal={deepHigh} />
      ) : (
        /* Quick Scan: prompt to run deep scan for decisions */
        <div style={{ padding: "16px 20px", background: C.bgSurface, borderRadius: 12, border: `1px dashed ${C.border}`, textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>💡 Run a <strong style={{ color: C.accent }}>Deep Scan</strong> to get BUY/PASS verdict and flip profit</div>
          {item.askingPrice != null && <div style={{ fontSize: 11, color: C.textMuted }}>Asking price of ${item.askingPrice} saved — will be evaluated after Deep Scan</div>}
        </div>
      )}

      {/* ═══ CONFIDENCE — always shown ═══ */}
      <ConfidenceBar percent={confPercent} />

      {/* ═══ PHOTOS ═══ */}
      {item.photos?.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 8 }}>
          {item.photos.map((p, i) => <div key={i} style={{ flexShrink: 0, width: 160, height: 160, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}><img src={p.dataUrl} alt={p.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>)}
        </div>
      )}

      {/* ═══ ITEM TITLE & META ═══ */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontFamily: F.mono, padding: "3px 10px", borderRadius: 4, background: C.accentGlow, color: C.accent, border: `1px solid ${C.accentDim}` }}>{a?.category}</span>
        {!isPhysical && <span style={{ fontSize: 11, fontFamily: F.mono, padding: "3px 10px", borderRadius: 4, color: C.info, border: `1px solid ${C.info}40`, background: `${C.info}10` }}>{objectType}</span>}
        <span style={{ fontSize: 11, fontFamily: F.mono, padding: "3px 10px", borderRadius: 4, color: hasDeep ? C.success : C.textMuted, border: `1px solid ${hasDeep ? C.success : C.textMuted}40`, background: hasDeep ? `${C.success}10` : "transparent" }}>
          {hasDeep ? "✓ Deep Scan" : "⚡ Quick Scan"}
        </span>
        <span style={{ fontSize: 11, fontFamily: F.mono, padding: "3px 10px", borderRadius: 4, color: C.textMuted, border: `1px solid ${C.border}` }}>Scanned {new Date(item.scannedAt).toLocaleDateString()}</span>
      </div>
      <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.text, margin: "0 0 4px", lineHeight: 1.2 }}>{a?.item_name}</h2>
      <p style={{ fontSize: 14, color: C.textDim, margin: "0 0 20px" }}>{a?.style_period} · {a?.estimated_era} · {a?.likely_origin}</p>

      {/* ═══ VALUE RANGE ═══ */}
      {lowVal != null && highVal != null && (
        <div style={{ background: C.bgCard, borderRadius: 10, border: `1px solid ${hasDeep ? C.success + "40" : C.border}`, padding: 20, marginBottom: 16, position: "relative" }}>
          {/* Tier label */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontFamily: F.mono, color: hasDeep ? C.success : C.textMuted, textTransform: "uppercase", letterSpacing: 3 }}>
              {hasDeep ? "✓ Market Value (Live Data)" : "⚡ AI Estimate Only"}
            </div>
            {!hasDeep && <div style={{ fontSize: 9, fontFamily: F.mono, color: C.danger, padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.danger}30`, background: `${C.danger}10` }}>May be inaccurate</div>}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, opacity: hasDeep ? 1 : 0.65 }}>
            <div><div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted }}>LOW</div><div style={{ fontSize: 20, fontFamily: F.display, fontWeight: 700, color: C.textDim }}>${lowVal}</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, fontFamily: F.mono, color: hasDeep ? C.accent : C.textMuted }}>AVG</div><div style={{ fontSize: 30, fontFamily: F.display, fontWeight: 700, color: hasDeep ? C.accent : C.textMuted }}>${Math.round((lowVal + highVal) / 2)}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted }}>HIGH</div><div style={{ fontSize: 20, fontFamily: F.display, fontWeight: 700, color: C.textDim }}>${highVal}</div></div>
          </div>
          <div style={{ height: 5, background: C.bg, borderRadius: 3, position: "relative", overflow: "hidden", opacity: hasDeep ? 1 : 0.5 }}>
            <div style={{ position: "absolute", left: "12%", right: "12%", top: 0, bottom: 0, background: hasDeep ? `linear-gradient(90deg, ${C.accentDim}, ${C.accent}, ${C.accentDim})` : `linear-gradient(90deg, ${C.textMuted}60, ${C.textMuted}, ${C.textMuted}60)`, borderRadius: 3 }} />
          </div>

          {/* Discrepancy notice */}
          {hasDiscrepancy && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: `${C.info}10`, borderRadius: 6, border: `1px solid ${C.info}30`, fontSize: 12, color: C.info }}>
              📊 Updated with real market data — value differs from initial AI estimate
            </div>
          )}
        </div>
      )}

      {/* ═══ DEEP SCAN CTA — prominent when no deep data ═══ */}
      {!hasDeep && !deepLoading && (
        <div style={{ padding: 24, background: `linear-gradient(135deg, ${C.accentGlow}, ${C.bgCard})`, borderRadius: 12, border: `1px solid ${C.accent}40`, marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>🔬</div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.accent, marginBottom: 6 }}>Get Real Market Value</div>
          <div style={{ fontSize: 13, color: C.textDim, marginBottom: 14, lineHeight: 1.5 }}>
            Searches real sold listings and live prices to give you an accurate valuation, BUY/PASS verdict, and flip profit calculation.
          </div>
          <button onClick={onLoadDeep} style={{ padding: "12px 36px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: F.display, fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>
            Run Deep Scan
          </button>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8 }}>Uses 1 credit · Searches eBay, marketplaces & resale platforms</div>
        </div>
      )}

      {/* Deep scan loading */}
      {deepLoading && (
        <div style={{ padding: 24, background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8, animation: "pulse 1.5s infinite" }}>🔬</div>
          <div style={{ fontFamily: F.display, fontSize: 16, color: C.accent, marginBottom: 4 }}>Searching sold listings & market data...</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>This may take 15–30 seconds</div>
        </div>
      )}

      {/* ═══ DEMAND & SPEED — show from whichever source ═══ */}
      <DemandBadges demand={v?.demand_level || a?.demand_level} speed={v?.sell_speed || a?.sell_speed} />

      {/* ═══ DESCRIPTION & DETAILS — always shown ═══ */}
      <p style={{ fontSize: 15, lineHeight: 1.7, color: C.text, margin: "0 0 16px" }}>{a?.description}</p>

      {/* ═══ UNIQUE / HANDMADE NOTICE ═══ */}
      {a?.is_unique && (
        <div style={{ padding: "12px 16px", background: `${C.accent}08`, borderRadius: 8, border: `1px solid ${C.accent}25`, marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>🎨</span>
          <div>
            <div style={{ fontSize: 12, fontFamily: F.mono, fontWeight: 600, color: C.accent, marginBottom: 2 }}>Handmade / One-of-a-Kind</div>
            <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>No exact match exists. Value is estimated from comparable pieces by medium, size, and subject matter.</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {[{ l: "Maker", v: a?.maker }, { l: "Materials", v: a?.materials?.join(", ") }].map((d, i) => (
          <div key={i} style={{ padding: 14, background: C.bgCard, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>{d.l}</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.4 }}>{d.v}</div>
          </div>
        ))}
      </div>

      {a?.key_features?.length > 0 && (
        <div style={{ padding: 14, background: C.bgCard, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Key Features</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{a.key_features.map((f, i) => <span key={i} style={{ fontSize: 12, padding: "4px 10px", background: C.bg, borderRadius: 4, color: C.textDim, border: `1px solid ${C.border}` }}>{f}</span>)}</div>
        </div>
      )}

      {a?.condition_notes && (
        <div style={{ padding: 14, background: C.bgCard, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2 }}>Condition</div>
            {a?.condition_grade && <div style={{ fontSize: 10, fontFamily: F.mono, padding: "2px 8px", borderRadius: 4, background: C.accentGlow, color: C.accent, border: `1px solid ${C.accentDim}40` }}>{a.condition_grade}</div>}
          </div>
          <div style={{ fontSize: 14, color: C.text }}>{a.condition_notes}</div>
        </div>
      )}

      {/* ═══ DEEP SCAN DATA — only after deep scan ═══ */}
      {hasDeep && (
        <>
          <RecentSales sales={v?.recent_sales} loading={false} isUnique={!!a?.is_unique} />
          {v?.value_factors?.length > 0 && (
            <div style={{ padding: 14, background: C.bgCard, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Value Factors</div>
              {v.value_factors.map((f, i) => <div key={i} style={{ fontSize: 13, color: C.text, padding: "5px 0", borderBottom: i < v.value_factors.length - 1 ? `1px solid ${C.border}` : "none" }}>{f}</div>)}
            </div>
          )}
          {v?.where_to_sell?.length > 0 && (
            <div style={{ padding: 14, background: C.bgCard, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Best Places to Sell</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{v.where_to_sell.map((s, i) => <span key={i} style={{ fontSize: 11, padding: "4px 10px", background: C.bg, borderRadius: 4, color: C.accent, border: `1px solid ${C.accentDim}40` }}>{s}</span>)}</div>
            </div>
          )}
          {v?.notes && <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", marginBottom: 16 }}>⚠️ {v.notes}</div>}
          {v?.market_trend && v.market_trend !== "Unknown" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "8px 12px", background: C.bgCard, borderRadius: 6, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>Trend:</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: v.market_trend?.toLowerCase().includes("rising") ? C.success : v.market_trend?.toLowerCase().includes("declin") ? C.danger : C.accent }}>
                {v.market_trend?.toLowerCase().includes("rising") ? "📈" : v.market_trend?.toLowerCase().includes("declin") ? "📉" : "📊"} {v.market_trend}
              </span>
            </div>
          )}
        </>
      )}

      {/* ═══ ACTION BUTTONS ═══ */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={exportText} style={{ flex: 1, padding: "12px 20px", background: C.bgCard, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 8, cursor: "pointer", fontFamily: F.body, fontSize: 13, fontWeight: 600 }}>📄 Export Report</button>
        <button onClick={onDelete} style={{ padding: "12px 20px", background: C.bgCard, color: C.danger, border: `1px solid ${C.danger}50`, borderRadius: 8, cursor: "pointer", fontFamily: F.body, fontSize: 13, fontWeight: 600 }}>🗑️ Delete</button>
      </div>
    </div>
  );
}

function GuideView() {
  const tips = [
    { icon: "📷", title: "Front / Main View", desc: "Full item head-on with even lighting." },
    { icon: "🔄", title: "Back / Reverse", desc: "Labels, stamps, and tags live here." },
    { icon: "🔍", title: "Labels / Tags Close-Up", desc: "Get close to any brand marks, serial numbers, or tags." },
    { icon: "✨", title: "Detail / Feature Shot", desc: "Unique features — wear, damage, special details." },
  ];
  const general = ["Use natural daylight — avoid flash", "Plain contrasting background", "Keep steady — blurry details can't be read", "Include a coin or card for scale on small items", "Capture any labels, tags, or serial numbers", "For shoes and clothing, photograph all brand tags", "Shoot reflective items from multiple angles"];
  return (
    <div>
      <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>Photo Tips</h2>
      <p style={{ fontSize: 14, color: C.textDim, margin: "0 0 28px" }}>Better photos = better results.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        {tips.map((t, i) => <div key={i} style={{ padding: 16, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}` }}><div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div><div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.accent, marginBottom: 6 }}>{t.title}</div><div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>{t.desc}</div></div>)}
      </div>
      <div style={{ padding: 20, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 9, fontFamily: F.mono, color: C.accent, textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>General Tips</div>
        {general.map((tip, i) => <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: i < general.length - 1 ? `1px solid ${C.border}` : "none" }}><span style={{ color: C.accentDim, fontSize: 14, flexShrink: 0 }}>→</span><span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{tip}</span></div>)}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────
export default function RelicID() {
  const [tab, setTab] = useState("scan");
  const [collection, setCollection] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [scansToday, setScansToday] = useState(0);

  const [photos, setPhotos] = useState([
    { label: "Front", hint: "Main view", dataUrl: null, base64: null, mediaType: null },
    { label: "Back", hint: "Reverse side", dataUrl: null, base64: null, mediaType: null },
    { label: "Labels / Tags", hint: "Marks & branding", dataUrl: null, base64: null, mediaType: null },
    { label: "Detail", hint: "Close-up", dataUrl: null, base64: null, mediaType: null },
  ]);
  const [askingPrice, setAskingPrice] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const scanLock = useRef(false); // debounce lock

  useEffect(() => {
    loadCollection().then(items => { setCollection(items); setLoaded(true); });
    getScansToday().then(setScansToday);
  }, []);

  const hasAnyPhoto = photos.some(p => p.dataUrl);
  const activePhotos = photos.filter(p => p.base64);
  const atLimit = scansToday >= FREE_SCAN_LIMIT;

  const addPhoto = (index, file) => {
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1];
      setPhotos(prev => prev.map((p, i) => i === index ? { ...p, dataUrl, base64, mediaType: file.type } : p));
    };
    reader.readAsDataURL(file);
  };
  const removePhoto = (index) => { setPhotos(prev => prev.map((p, i) => i === index ? { ...p, dataUrl: null, base64: null, mediaType: null } : p)); };

  const resetScan = () => {
    setPhotos(prev => prev.map(p => ({ ...p, dataUrl: null, base64: null, mediaType: null })));
    setScanResult(null); setError(null); setAskingPrice("");
  };

  // ─── MAIN SCAN (light processing, 1 API call) ───────────
  const runScan = async () => {
    if (activePhotos.length === 0 || scanLock.current) return;
    if (atLimit) { setError(`Daily scan limit reached (${FREE_SCAN_LIMIT}/${FREE_SCAN_LIMIT}). Upgrade for unlimited scans.`); return; }

    scanLock.current = true; // debounce
    setAnalyzing(true); setError(null); setScanResult(null);

    try {
      // 1. Compress images
      const compressed = await Promise.all(
        activePhotos.map(p => compressImage(p.dataUrl))
      );
      const compressedBase64 = compressed.map(d => d.split(",")[1]);

      // 2. Check cache
      const cacheKey = quickHash(compressedBase64.join(""));
      const cached = await getCachedResult(cacheKey);
      if (cached) {
        const priceNum = askingPrice ? parseFloat(askingPrice) : null;
        const item = { ...cached, askingPrice: priceNum != null && !isNaN(priceNum) ? priceNum : null };
        setScanResult(item);
        setAnalyzing(false);
        scanLock.current = false;
        return;
      }

      // 3. Light analysis (1 API call, no web search)
      const result = await callLightAnalysis(compressedBase64);
      if (!result) throw new Error("Could not parse identification");

      const analysis = {
        item_name: result.item_name, category: result.category, estimated_era: result.estimated_era,
        style_period: result.style_period, likely_origin: result.likely_origin, maker: result.maker,
        materials: result.materials, condition_notes: result.condition_notes, key_features: result.key_features,
        confidence_percent: result.confidence_percent, description: result.description,
        low_estimate: result.low_estimate, high_estimate: result.high_estimate,
        demand_level: result.demand_level, sell_speed: result.sell_speed, market_trend: result.market_trend,
        condition_grade: result.condition_grade, search_query: result.search_query,
        object_type: result.object_type || "Physical Object",
        object_type_confidence: result.object_type_confidence || "Medium",
        object_type_note: result.object_type_note || null,
        is_unique: result.is_unique || false,
      };

      const priceNum = askingPrice ? parseFloat(askingPrice) : null;
      const newItem = {
        id: Date.now().toString(), scannedAt: new Date().toISOString(),
        thumbnail: photos.find(p => p.dataUrl)?.dataUrl || null,
        photos: photos.filter(p => p.dataUrl).map(p => ({ label: p.label, dataUrl: p.dataUrl })),
        askingPrice: priceNum != null && !isNaN(priceNum) ? priceNum : null,
        analysis, valuation: null, _cacheKey: cacheKey,
      };

      // Cache result
      await setCachedResult(cacheKey, newItem);

      // Increment scan counter
      const newCount = await incrementScans();
      setScansToday(newCount);

      setScanResult(newItem);
      const updated = [newItem, ...collection];
      setCollection(updated);
      await saveCollection(updated);
    } catch (err) {
      console.error(err);
      setError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
      scanLock.current = false;
    }
  };

  // ─── DEEP ANALYSIS (on demand, lazy loaded) ──────────────
  const loadDeepData = async (item) => {
    if (deepLoading) return;
    setDeepLoading(true);
    try {
      const deep = await callDeepValuation(item.analysis);
      const fallback = { low_estimate: "N/A", high_estimate: "N/A", recent_sales: [], demand_level: "Unknown", sell_speed: "Unknown", value_factors: [], market_trend: "Unknown", where_to_sell: [], notes: "Could not parse." };
      const valuation = deep ? { ...fallback, ...deep } : fallback;

      const updated = { ...item, valuation };
      // Update in scan result
      if (scanResult?.id === item.id) setScanResult(updated);
      // Update in detail view
      if (detailItem?.id === item.id) setDetailItem(updated);
      // Update in collection
      const newColl = collection.map(c => c.id === item.id ? updated : c);
      setCollection(newColl);
      await saveCollection(newColl);
      // Update cache
      if (item._cacheKey) await setCachedResult(item._cacheKey, updated);
    } catch (e) {
      console.error("Deep analysis error:", e);
    } finally {
      setDeepLoading(false);
    }
  };

  const deleteItem = async (id) => {
    const updated = collection.filter(item => item.id !== id);
    setCollection(updated); await saveCollection(updated); setDetailItem(null);
  };

  const categories = ["All", ...new Set(collection.map(i => i.analysis?.category).filter(Boolean))];
  const filtered = collection.filter(i => {
    if (filterCat !== "All" && i.analysis?.category !== filterCat) return false;
    if (searchQ && !JSON.stringify(i.analysis).toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse at 25% 0%, ${C.accentGlow} 0%, transparent 50%)`, zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "28px 20px 60px" }}>
        <header style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: F.display, fontSize: "clamp(30px, 6vw, 46px)", fontWeight: 700, margin: 0, lineHeight: 1.1, background: `linear-gradient(135deg, ${C.accent}, #e8d5a0, ${C.accentDim})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>RelicID</h1>
          <p style={{ fontFamily: F.body, fontWeight: 300, fontSize: 14, color: C.textMuted, marginTop: 4, letterSpacing: 0.5 }}>Scan anything. See what it's worth.</p>
        </header>

        <TabBar active={tab} onChange={(t) => { setTab(t); setDetailItem(null); }} counts={collection.length} />

        {/* ─── SCAN TAB ─── */}
        {tab === "scan" && !scanResult && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>Upload Photos</h2>
              <div style={{ fontSize: 11, fontFamily: F.mono, color: atLimit ? C.danger : C.textMuted }}>{scansToday}/{FREE_SCAN_LIMIT} scans today</div>
            </div>
            <p style={{ fontSize: 13, color: C.textDim, margin: "0 0 20px" }}>Add at least one photo. <span style={{ color: C.accent, cursor: "pointer" }} onClick={() => setTab("guide")}>Photo tips →</span></p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              {photos.map((p, i) => <PhotoSlot key={i} label={p.label} hint={p.hint} dataUrl={p.dataUrl} onAdd={(file) => addPhoto(i, file)} onRemove={() => removePhoto(i)} />)}
            </div>

            <div style={{ padding: 16, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontSize: 9, fontFamily: F.mono, color: C.accent, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>What's the asking price?</div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ padding: "10px 12px", background: C.bg, borderRadius: "6px 0 0 6px", border: `1px solid ${C.border}`, borderRight: "none", color: C.accent, fontFamily: F.display, fontSize: 18, fontWeight: 700 }}>$</span>
                    <input type="number" value={askingPrice} onChange={e => setAskingPrice(e.target.value)} placeholder="0.00" style={{ flex: 1, padding: "10px 14px", background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: "0 6px 6px 0", color: C.text, fontFamily: F.mono, fontSize: 16, outline: "none", minWidth: 0 }} />
                  </div>
                </div>
                <div style={{ flex: "1 1 200px", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>💡 Optional — enables BUY/PASS verdict and flip profit</div>
              </div>
            </div>

            {error && <div style={{ padding: 14, background: `${C.danger}15`, border: `1px solid ${C.danger}40`, borderRadius: 8, color: C.danger, fontSize: 13, marginBottom: 20, textAlign: "center" }}>{error}</div>}

            {atLimit && (
              <div style={{ padding: 16, background: C.riskyBg, border: `1px solid ${C.riskyBorder}`, borderRadius: 10, marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.risky, marginBottom: 4 }}>Daily Scan Limit Reached</div>
                <div style={{ fontSize: 13, color: C.textDim }}>You've used all {FREE_SCAN_LIMIT} free scans today. Upgrade for unlimited scans.</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={runScan} disabled={!hasAnyPhoto || analyzing || atLimit} style={{
                flex: 1, padding: "14px 24px", fontFamily: F.display, fontSize: 16, fontWeight: 600,
                background: hasAnyPhoto && !atLimit ? `linear-gradient(135deg, ${C.accent}, ${C.accentDim})` : C.bgCard,
                color: hasAnyPhoto && !atLimit ? C.bg : C.textMuted, border: "none", borderRadius: 8,
                cursor: hasAnyPhoto && !atLimit ? "pointer" : "not-allowed", letterSpacing: 0.5,
              }}>
                {analyzing ? "🔎 Examining..." : "🔍 Quick Scan"}
              </button>
              {hasAnyPhoto && <button onClick={resetScan} style={{ padding: "14px 20px", background: C.bgCard, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: F.body, fontSize: 13 }}>Clear</button>}
            </div>

            {analyzing && (
              <div style={{ textAlign: "center", padding: 28, marginTop: 20, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 10, animation: "pulse 1.5s infinite" }}>🔎</div>
                <p style={{ fontFamily: F.display, fontSize: 16, color: C.accent, margin: "0 0 4px" }}>Identifying item & estimating value...</p>
                <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>Quick scan — usually 5–10 seconds</p>
              </div>
            )}
          </div>
        )}

        {tab === "scan" && scanResult && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.success }}>Saved to Collection</span>
              </div>
              <button onClick={resetScan} style={{ padding: "8px 20px", background: C.bgCard, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 6, cursor: "pointer", fontFamily: F.body, fontSize: 13, fontWeight: 600 }}>📷 Scan Another</button>
            </div>
            <DetailView item={scanResult} onBack={resetScan} onDelete={() => { deleteItem(scanResult.id); resetScan(); }} onLoadDeep={() => loadDeepData(scanResult)} deepLoading={deepLoading} />
          </div>
        )}

        {tab === "collection" && !detailItem && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.text, margin: "0 0 16px" }}>
              Your Collection {collection.length > 0 && <span style={{ fontSize: 16, color: C.textMuted }}>({collection.length})</span>}
            </h2>
            {collection.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: C.bgSurface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📦</div>
                <p style={{ fontFamily: F.display, fontSize: 18, color: C.textDim, margin: "0 0 8px" }}>No items yet</p>
                <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px" }}>Scan your first item to start building your collection.</p>
                <button onClick={() => setTab("scan")} style={{ padding: "10px 28px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: F.display, fontSize: 14, fontWeight: 600 }}>Start Scanning</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search items..." style={{ flex: "1 1 200px", padding: "10px 14px", background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: F.body, fontSize: 13, outline: "none" }} />
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {categories.map(cat => <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: "6px 14px", fontSize: 11, fontFamily: F.mono, borderRadius: 4, background: filterCat === cat ? C.accentGlow : "transparent", color: filterCat === cat ? C.accent : C.textMuted, border: `1px solid ${filterCat === cat ? C.accentDim : C.border}`, cursor: "pointer" }}>{cat}</button>)}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                  {filtered.map(item => <ResultCard key={item.id} item={item} compact onClick={() => setDetailItem(item)} />)}
                </div>
                {filtered.length === 0 && <p style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: 40 }}>No items match.</p>}
              </>
            )}
          </div>
        )}

        {tab === "collection" && detailItem && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <DetailView item={detailItem} onBack={() => setDetailItem(null)} onDelete={() => deleteItem(detailItem.id)} onLoadDeep={() => loadDeepData(detailItem)} deepLoading={deepLoading} />
          </div>
        )}

        {tab === "guide" && <div style={{ animation: "fadeIn 0.3s ease" }}><GuideView /></div>}

        <footer style={{ textAlign: "center", marginTop: 48, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>RelicID · AI-powered identification & valuation · Not financial advice · getrelicid.com</p>
        </footer>
      </div>
    </div>
  );
}

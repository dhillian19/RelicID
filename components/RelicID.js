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
- CONDITION: Only describe damage or flaws you can clearly see in the photo. If the item looks clean and undamaged, say so. Do NOT invent or assume flaws (scratches, fading, wear) to sound thorough — fabricating condition issues causes wrong valuations.
- VARIANTS: When two or more versions are visually indistinguishable (e.g. Base Set vs Base Set 2, Switch vs Switch OLED, 1st Edition vs Unlimited), do NOT guess. Name both possibilities in item_name (e.g. "Venusaur Base Set 15/102 OR Base Set 2 18/130") and explain in description exactly what physical detail the user should check to tell them apart.
${photoCount > 1 ? "- Consider ALL photos together." : ""}

Respond ONLY with this JSON (no markdown, no backticks):
{
  "object_type": "One of: Physical Object, Printed Media, Screen Capture, Packaging Only",
  "object_type_confidence": "High, Medium, or Low",
  "object_type_note": "Brief explanation if confidence is not High, or if there's ambiguity. null if straightforward.",
  "item_name": "Most specific name possible. For cards: 'Venusaur 15/102 Base Set Unlimited Holo'. For shoes: 'Nike Air Jordan 1 Retro High OG Chicago 2015'. For vintage items: 'Roseville Pottery Pinecone Vase 712-10 Brown'. For printed media: 'Poster depicting [subject]'. For screen captures: name the DEPICTED ITEM, not the screenshot itself (e.g. 'WWF Wrestling Challenge Arcade Cabinet' not 'Screenshot of WWF game'). Always include identifying numbers/editions when visible.",
  "category": "One of: Furniture, Pottery/Porcelain, Glassware, Coins/Currency, Jewelry/Metals, Toys/Games, Art/Prints, Textiles, Books/Ephemera, Tools/Instruments, Clothing/Accessories, Electronics, Trading Cards, Sneakers/Footwear, Gaming/Consoles, Video Games, Vehicles, Other",
  "estimated_era": "Date range or specific year",
  "style_period": "Style, period, set name, or product line",
  "likely_origin": "Country or region",
  "maker": "Brand or maker. Only name specific maker if confirmed by visible marks. Otherwise: 'Unconfirmed — possible: [X, Y, Z].'",
  "materials": ["materials"],
  "condition_notes": "Observable condition. State if graded/slabbed or raw/ungraded. Note specific flaws only if clearly visible in the photo. If item appears clean and undamaged, say so.",
  "condition_grade": "One of: Mint, Near Mint, Excellent, Very Good, Good, Fair, Poor — or 'Graded [grade]' if in a grading slab. null if not a physical object.",
  "key_features": ["Specific identifying details you can see — card numbers, set symbols, edition stamps, maker marks, model numbers, serial numbers, signatures, tags, labels"],
  "search_query": "The most effective search query to find this item's market value. For mass-produced items: be specific with brand, model, set, number, edition. For handmade/unique items: search for COMPARABLE pieces by medium + subject + size (e.g. 'large completed cross stitch pixel art video game sold' or 'handmade wrestling fan art framed sold'). For printed media: search for the print/poster specifically.",
  "is_unique": false,
  "confidence_percent": 75,
  "description": "2-3 sentence summary. Lead with object type if it's NOT a straightforward physical object. Then the specific identification, condition, and notable features. If multiple variants are possible, explain exactly what to look for to tell them apart.",
  "low_estimate": 20,
  "high_estimate": 100,
  "demand_level": "High, Medium, or Low",
  "sell_speed": "Fast, Moderate, or Slow",
  "market_trend": "Rising, Stable, or Declining"
}

IMPORTANT: low_estimate and high_estimate are plain numbers. confidence_percent is a number 0-100. For screen captures, estimate the value of the DEPICTED ITEM but use a wider range to reflect uncertainty. Be as specific as humanly possible in item_name and search_query — vague descriptions produce bad valuations.`;

// DEEP prompt — full valuation with web search (expensive, only on demand)
const DEEP_PROMPT = (info, userExtras) => {
  const trigger = CATEGORY_TRIGGERS[info.category];
  const extrasText = trigger && userExtras && Object.keys(userExtras).some(k => userExtras[k])
    ? `\n\nUSER-PROVIDED DETAILS:\n${trigger.deepInstructions(userExtras)}\nUse these details to narrow your search and improve accuracy.`
    : trigger ? `\n\nUSER-PROVIDED DETAILS:\n${trigger.deepInstructions({})}\n${trigger.missingNote}` : "";

  return `You are a market valuation researcher. Search for recent SOLD prices and current listings for this ${info.is_unique ? "type of item" : "specific item"}.

Item: ${info.item_name}
Object Type: ${info.object_type || "Physical Object"}
${info.is_unique ? "⚠️ UNIQUE / HANDMADE ITEM — no exact match will exist. Search for COMPARABLE pieces.\n" : ""}Era: ${info.estimated_era}
Style/Set: ${info.style_period}
Origin: ${info.likely_origin}
Maker/Brand: ${info.maker}
Category: ${info.category}
Condition: ${info.condition_notes || "Unknown"}
${info.condition_grade ? `Condition Grade: ${info.condition_grade}` : ""}
${info.search_query ? `Suggested Search: ${info.search_query}` : ""}${extrasText}

CRITICAL SEARCH RULES:
1. Use the Suggested Search query as your starting point. If it's specific (includes model numbers, set names, card numbers), search for that EXACT item.
2. Search for SOLD/COMPLETED listings, not just active listings. Sold prices are real market data. Active listings are just asking prices.
3. Match the item's condition when pulling comps. If the item is raw/ungraded, prioritize raw/ungraded sold prices. Do NOT mix graded prices (PSA 8, BGS 9, etc.) with raw prices — they are completely different markets.
4. For each sale you report, include the platform, approximate date, and a brief description. Do NOT include URLs — they will be auto-generated from the item's search query.
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
    {"price": "$45", "platform": "eBay", "date": "Mar 15, 2026", "description": "Same item, raw/ungraded, similar condition"},
    {"price": "$60", "platform": "TCGPlayer", "date": "Mar 10, 2026", "description": "Near Mint condition listing"}
  ],
  "demand_level": "High",
  "sell_speed": "Fast",
  "value_factors": ["Factor 1", "Factor 2"],
  "market_trend": "Stable",
  "where_to_sell": ["eBay", "TCGPlayer"],
  "notes": "Any important caveats about condition, grading, edition, or market volatility"
}

IMPORTANT: low_estimate and high_estimate must be plain numbers reflecting the item's ACTUAL CONDITION (not best-case graded prices). recent_sales must be an array of objects with price, platform, date, and description fields. Only include sales/listings you actually found — never invent data.`;
};

// ─── CATEGORY TRIGGER SYSTEM ──────────────────────────────
const CATEGORY_TRIGGERS = {
  "Vehicles": {
    icon: "🚗", title: "Improve Vehicle Valuation", description: "Year and mileage make a big difference in pricing.",
    fields: [
      { key: "year", label: "Exact Year", type: "number", placeholder: "e.g. 2019" },
      { key: "mileage", label: "Mileage", type: "number", placeholder: "e.g. 45000" },
    ],
    missingNote: "This estimate is based on general market data for similar vehicles. Exact value may vary significantly depending on mileage, condition, and options.",
    deepInstructions: (e) => { let l = []; if (e.year) l.push(`User-confirmed year: ${e.year}`); if (e.mileage) l.push(`User-reported mileage: ${e.mileage} miles`); return l.length ? l.join("\n") : "No additional details provided. Give a broader market estimate."; },
  },
  "Trading Cards": {
    icon: "🃏", title: "Improve Card Valuation", description: "A few details can dramatically narrow the price range.",
    fields: [
      { key: "set_name", label: "Set Name", type: "text", placeholder: "e.g. Base Set, Prismatic Evolutions" },
      { key: "card_number", label: "Card Number", type: "text", placeholder: "e.g. 15/102" },
      { key: "grade", label: "Grade (if graded)", type: "text", placeholder: "e.g. PSA 9, BGS 10" },
      { key: "variant", label: "Variant", type: "text", placeholder: "e.g. 1st Edition, Holo" },
    ],
    missingNote: "Value varies significantly by edition, condition, and grading.",
    deepInstructions: (e) => { let l = []; if (e.set_name) l.push(`Set: ${e.set_name}`); if (e.card_number) l.push(`Card #: ${e.card_number}`); if (e.grade) l.push(`Grade: ${e.grade} — search this EXACT grade`); if (e.variant) l.push(`Variant: ${e.variant}`); return l.length ? l.join("\n") : "No additional details provided."; },
  },
  "Sneakers/Footwear": {
    icon: "👟", title: "Improve Sneaker Valuation", description: "Size and box status affect resale price significantly.",
    fields: [
      { key: "size", label: "Size", type: "text", placeholder: "e.g. Men's 10.5" },
      { key: "with_box", label: "Original Box?", type: "select", options: ["Yes", "No", "Not sure"] },
    ],
    missingNote: "Sneaker resale value depends heavily on size and whether the original box is included.",
    deepInstructions: (e) => { let l = []; if (e.size) l.push(`Size: ${e.size}`); if (e.with_box && e.with_box !== "Not sure") l.push(`Box: ${e.with_box}`); return l.length ? l.join("\n") : "No additional details provided."; },
  },
  "Electronics": {
    icon: "🔌", title: "Improve Electronics Valuation", description: "Storage and working condition matter.",
    fields: [
      { key: "storage", label: "Storage / Capacity", type: "text", placeholder: "e.g. 256GB, 1TB" },
      { key: "working", label: "Working Condition", type: "select", options: ["Fully working", "Partially working", "Not working", "Not sure"] },
    ],
    missingNote: "Value depends on storage capacity, working condition, and included accessories.",
    deepInstructions: (e) => { let l = []; if (e.storage) l.push(`Storage: ${e.storage}`); if (e.working && e.working !== "Not sure") l.push(`Condition: ${e.working}`); return l.length ? l.join("\n") : "No additional details provided."; },
  },
  "Clothing/Accessories": {
    icon: "👔", title: "Improve Clothing Valuation", description: "Size and tags help narrow the price.",
    fields: [
      { key: "size", label: "Size", type: "text", placeholder: "e.g. Large, 32x30" },
      { key: "with_tags", label: "Tags Attached?", type: "select", options: ["Yes — new with tags", "No — tags removed", "Not sure"] },
    ],
    missingNote: "Resale value varies by size, condition, and whether tags are still attached.",
    deepInstructions: (e) => { let l = []; if (e.size) l.push(`Size: ${e.size}`); if (e.with_tags && e.with_tags !== "Not sure") l.push(`Tags: ${e.with_tags}`); return l.length ? l.join("\n") : "No additional details provided."; },
  },
  "Gaming/Consoles": {
    icon: "🎮", title: "Improve Console Valuation", description: "Console name and condition dramatically affect resale value.",
    fields: [
      { key: "console_name", label: "Console Name", type: "text", placeholder: "e.g. Nintendo Switch OLED, PS5 Disc Edition" },
      { key: "storage", label: "Storage / Edition", type: "text", placeholder: "e.g. 256GB, Digital Edition" },
      { key: "working", label: "Working Condition", type: "select", options: ["Fully working", "Partially working", "Not working", "Not sure"] },
    ],
    missingNote: "Console value varies significantly by exact model, storage, and working condition.",
    deepInstructions: (e) => { let l = []; if (e.console_name) l.push(`Console: ${e.console_name}`); if (e.storage) l.push(`Storage/Edition: ${e.storage}`); if (e.working && e.working !== "Not sure") l.push(`Condition: ${e.working}`); return l.length ? l.join("\n") : "No additional details provided."; },
  },
  "Video Games": {
    icon: "🕹️", title: "Improve Game Valuation", description: "Title, platform, and completeness make a big difference.",
    fields: [
      { key: "game_title", label: "Game Title", type: "text", placeholder: "e.g. Zelda: Breath of the Wild" },
      { key: "platform", label: "Platform", type: "text", placeholder: "e.g. Nintendo Switch, PS5, Xbox Series X" },
      { key: "complete", label: "Completeness", type: "select", options: ["Complete in Box (CIB)", "Cart / Disc Only", "Box Only", "Not sure"] },
    ],
    missingNote: "Game value depends heavily on title, platform, and whether it includes box and manual.",
    deepInstructions: (e) => { let l = []; if (e.game_title) l.push(`Game: ${e.game_title}`); if (e.platform) l.push(`Platform: ${e.platform}`); if (e.complete && e.complete !== "Not sure") l.push(`Completeness: ${e.complete}`); return l.length ? l.join("\n") : "No additional details provided."; },
  },
};

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

const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const CACHE_VERSION = "v2"; // bump to invalidate old cache

// ─── DEEP SCAN PRICING ───────────────────────────────────
const DEEP_SCAN_PLANS = [
  { id: "ds15", scans: 15, price: "$2.99", desc: "Great for quick thrift runs" },
  { id: "ds30", scans: 30, price: "$4.99", desc: "Best value for regular use", popular: true },
  { id: "ds60", scans: 60, price: "$9.99", desc: "For serious flippers" },
];
const FREE_DEEP_SCANS = 3; // starter credits for new users

// ─── PLATFORM SEARCH LINKS ──────────────────────────────
function buildSearchUrl(platform, query) {
  const q = encodeURIComponent(query);
  switch (platform?.toLowerCase()) {
    case "ebay": return `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Complete=1&LH_Sold=1&_sop=13`;
    case "tcgplayer": return `https://www.tcgplayer.com/search/all/product?q=${q}`;
    case "mercari": return `https://www.mercari.com/search/?keyword=${q}`;
    case "poshmark": return `https://poshmark.com/search?query=${q}`;
    case "etsy": return `https://www.etsy.com/search?q=${q}`;
    case "amazon": return `https://www.amazon.com/s?k=${q}`;
    case "stockx": return `https://stockx.com/search?s=${q}`;
    case "goat": return `https://www.goat.com/search?query=${q}`;
    case "pricecharting": return `https://www.pricecharting.com/search-products?q=${q}`;
    case "depop": return `https://www.depop.com/search/?q=${q}`;
    case "swappa": return `https://swappa.com/buy/${q}`;
    case "tcgplayer_sold": return `https://www.tcgplayer.com/search/all/product?q=${q}&view=grid&inStock=false&Language=English`;
    default: return `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Complete=1&LH_Sold=1&_sop=13`;
  }
}

// ─── CATEGORY-AWARE PLATFORM LINKS ───────────────────────
function getCategoryPlatforms(category) {
  switch (category) {
    case "Trading Cards": return [{ key: "tcgplayer", label: "TCGPlayer" }, { key: "ebay", label: "eBay Sold" }, { key: "mercari", label: "Mercari" }];
    case "Sneakers/Footwear": return [{ key: "stockx", label: "StockX" }, { key: "goat", label: "GOAT" }, { key: "ebay", label: "eBay Sold" }];
    case "Clothing/Accessories": return [{ key: "poshmark", label: "Poshmark" }, { key: "depop", label: "Depop" }, { key: "ebay", label: "eBay Sold" }];
    case "Electronics": return [{ key: "ebay", label: "eBay Sold" }, { key: "swappa", label: "Swappa" }, { key: "mercari", label: "Mercari" }];
    case "Gaming/Consoles": return [{ key: "ebay", label: "eBay Sold" }, { key: "pricecharting", label: "PriceCharting" }, { key: "mercari", label: "Mercari" }];
    case "Video Games": return [{ key: "pricecharting", label: "PriceCharting" }, { key: "ebay", label: "eBay Sold" }, { key: "mercari", label: "Mercari" }];
    case "Art/Prints": return [{ key: "etsy", label: "Etsy" }, { key: "ebay", label: "eBay Sold" }];
    case "Jewelry/Metals": return [{ key: "ebay", label: "eBay Sold" }, { key: "etsy", label: "Etsy" }, { key: "poshmark", label: "Poshmark" }];
    case "Toys/Games": return [{ key: "ebay", label: "eBay Sold" }, { key: "mercari", label: "Mercari" }, { key: "etsy", label: "Etsy" }];
    case "Books/Ephemera": return [{ key: "ebay", label: "eBay Sold" }, { key: "amazon", label: "Amazon" }, { key: "etsy", label: "Etsy" }];
    default: return [{ key: "ebay", label: "eBay Sold" }, { key: "mercari", label: "Mercari" }];
  }
}

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

// ─── DEEP SCAN CREDITS ────────────────────────────────────
const DAILY_FREE_SCAN_KEY = "relicid-last-daily-scan";

function checkAndGrantDailyScan() {
  try {
    const isNewUser = localStorage.getItem("relicid-deep-credits") == null;
    if (isNewUser) return; // new users get FREE_DEEP_SCANS on first load, not daily yet
    const today = new Date().toDateString();
    const lastGranted = localStorage.getItem(DAILY_FREE_SCAN_KEY);
    if (lastGranted !== today) {
      // Grant 1 free scan for the day
      const current = parseInt(localStorage.getItem("relicid-deep-credits")) || 0;
      localStorage.setItem("relicid-deep-credits", String(current + 1));
      localStorage.setItem(DAILY_FREE_SCAN_KEY, today);
    }
  } catch {}
}

function getDeepScanCredits() {
  try {
    const raw = localStorage.getItem("relicid-deep-credits");
    if (raw == null) {
      // Brand new user — give initial 3 free scans and mark today as granted
      localStorage.setItem("relicid-deep-credits", String(FREE_DEEP_SCANS));
      localStorage.setItem(DAILY_FREE_SCAN_KEY, new Date().toDateString());
      return FREE_DEEP_SCANS;
    }
    // Returning user — check if they get their daily free scan
    checkAndGrantDailyScan();
    return parseInt(localStorage.getItem("relicid-deep-credits")) || 0;
  } catch { return 0; }
}
function setDeepScanCredits(n) {
  try { localStorage.setItem("relicid-deep-credits", String(Math.max(0, n))); } catch {}
}
function deductDeepScan() {
  const current = getDeepScanCredits();
  if (current <= 0) return false;
  setDeepScanCredits(current - 1);
  return true;
}
function addDeepScans(count) {
  const current = getDeepScanCredits();
  setDeepScanCredits(current + count);
  return current + count;
}

// ─── SESSION IDEMPOTENCY ──────────────────────────────────
function isSessionProcessed(sessionId) {
  try {
    const processed = JSON.parse(localStorage.getItem("relicid-processed-sessions") || "[]");
    return processed.includes(sessionId);
  } catch { return false; }
}
function markSessionProcessed(sessionId) {
  try {
    const processed = JSON.parse(localStorage.getItem("relicid-processed-sessions") || "[]");
    processed.push(sessionId);
    // Keep only last 50 to avoid bloat
    if (processed.length > 50) processed.splice(0, processed.length - 50);
    localStorage.setItem("relicid-processed-sessions", JSON.stringify(processed));
  } catch {}
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

async function callDeepValuation(analysis, userExtras) {
  console.log("[RelicID] Deep valuation — calling /api/deep-scan");
  const res = await fetch("/api/deep-scan", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8192, messages: [{ role: "user", content: DEEP_PROMPT(analysis, userExtras) }] }),
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

// ─── COLLECTION STATS ─────────────────────────────────────
function getCollectionStats(items) {
  let totalValue = 0, totalProfit = 0, bestFind = null, highestProfit = null, needsReview = null;
  let bestFindVal = 0, highestProfitVal = -Infinity;
  items.forEach(item => {
    const v = item.valuation;
    const a = item.analysis;
    const low = parseDollar(v?.low_estimate ?? a?.low_estimate);
    const high = parseDollar(v?.high_estimate ?? a?.high_estimate);
    if (low != null && high != null) {
      const avg = (low + high) / 2;
      totalValue += avg;
      if (avg > bestFindVal) { bestFindVal = avg; bestFind = item; }
      if (item.askingPrice != null) {
        const profit = avg - item.askingPrice;
        totalProfit += Math.max(profit, 0);
        if (profit > highestProfitVal) { highestProfitVal = profit; highestProfit = item; }
      }
    }
    if (!needsReview && (a?.confidence_percent || 60) < 50) needsReview = item;
  });
  return { totalValue: Math.round(totalValue), totalProfit: Math.round(totalProfit), bestFind, highestProfit, needsReview, count: items.length };
}

// ─── UI COMPONENTS ─────────────────────────────────────────
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

function RecentSales({ sales, loading, isUnique, searchQuery, category }) {
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
        const isObject = typeof s === "object" && s !== null;
        const text = isObject
          ? `${s.price || "?"} on ${s.platform || "Unknown"} (${s.date || "Recently"}) — ${s.description || "Similar item"}`
          : String(s);
        return (
          <div key={i} style={{ fontSize: 13, color: C.text, padding: "8px 0", borderBottom: i < sales.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: C.accentDim, flexShrink: 0 }}>•</span>
            <span style={{ flex: 1 }}>{text}</span>
          </div>
        );
      })}
      {searchQuery && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Verify Prices</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {getCategoryPlatforms(category).map(p => (
              <a key={p.key} href={buildSearchUrl(p.key, searchQuery)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontFamily: F.mono, padding: "5px 12px", borderRadius: 5, background: C.accentGlow, color: C.accent, border: `1px solid ${C.accentDim}40`, textDecoration: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {p.label} →
              </a>
            ))}
          </div>
        </div>
      )}
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

// ─── PAYWALL MODAL ────────────────────────────────────────
function PaywallModal({ onClose, onPurchase, remaining }) {
  const [selected, setSelected] = useState("ds30");
  const selectedPlan = DEEP_SCAN_PLANS.find(p => p.id === selected);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 420, background: C.bg, borderRadius: 16, border: `1px solid ${C.border}`, padding: "32px 24px", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔬</div>
          <h2 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>Keep Finding Profitable Deals</h2>
          <p style={{ fontSize: 13, color: C.textDim, margin: 0 }}>Run full analysis to see real value, recent sales, and flip potential</p>
          {remaining != null && <div style={{ fontSize: 12, fontFamily: F.mono, color: remaining > 0 ? C.textMuted : C.danger, marginTop: 8 }}>{remaining > 0 ? `${remaining} deep scan${remaining !== 1 ? "s" : ""} remaining` : "No deep scans remaining"}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {DEEP_SCAN_PLANS.map(plan => (
            <div key={plan.id} onClick={() => setSelected(plan.id)} style={{ padding: "16px 18px", background: selected === plan.id ? C.accentGlow : C.bgCard, borderRadius: 12, border: selected === plan.id ? `2px solid ${C.accent}` : `1px solid ${C.border}`, cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
              {plan.popular && <div style={{ position: "absolute", top: -10, right: 16, fontSize: 10, fontFamily: F.mono, padding: "2px 10px", borderRadius: 10, background: C.accent, color: C.bg, fontWeight: 700, letterSpacing: 0.5 }}>MOST POPULAR</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.text }}>{plan.scans} Deep Scans</div>
                  <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{plan.desc}</div>
                </div>
                <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.accent }}>{plan.price}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.textDim, textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>1 good scan can save you $20+ on a bad buy</div>
        <button onClick={() => onPurchase(selectedPlan)} style={{ width: "100%", padding: "14px 24px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", borderRadius: 10, cursor: "pointer", fontFamily: F.display, fontSize: 17, fontWeight: 600, letterSpacing: 0.5 }}>
          Get {selectedPlan?.scans} Deep Scans
        </button>
        <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 10 }}>Quick scans are always free</div>
        <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>⚠️ Credits are saved to this device only. Purchase on the device you plan to use most.</div>
      </div>
    </div>
  );
}

// ─── CREDIT BADGE ─────────────────────────────────────────
function CreditBadge({ remaining, onClick, style }) {
  const isLow = remaining <= 3;
  const isEmpty = remaining <= 0;
  return (
    <div onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 6, background: isEmpty ? `${C.danger}15` : isLow ? `${C.risky}15` : C.bgCard, border: `1px solid ${isEmpty ? C.danger + "40" : isLow ? C.risky + "40" : C.border}`, cursor: onClick ? "pointer" : "default", fontSize: 11, fontFamily: F.mono, ...style }}>
      <span style={{ fontSize: 13 }}>🔬</span>
      <span style={{ color: isEmpty ? C.danger : isLow ? C.risky : C.textMuted }}>
        {isEmpty ? "No deep scans" : `${remaining} deep scan${remaining !== 1 ? "s" : ""}`}
      </span>
      {(isEmpty || isLow) && <span style={{ color: C.accent, fontSize: 10, fontWeight: 600 }}>+ Add</span>}
    </div>
  );
}

// ─── DETAIL VIEW ───────────────────────────────────────────
function DetailView({ item, onBack, onDelete, onLoadDeep, deepLoading, deepScansRemaining, onShowPaywall }) {
  const a = item.analysis;
  const v = item.valuation;
  const hasDeep = !!v;
  const objectType = a?.object_type || "Physical Object";
  const isPhysical = objectType === "Physical Object";
  const isScreen = objectType === "Screen Capture";

  // Category trigger system
  const trigger = CATEGORY_TRIGGERS[a?.category];
  const [showCatPrompt, setShowCatPrompt] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [catExtras, setCatExtras] = useState({});
  const pendingExtras = useRef(null);
  const updateExtra = (key, val) => setCatExtras(prev => ({ ...prev, [key]: val }));

  const handleDeepClick = () => {
    if (deepScansRemaining <= 0) { onShowPaywall(); return; }
    if (trigger && !hasDeep) { setShowCatPrompt(true); } else { pendingExtras.current = null; setShowConfirm(true); }
  };
  const handleDeepWithExtras = () => { setShowCatPrompt(false); pendingExtras.current = catExtras; setShowConfirm(true); };
  const handleSkip = () => { setShowCatPrompt(false); pendingExtras.current = null; setShowConfirm(true); };
  const handleConfirm = () => { setShowConfirm(false); onLoadDeep(pendingExtras.current); };
  const handleCancelConfirm = () => { setShowConfirm(false); };

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
        return `  • ${s.price || "?"} on ${s.platform || "Unknown"} (${s.date || "Recently"}) — ${s.description || "Similar item"}`;
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

          {hasDiscrepancy && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: `${C.info}10`, borderRadius: 6, border: `1px solid ${C.info}30`, fontSize: 12, color: C.info }}>
              📊 Updated with real market data — value differs from initial AI estimate
            </div>
          )}
        </div>
      )}

      {/* ═══ DEEP SCAN CTA ═══ */}
      {!hasDeep && !deepLoading && !showCatPrompt && !showConfirm && (
        <div style={{ padding: 24, background: `linear-gradient(135deg, ${C.accentGlow}, ${C.bgCard})`, borderRadius: 12, border: `1px solid ${C.accent}40`, marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>🔬</div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.accent, marginBottom: 6 }}>Get Real Market Value</div>
          <div style={{ fontSize: 13, color: C.textDim, marginBottom: 14, lineHeight: 1.5 }}>
            Searches real sold listings and live prices to give you an accurate valuation, BUY/PASS verdict, and flip profit calculation.
          </div>
          <button onClick={handleDeepClick} style={{ padding: "12px 36px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: F.display, fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>
            {deepScansRemaining > 0 ? "Run Deep Scan" : "Get Deep Scans"}
          </button>
          <div style={{ marginTop: 10 }}>
            <CreditBadge remaining={deepScansRemaining} onClick={onShowPaywall} />
          </div>
        </div>
      )}

      {/* ═══ DEEP SCAN CONFIRMATION ═══ */}
      {showConfirm && (
        <div style={{ padding: 20, background: C.bgCard, borderRadius: 12, border: `1px solid ${C.accent}40`, marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 6 }}>Run full analysis?</div>
          <div style={{ fontSize: 13, color: C.textDim, marginBottom: 4 }}>This will use 1 deep scan to show market value, recent sales, and flip potential.</div>
          <div style={{ fontSize: 12, fontFamily: F.mono, color: deepScansRemaining <= 3 ? C.risky : C.textMuted, marginBottom: 16 }}>
            {deepScansRemaining === 1 ? "1 scan left — don't miss your next deal" : `${deepScansRemaining} deep scan${deepScansRemaining !== 1 ? "s" : ""} remaining`}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={handleConfirm} style={{ padding: "10px 28px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: F.display, fontSize: 15, fontWeight: 600 }}>Continue</button>
            <button onClick={handleCancelConfirm} style={{ padding: "10px 20px", background: "transparent", color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: F.body, fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ═══ CATEGORY PROMPT ═══ */}
      {showCatPrompt && trigger && (
        <div style={{ padding: 20, background: C.bgCard, borderRadius: 12, border: `1px solid ${C.accent}40`, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{trigger.icon}</span>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.accent }}>{trigger.title}</div>
          </div>
          <div style={{ fontSize: 13, color: C.textDim, marginBottom: 16 }}>{trigger.description}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {trigger.fields.map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 10, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{f.label} <span style={{ color: C.textMuted, fontSize: 9 }}>(optional)</span></div>
                {f.type === "select" ? (
                  <select value={catExtras[f.key] || ""} onChange={e => updateExtra(f.key, e.target.value)} style={{ width: "100%", padding: "10px 12px", background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: F.body, fontSize: 14, outline: "none", appearance: "none" }}>
                    <option value="">Select...</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type || "text"} value={catExtras[f.key] || ""} onChange={e => updateExtra(f.key, e.target.value)} placeholder={f.placeholder} style={{ width: "100%", padding: "10px 12px", background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: F.mono, fontSize: 14, outline: "none" }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleDeepWithExtras} style={{ flex: 1, padding: "12px 20px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: F.display, fontSize: 15, fontWeight: 600 }}>
              Continue Deep Scan
            </button>
            <button onClick={handleSkip} style={{ padding: "12px 20px", background: "transparent", color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: F.body, fontSize: 13 }}>
              Skip
            </button>
          </div>
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

      {/* ═══ DEMAND & SPEED ═══ */}
      <DemandBadges demand={v?.demand_level || a?.demand_level} speed={v?.sell_speed || a?.sell_speed} />

      {/* ═══ DESCRIPTION & DETAILS ═══ */}
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

      {/* ═══ DEEP SCAN DATA ═══ */}
      {hasDeep && (
        <>
          <RecentSales sales={v?.recent_sales} loading={false} isUnique={!!a?.is_unique} searchQuery={a?.search_query || a?.item_name} category={a?.category} />
          {v?.value_factors?.length > 0 && (
            <div style={{ padding: 14, background: C.bgCard, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Value Factors</div>
              {v.value_factors.map((f, i) => <div key={i} style={{ fontSize: 13, color: C.text, padding: "5px 0", borderBottom: i < v.value_factors.length - 1 ? `1px solid ${C.border}` : "none" }}>{f}</div>)}
            </div>
          )}
          {v?.where_to_sell?.length > 0 && (
            <div style={{ padding: 14, background: C.bgCard, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Best Places to Sell</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{v.where_to_sell.map((s, i) => (
                <a key={i} href={buildSearchUrl(s, a?.search_query || a?.item_name)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, padding: "4px 10px", background: C.bg, borderRadius: 4, color: C.accent, border: `1px solid ${C.accentDim}40`, textDecoration: "none", cursor: "pointer" }}>{s} →</a>
              ))}</div>
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

      {/* ═══ POST-SCAN VALUE REINFORCEMENT ═══ */}
      {hasDeep && item.askingPrice != null && (() => {
        const profit = getFlipProfit(item.askingPrice, deepLow, deepHigh);
        const msg = decision === "PASS" && profit != null && profit < 0
          ? `This scan just saved you ~$${Math.abs(profit)} on a bad buy`
          : decision === "BUY" && profit != null && profit > 0
          ? `This could be a $${profit} flip opportunity`
          : null;
        return msg ? (
          <div style={{ padding: "10px 14px", background: `${decision === "PASS" ? C.danger : C.buy}08`, borderRadius: 8, border: `1px solid ${decision === "PASS" ? C.danger : C.buy}20`, marginBottom: 12, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: decision === "PASS" ? C.danger : C.buy, fontWeight: 600 }}>{msg}</div>
          </div>
        ) : null;
      })()}
      {hasDeep && <div style={{ marginBottom: 16 }}><CreditBadge remaining={deepScansRemaining} onClick={onShowPaywall} /></div>}

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


// ─── ADMIN HEADER ─────────────────────────────────────────
function AdminHeader({ onUnlock }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const holdTimer = useRef(null);

  const handlePressStart = () => {
    holdTimer.current = setTimeout(() => setShowPrompt(true), 3000);
  };
  const handlePressEnd = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };
  const handleSubmit = () => {
    if (code === "4521") {
      setShowPrompt(false);
      setCode("");
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setCode("");
    }
  };

  return (
    <>
      <h1
        onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
        style={{ fontFamily: F.display, fontSize: "clamp(30px, 6vw, 46px)", fontWeight: 700, margin: 0, lineHeight: 1.1, background: `linear-gradient(135deg, ${C.accent}, #e8d5a0, ${C.accentDim})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", cursor: "default", userSelect: "none" }}
      >RelicID</h1>
      {showPrompt && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={() => { setShowPrompt(false); setCode(""); setError(false); }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "relative", background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: "28px 24px", width: "100%", maxWidth: 300, textAlign: "center" }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: C.textMuted, marginBottom: 16, letterSpacing: 1 }}>ENTER CODE</div>
            <input
              type="password" value={code} onChange={e => { setCode(e.target.value); setError(false); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus maxLength={6}
              style={{ width: "100%", padding: "12px", background: C.bgSurface, border: `1px solid ${error ? C.danger : C.border}`, borderRadius: 6, color: C.text, fontFamily: F.mono, fontSize: 20, textAlign: "center", outline: "none", letterSpacing: 4, marginBottom: 12 }}
            />
            {error && <div style={{ fontSize: 11, color: C.danger, marginBottom: 8 }}>Invalid code</div>}
            <button onClick={handleSubmit} style={{ width: "100%", padding: "10px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: F.display, fontSize: 15, fontWeight: 600 }}>Submit</button>
          </div>
        </div>
      )}
    </>
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
  const [deepScansRemaining, setDeepScansRemaining] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState(null);

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
  const scanLock = useRef(false);

  useEffect(() => {
    loadCollection().then(items => { setCollection(items); setLoaded(true); });
    setDeepScansRemaining(getDeepScanCredits());

    // Handle post-purchase redirect from Stripe
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId && !isSessionProcessed(sessionId)) {
      fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.verified && data.scans > 0) {
            markSessionProcessed(sessionId);
            const newTotal = addDeepScans(data.scans);
            setDeepScansRemaining(newTotal);
            setPurchaseMsg(`+${data.scans} Deep Scans added`);
            setTimeout(() => setPurchaseMsg(null), 4000);
          }
        })
        .catch(err => console.error("[RelicID] Session verify failed:", err))
        .finally(() => {
          window.history.replaceState({}, "", window.location.pathname);
        });
    }
  }, []);

  const hasAnyPhoto = photos.some(p => p.dataUrl);
  const activePhotos = photos.filter(p => p.base64);

  const handlePurchase = async (plan) => {
    try {
      setPurchaseMsg("Redirecting to checkout...");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === "Price not configured") {
        const newTotal = addDeepScans(plan.scans);
        setDeepScansRemaining(newTotal);
        setShowPaywall(false);
        setPurchaseMsg(`+${plan.scans} Deep Scans added (test mode)`);
        setTimeout(() => setPurchaseMsg(null), 4000);
      } else {
        setPurchaseMsg(null);
        setError(data.error || "Checkout failed");
      }
    } catch (err) {
      console.error("[RelicID] Checkout error:", err);
      setPurchaseMsg(null);
      setError("Could not connect to payment system");
    }
  };

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

  const runScan = async () => {
    if (activePhotos.length === 0 || scanLock.current) return;

    scanLock.current = true;
    setAnalyzing(true); setError(null); setScanResult(null);

    try {
      const compressed = await Promise.all(activePhotos.map(p => compressImage(p.dataUrl)));
      const compressedBase64 = compressed.map(d => d.split(",")[1]);

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

      await setCachedResult(cacheKey, newItem);
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

  const loadDeepData = async (item, userExtras) => {
    if (deepLoading) return;
    if (!deductDeepScan()) { setShowPaywall(true); return; }
    setDeepScansRemaining(getDeepScanCredits());
    setDeepLoading(true);
    try {
      const deep = await callDeepValuation(item.analysis, userExtras);
      const fallback = { low_estimate: "N/A", high_estimate: "N/A", recent_sales: [], demand_level: "Unknown", sell_speed: "Unknown", value_factors: [], market_trend: "Unknown", where_to_sell: [], notes: "Could not parse." };
      const valuation = deep ? { ...fallback, ...deep } : fallback;

      const updated = { ...item, valuation };
      if (scanResult?.id === item.id) setScanResult(updated);
      if (detailItem?.id === item.id) setDetailItem(updated);
      const newColl = collection.map(c => c.id === item.id ? updated : c);
      setCollection(newColl);
      await saveCollection(newColl);
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
          <AdminHeader onUnlock={() => {
            addDeepScans(9999);
            setDeepScansRemaining(getDeepScanCredits());
            setPurchaseMsg("🔓 Admin mode activated");
            setTimeout(() => setPurchaseMsg(null), 3000);
          }} />
          <p style={{ fontFamily: F.body, fontWeight: 300, fontSize: 14, color: C.textMuted, marginTop: 4, letterSpacing: 0.5 }}>Scan anything. See what it's worth.</p>
        </header>

        <TabBar active={tab} onChange={(t) => { setTab(t); setDetailItem(null); }} counts={collection.length} />

        {/* ─── SCAN TAB ─── */}
        {tab === "scan" && !scanResult && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>Upload Photos</h2>
              <CreditBadge remaining={deepScansRemaining} onClick={() => setShowPaywall(true)} />
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

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={runScan} disabled={!hasAnyPhoto || analyzing} style={{
                flex: 1, padding: "14px 24px", fontFamily: F.display, fontSize: 16, fontWeight: 600,
                background: hasAnyPhoto ? `linear-gradient(135deg, ${C.accent}, ${C.accentDim})` : C.bgCard,
                color: hasAnyPhoto ? C.bg : C.textMuted, border: "none", borderRadius: 8,
                cursor: hasAnyPhoto ? "pointer" : "not-allowed", letterSpacing: 0.5,
              }}>
                {analyzing ? "🔎 Examining..." : "🔍 Quick Scan"}
              </button>
              {hasAnyPhoto && <button onClick={resetScan} style={{ padding: "14px 20px", background: C.bgCard, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: F.body, fontSize: 13 }}>Clear</button>}
            </div>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>Quick scans are always free</span>
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
            <DetailView item={scanResult} onBack={resetScan} onDelete={() => { deleteItem(scanResult.id); resetScan(); }} onLoadDeep={(extras) => loadDeepData(scanResult, extras)} deepLoading={deepLoading} deepScansRemaining={deepScansRemaining} onShowPaywall={() => setShowPaywall(true)} />
          </div>
        )}

        {tab === "collection" && !detailItem && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {collection.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: C.bgSurface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📦</div>
                <p style={{ fontFamily: F.display, fontSize: 18, color: C.textDim, margin: "0 0 8px" }}>No items yet</p>
                <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px" }}>Scan your first item to start building your collection.</p>
                <button onClick={() => setTab("scan")} style={{ padding: "10px 28px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: F.display, fontSize: 14, fontWeight: 600 }}>Start Scanning</button>
              </div>
            ) : (() => {
              const stats = getCollectionStats(collection);
              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                    <div style={{ padding: "16px 12px", background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, textAlign: "center" }}>
                      <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Collection Value</div>
                      <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.accent }}>${stats.totalValue.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: "16px 12px", background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, textAlign: "center" }}>
                      <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Flip Potential</div>
                      <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: stats.totalProfit > 0 ? C.buy : C.textMuted }}>{stats.totalProfit > 0 ? "+" : ""}${stats.totalProfit.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: "16px 12px", background: C.bgCard, borderRadius: 10, border: `1px solid ${C.border}`, textAlign: "center" }}>
                      <div style={{ fontSize: 9, fontFamily: F.mono, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Items</div>
                      <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.text }}>{stats.count}</div>
                    </div>
                  </div>

                  {(stats.bestFind || stats.highestProfit || stats.needsReview) && (
                    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, marginBottom: 20, WebkitOverflowScrolling: "touch" }}>
                      {stats.bestFind && (() => {
                        const ba = stats.bestFind.analysis;
                        const bv = stats.bestFind.valuation;
                        const bLow = parseDollar(bv?.low_estimate ?? ba?.low_estimate);
                        const bHigh = parseDollar(bv?.high_estimate ?? ba?.high_estimate);
                        const avg = bLow != null && bHigh != null ? Math.round((bLow + bHigh) / 2) : null;
                        return (
                          <div onClick={() => setDetailItem(stats.bestFind)} style={{ flexShrink: 0, width: 160, padding: 12, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.accent}30`, cursor: "pointer" }}>
                            <div style={{ fontSize: 11, color: C.accent, fontFamily: F.mono, marginBottom: 6 }}>🔥 Best Find</div>
                            {stats.bestFind.thumbnail && <div style={{ width: "100%", aspectRatio: "1", borderRadius: 6, overflow: "hidden", marginBottom: 8, background: C.bgSurface }}><img src={stats.bestFind.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                            <div style={{ fontSize: 12, color: C.text, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ba?.item_name}</div>
                            {avg != null && <div style={{ fontSize: 14, fontFamily: F.display, fontWeight: 700, color: C.accent }}>${avg}</div>}
                          </div>
                        );
                      })()}
                      {stats.highestProfit && stats.highestProfit.askingPrice != null && (() => {
                        const ha = stats.highestProfit.analysis;
                        const hv = stats.highestProfit.valuation;
                        const hLow = parseDollar(hv?.low_estimate ?? ha?.low_estimate);
                        const hHigh = parseDollar(hv?.high_estimate ?? ha?.high_estimate);
                        const profit = hLow != null && hHigh != null ? Math.round((hLow + hHigh) / 2 - stats.highestProfit.askingPrice) : null;
                        return profit != null && profit > 0 ? (
                          <div onClick={() => setDetailItem(stats.highestProfit)} style={{ flexShrink: 0, width: 160, padding: 12, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.buy}30`, cursor: "pointer" }}>
                            <div style={{ fontSize: 11, color: C.buy, fontFamily: F.mono, marginBottom: 6 }}>💰 Top Profit</div>
                            {stats.highestProfit.thumbnail && <div style={{ width: "100%", aspectRatio: "1", borderRadius: 6, overflow: "hidden", marginBottom: 8, background: C.bgSurface }}><img src={stats.highestProfit.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                            <div style={{ fontSize: 12, color: C.text, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ha?.item_name}</div>
                            <div style={{ fontSize: 14, fontFamily: F.display, fontWeight: 700, color: C.buy }}>+${profit}</div>
                          </div>
                        ) : null;
                      })()}
                      {stats.needsReview && (
                        <div onClick={() => setDetailItem(stats.needsReview)} style={{ flexShrink: 0, width: 160, padding: 12, background: C.bgCard, borderRadius: 10, border: `1px solid ${C.danger}30`, cursor: "pointer" }}>
                          <div style={{ fontSize: 11, color: C.danger, fontFamily: F.mono, marginBottom: 6 }}>⚠️ Needs Review</div>
                          {stats.needsReview.thumbnail && <div style={{ width: "100%", aspectRatio: "1", borderRadius: 6, overflow: "hidden", marginBottom: 8, background: C.bgSurface }}><img src={stats.needsReview.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                          <div style={{ fontSize: 12, color: C.text, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stats.needsReview.analysis?.item_name}</div>
                          <div style={{ fontSize: 11, color: C.danger }}>Low confidence</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search items..." style={{ flex: "1 1 200px", padding: "10px 14px", background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: F.body, fontSize: 13, outline: "none" }} />
                  </div>
                  {categories.length > 2 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
                      {categories.map(cat => <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: "5px 12px", fontSize: 10, fontFamily: F.mono, borderRadius: 4, background: filterCat === cat ? C.accentGlow : "transparent", color: filterCat === cat ? C.accent : C.textMuted, border: `1px solid ${filterCat === cat ? C.accentDim : C.border}`, cursor: "pointer" }}>{cat}</button>)}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                    {filtered.map(item => <ResultCard key={item.id} item={item} compact onClick={() => setDetailItem(item)} />)}
                  </div>
                  {filtered.length === 0 && <p style={{ textAlign: "center", color: C.textMuted, fontSize: 14, padding: 40 }}>No items match.</p>}

                  <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 10 }}>
                    <button onClick={() => setTab("scan")} style={{ width: 56, height: 56, borderRadius: 28, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, border: "none", cursor: "pointer", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(201,165,85,0.4)" }}>+</button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {tab === "collection" && detailItem && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <DetailView item={detailItem} onBack={() => setDetailItem(null)} onDelete={() => deleteItem(detailItem.id)} onLoadDeep={(extras) => loadDeepData(detailItem, extras)} deepLoading={deepLoading} deepScansRemaining={deepScansRemaining} onShowPaywall={() => setShowPaywall(true)} />
          </div>
        )}

        {tab === "guide" && <div style={{ animation: "fadeIn 0.3s ease" }}><GuideView /></div>}

        <footer style={{ textAlign: "center", marginTop: 48, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>RelicID · AI-powered identification & valuation · Not financial advice · getrelicid.com</p>
        </footer>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} onPurchase={handlePurchase} remaining={deepScansRemaining} />}

      {purchaseMsg && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 110, padding: "12px 24px", background: C.success, color: "#fff", borderRadius: 10, fontFamily: F.body, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: "fadeIn 0.3s ease" }}>
          {purchaseMsg}
        </div>
      )}
    </div>
  );
}

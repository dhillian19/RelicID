import "./globals.css";

export const metadata = {
  title: "RelicID — AI-Powered Antique Identification & Valuation",
  description: "Snap a photo of any antique. Get instant identification, market value, and BUY/PASS verdicts powered by AI and live auction data.",
  keywords: "antique identifier, antique valuation, antique appraisal, antique scanner, relic identification",
  openGraph: {
    title: "RelicID — Snap it. Know it. Flip it.",
    description: "AI-powered antique identification and valuation. Get instant BUY/PASS verdicts with real market data.",
    url: "https://getrelicid.com",
    siteName: "RelicID",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Nunito+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0f0e0b" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}

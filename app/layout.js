import "./globals.css";

export const metadata = {
  title: "RelicID — Scan Anything. See What It's Worth.",
  description: "Point your camera at any item and instantly get an ID, real market value, and a clear BUY or PASS recommendation. Works on clothes, collectibles, electronics, and more.",
  keywords: "item identifier, value scanner, price checker, what is this worth, thrift finds, resale value, flip profit, garage sale app",
  openGraph: {
    title: "RelicID — Scan Anything. See What It's Worth.",
    description: "AI-powered identification and valuation. Snap a photo, get real market value, and know instantly if it's a good deal.",
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

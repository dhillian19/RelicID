import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "RelicID — AI Antique & Collectible Identifier | See What It's Worth",
  description: "Instantly identify antiques, collectibles, trading cards, sneakers, jewelry, Hot Wheels, and more. Get real market value and BUY/PASS verdict from actual sold listings. Free to try.",
  keywords: "antique identifier, collectible identifier, what is this worth, item value scanner, trading card identifier, hot wheels value, antique price guide, thrift store finds, garage sale app, pokemon card scanner, sports card value, jewelry identifier, vintage item value, AI price checker, resale value app, flip profit calculator, eBay price checker, TCGPlayer price, antique appraisal app, collectible price guide",
  openGraph: {
    title: "RelicID — AI Antique & Collectible Identifier | See What It's Worth",
    description: "Point your camera at any antique, collectible, or item and instantly get an ID, real market value, and a clear BUY or PASS recommendation. Trading cards, Hot Wheels, jewelry, vintage items and more.",
    url: "https://getrelicid.com",
    siteName: "RelicID",
    type: "website",
    images: [
      {
        url: "https://getrelicid.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "RelicID — Scan anything. See what it's worth.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RelicID — AI Antique & Collectible Identifier",
    description: "Instantly identify antiques, collectibles, trading cards, Hot Wheels, jewelry and more. Get real market value from actual sold listings.",
  },
  alternates: {
    canonical: "https://getrelicid.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
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
        <meta name="application-name" content="RelicID" />
        <meta name="apple-mobile-web-app-title" content="RelicID" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "RelicID",
              "url": "https://getrelicid.com",
              "description": "AI-powered antique and collectible identifier. Scan any item to get instant identification, real market value from sold listings, and a BUY or PASS recommendation.",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Web, iOS, Android",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free to start — 3 free deep scans included"
              },
              "featureList": [
                "AI item identification",
                "Real market value from sold listings",
                "Trading card identification and pricing",
                "Antique and collectible appraisal",
                "Hot Wheels value checker",
                "Jewelry identification",
                "BUY/PASS flip verdict",
                "Flip profit calculator"
              ]
            })
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

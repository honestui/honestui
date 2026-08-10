import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { absoluteUrl, SITE_URL } from "@/lib/utils";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
} from "@/globals/constants/site";
import "./globals.css";

const loveUI = localFont({
  src: [
    {
      path: "../public/fonts/LoveSans-Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-LightItalic.woff",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-RegularItalic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-MediumItalic.woff",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Semibold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-SemiboldItalic.woff",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/LoveSans-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/LoveSans-BoldItalic.woff",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-love-ui",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s - Honest UI",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: SITE_KEYWORDS,
  authors: [{ name: "Connor Love", url: "https://x.com/cando145" }],
  creator: "Connor Love",
  publisher: "Honest UI",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og/og-image.png",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@cando145",
    images: ["/og/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// "/" only redirects, so entity urls point at /docs, the canonical 200 URL the
// sitemap advertises. The #fragment @ids stay anchored to the bare origin: they
// are opaque identifiers, and the docs pages reference them cross-page.
const canonicalHome = absoluteUrl("/docs");

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: canonicalHome,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: canonicalHome,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.svg"),
      },
      sameAs: [
        "https://github.com/honestui/honestui",
        "https://x.com/cando145",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: canonicalHome,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      license: "https://github.com/honestui/honestui/blob/main/LICENSE",
      softwareHelp: { "@type": "CreativeWork", url: absoluteUrl("/docs") },
      author: {
        "@type": "Person",
        name: "Connor Love",
        url: "https://x.com/cando145",
      },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#151718" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${loveUI.variable} ${jetbrainsMono.variable}`}
      data-scroll-behavior="smooth"
      data-style="modern"
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // Escape "<" so no value can smuggle in a premature </script>.
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider
          defaultTheme="system"
          attribute={["class", "data-theme"]}
        >
          <VercelAnalytics />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

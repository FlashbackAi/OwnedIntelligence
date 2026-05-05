import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const nevera = localFont({
  src: "../public/fonts/Nevera-Regular.otf",
  variable: "--font-nevera",
  display: "swap",
  weight: "400",
});

const glitchGoblin = localFont({
  src: "../public/fonts/GlitchGoblin-2O87v.ttf",
  variable: "--font-glitch",
  display: "swap",
  weight: "400",
});

const hydrogen = localFont({
  src: "../public/fonts/hydrogen.ttf",
  variable: "--font-hydrogen",
  display: "swap",
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://flashbacklabs.com";
const siteName = "Flashback Labs";
const siteTitle =
  "Flashback Labs | Private Personal AI for Memory and Context";
const siteDescription =
  "Flashback Labs builds private, human-controlled personal AI with long-term memory, local-first infrastructure, and context that stays under your control.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Flashback Labs",
    "Flashback AI",
    "personal AI",
    "private AI",
    "AI memory",
    "local-first AI",
    "human-controlled AI",
    "personal assistant AI",
    "context engine",
    "on-device AI",
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/flashback.jpg", type: "image/jpeg" }],
    shortcut: [{ url: "/flashback.jpg", type: "image/jpeg" }],
    apple: [{ url: "/flashback.jpg", type: "image/jpeg" }],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName,
    images: [
      {
        url: "/flashback.jpg",
        width: 1200,
        height: 630,
        alt: "Flashback Labs logo",
        type: "image/jpeg",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/flashback.jpg"],
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/flashback.jpg`,
      description: siteDescription,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#flashback-ai`,
      name: "Flashback AI",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "iOS, Android, Web",
      description:
        "A private personal AI assistant focused on memory, context, and human-controlled workflows.",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      url: siteUrl,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nevera.variable} ${glitchGoblin.variable} ${hydrogen.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="min-h-full bg-paper text-ink font-sans">
        {children}
      </body>
    </html>
  );
}

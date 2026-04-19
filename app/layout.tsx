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

export const metadata: Metadata = {
  title: "Flashback Labs — Your Personal Jarvis",
  description:
    "Flashback Labs builds nonautonomous, private, personal AI. An intelligence that amplifies humans rather than replacing them — private by design, yours forever.",
  metadataBase: new URL("https://flashbacklabs.io"),
  openGraph: {
    title: "Flashback Labs — Your Personal Jarvis",
    description:
      "Nonautonomous, private, personal AI. An intelligence that amplifies humans — never replaces them.",
    url: "https://flashbacklabs.io",
    siteName: "Flashback Labs",
    type: "website",
  },
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
      <body className="min-h-full bg-paper text-ink font-sans">
        {children}
      </body>
    </html>
  );
}

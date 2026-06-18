import "./globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const publicSans = Public_Sans({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
});

const sourceSerif = Source_Serif_4({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-serif",
});

const gaId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

export const metadata: Metadata = {
  metadataBase: new URL("https://dof.toniotgz.com"),
  title: {
    default: "Diario Oficial de la Federación",
    template: "%s | Diario Oficial de la Federación",
  },
  description:
    "El registro oficial de México, al alcance de una búsqueda. Decretos, acuerdos, normas y resoluciones publicados por el Estado mexicano.",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://dof.toniotgz.com/",
    siteName: "Diario Oficial de la Federación",
    title: "Diario Oficial de la Federación",
  },
  twitter: {
    card: "summary_large_image",
    site: "@toniotgz",
    creator: "@toniotgz",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#1a4d7a" },
    ],
  },
  manifest: "/site.webmanifest",
  other: { "msapplication-TileColor": "#1a4d7a" },
};

export const viewport: Viewport = {
  themeColor: "#fdfdfc",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${publicSans.variable} ${sourceSerif.variable}`}
    >
      <body className="font-sans antialiased flex min-h-screen flex-col">
        <a
          href="#contenido"
          className="sr-only rounded-md bg-accent px-4 py-2 text-[14px] font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60]"
        >
          Saltar al contenido
        </a>
        <Header />
        <div id="contenido" className="grow">
          {children}
        </div>
        <Footer />
        <Analytics />
      </body>
      {process.env.NODE_ENV === "production" && gaId ? (
        <GoogleAnalytics gaId={gaId} />
      ) : null}
    </html>
  );
}

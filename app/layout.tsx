import "./globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Roboto } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

const gaId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

export const metadata: Metadata = {
  metadataBase: new URL("https://dof.toniotgz.com"),
  title: {
    default: "Diaro Oficial de la Fedaración",
    template: "%s | Diaro Oficial de la Fedaración",
  },
  description: "Diario Oficial de la Federación",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://dof.toniotgz.com/",
    siteName: "Diaro Oficial de la Fedaración",
    title: "Diaro Oficial de la Fedaración",
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
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#6c6c6c" },
    ],
  },
  manifest: "/site.webmanifest",
  other: { "msapplication-TileColor": "#ffc40d" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={roboto.variable}>
      <body className="font-sans antialiased flex flex-col items-stretch min-h-screen">
        <Header />
        <main className="grow w-full max-w-(--breakpoint-lg) mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
      {process.env.NODE_ENV === "production" && gaId ? (
        <GoogleAnalytics gaId={gaId} />
      ) : null}
    </html>
  );
}

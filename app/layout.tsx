import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { getLocale } from "@/lib/i18n";
import { I18nProvider } from "@/components/i18n-provider";
import "./globals.css";

const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

const clashDisplay = localFont({
  src: [
    { path: "./fonts/ClashDisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ClashDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-clash-display",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Barista Gigs — coffee shifts, covered",
    template: "%s · Barista Gigs",
  },
  description:
    "Barista Gigs connects specialty cafés with skilled freelance baristas for one-off shifts across Europe.",
  openGraph: {
    siteName: "Barista Gigs",
    type: "website",
    locale: "en_US",
    images: [{ url: "/mascot.png", width: 300, height: 277, alt: "Barista Gigs" }],
  },
  twitter: { card: "summary" },
};

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Barista Gigs",
  url: BASE_URL,
  logo: `${BASE_URL}/mascot.png`,
  description:
    "A marketplace connecting specialty cafés with freelance baristas for one-off shifts.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${generalSans.variable} ${clashDisplay.variable} min-h-dvh`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Analytics />
          <I18nProvider locale={locale}>
            {children}
          </I18nProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--surface-raised)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "B2B Toptan Gıda & Restoran Tedarik Pazaryeri | Cari Hesap & Sözleşmeli Fiyat",
    template: "%s | B2B Toptan Gıda Pazaryeri",
  },
  description:
    "Türkiye'nin önde gelen restoranları, otelleri ve toptan gıda distribütörlerini buluşturan B2B pazar yeri. Cari hesap yönetimi, net vadeli ödeme, sözleşmeli özel fiyat listeleri ve toplu sevkiyat kolaylığı.",
  keywords: [
    "B2B gıda toptan",
    "restoran tedarik",
    "gıda toptancıları",
    "cari hesap toptan",
    "otel gıda tedarik",
    "HoReCa toptan",
    "toptan bakliyat un yağ",
    "sözleşmeli toptan fiyat",
    "koli çuval toptan satış",
    "toptan gıda pazaryeri",
  ],
  authors: [{ name: "B2B Food Wholesale Platform" }],
  creator: "B2B Food Wholesale Platform",
  publisher: "B2B Food Wholesale Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://your-app.vercel.app"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "B2B Toptan Gıda & Restoran Tedarik Pazaryeri",
    description:
      "Restoranlar ve toptan gıda distribütörleri için yeni nesil B2B ticaret platformu. Cari limitler, vadeli alımlar ve sözleşmeli fiyatlar.",
    url: "/",
    siteName: "B2B Toptan Gıda",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "B2B Toptan Gıda & Restoran Tedarik Pazaryeri",
    description:
      "Cari hesap yönetimi ve sözleşmeli fiyatlandırma ile restoran ve toptancıları buluşturan B2B gıda pazaryeri.",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GarMinas — A Connection That Leads to Forever",
  description:
    "GarMinas is an exclusive matrimonial community for adult Ismailis connected to Gilgit-Baltistan. Trust, privacy, and meaningful marriage proposals.",
  keywords: [
    "GarMinas",
    "Ismaili matrimonial",
    "Gilgit-Baltistan marriage",
    "matrimonial platform",
    "marriage proposals",
  ],
  authors: [{ name: "GarMinas" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "GarMinas — A Connection That Leads to Forever",
    description:
      "An exclusive matrimonial community for adult Ismailis connected to Gilgit-Baltistan.",
    siteName: "GarMinas",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

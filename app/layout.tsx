import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/context/LocaleContext";
import TrackingScript from "@/components/TrackingScript";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ViralBoost AI - AI-Powered Video Analysis Platform",
  description: "Analyze and optimize your social media videos to predict viral potential",
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  openGraph: {
    title: "ViralBoost AI - AI-Powered Video Analysis Platform",
    description: "Analyze and optimize your social media videos to predict viral potential",
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LocaleProvider>
          <TrackingScript />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}

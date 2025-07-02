import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Healthcare Platform - Quality Healthcare for Everyone",
  description: "AI-powered digital health platform providing symptom checking, telemedicine services, and health guidance in multiple languages for underserved communities.",
  keywords: "healthcare, AI, telemedicine, symptom checker, multilingual, health guidance",
  authors: [{ name: "AI Healthcare Platform Team" }],
  robots: "index, follow",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "AI Healthcare Platform",
    description: "Quality healthcare for everyone, anywhere",
    type: "website",
    locale: "en_US",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}

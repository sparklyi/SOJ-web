import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-soj-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-soj-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOJ",
  description: "Signal Arena for problem solving and programming contests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

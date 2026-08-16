import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { createTranslator } from "@/lib/i18n/translate";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-soj-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-soj-mono",
  subsets: ["latin"],
});

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: RootLayoutProps): Promise<Metadata> {
  const { locale: value } = await params;
  if (!isLocale(value)) notFound();
  const t = createTranslator(value);
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale: value } = await params;
  if (!isLocale(value)) notFound();
  const locale: Locale = value;

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}

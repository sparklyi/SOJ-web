import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppAtmosphere } from "@/components/fx/app-atmosphere";
import { AppProviders } from "@/components/providers/app-providers";
import { createTranslator } from "@/lib/i18n/translate";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { displayFont, monoFont, sansFont } from "../fonts/fonts";
import "../globals.css";

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
    <html
      lang={locale}
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body>
        {/* 环境层挂在根布局：整站共享一套背景与光照，任何页面都不会漏掉。
            它固定定位在 z-0，所以正文必须自己抬到 z-10 之上——
            否则固定层会盖住静态内容（定位元素在绘制顺序里晚于普通流内容）。 */}
        <AppAtmosphere />
        <AppProviders locale={locale}>
          <div className="relative z-10">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}

"use client";

import { ArrowRight } from "lucide-react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import { CountUp } from "@/components/fx/count-up";
import styles from "./home-hero.module.css";

type HeroFact = {
  label: string;
  value: number;
  suffix?: string;
  /**
   * 小数位必须由调用方给定。
   * 首屏默认按整数滚动，若把 31.6 交给它就会渲染成 32，
   * 而页面别处同一个指标写的是 31.6% —— 同一个数字两种写法，
   * 是这类页面最容易被一眼看穿的破绽。
   */
  decimals?: number;
};

type HomeHeroProps = {
  /** 只放「新访客据此判断要不要留下来」的事实，不放运营指标。 */
  facts?: HeroFact[];
};

/**
 * 首页首屏。
 *
 * 它自己**不画背景**。整站的流场、网格、双光源、暗角都由根布局的 AppAtmosphere
 * 提供，首屏只是把面板做成半透明，让同一个环境从它下面透上来。
 *
 * 这是上一版最大的问题所在：那版在首屏内部挂了一个 canvas，
 * 于是首屏成了「一块自带背景的黑盒子」——盒子里有粒子，盒子外什么都没有，
 * 换一个页面就完全感受不到这个环境，效果自然读成「硬凑」。
 * 现在首屏是环境的一个窗口，而不是环境的替代品。
 *
 * 首屏自己只保留两件必须局部化的东西：
 *   1. 一团更收敛的光，把视线钉在标题区域（全局光是整页的大范围铺色）
 *   2. 右缘刻度，仪器感来自「这里被测量过」
 */
export function HomeHero({ facts = [] }: HomeHeroProps) {
  const { t, locale } = useI18n();

  return (
    <section className={styles.hero} data-home-hero aria-labelledby="soj-hero-title">
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.measure} aria-hidden="true">
        <span className={styles.measureMinor} />
        <span className={styles.measureMajor} />
      </div>

      <div className={styles.content}>
        <p className={styles.eyebrow}>{t("nav.brandTagline")}</p>
        <h1 className={styles.title} id="soj-hero-title">
          SOJ
        </h1>
        <p className={styles.statement}>{t("home.statement")}</p>
        <div className={styles.actions}>
          <LocalizedLink className={buttonVariants({ size: "lg" })} href="/problems">
            {t("home.exploreProblems")}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </LocalizedLink>
          <LocalizedLink className={buttonVariants({ variant: "outline", size: "lg" })} href="/contests">
            {t("home.enterContests")}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </LocalizedLink>
        </div>
      </div>

      {facts.length > 0 ? (
        <dl className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.label} className={styles.fact}>
              <dt>{fact.label}</dt>
              <dd>
                <CountUp value={fact.value} locale={locale} decimals={fact.decimals ?? 0} />
                {fact.suffix ? <span className={styles.factSuffix}>{fact.suffix}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

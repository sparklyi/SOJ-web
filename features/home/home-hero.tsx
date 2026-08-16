"use client";

import { useRef } from "react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { AlgorithmSculpture } from "./algorithm-sculpture";
import { useHomeHeroMotion } from "./use-home-hero-motion";
import styles from "./home-hero.module.css";

export function HomeHero() {
  const rootRef = useRef<HTMLElement>(null);
  const { t } = useI18n();
  useHomeHeroMotion(rootRef);

  return (
    <section ref={rootRef} className={styles.hero} data-home-hero data-motion-state="static">
      <div className={styles.atmosphere} aria-hidden="true">
        <span className={styles.horizon} />
        <span className={styles.greenField} />
        <span className={styles.blueField} />
      </div>

      <div className={styles.visualStage} data-hero-stage aria-hidden="true">
        <div className={styles.parallax} data-hero-parallax>
          <AlgorithmSculpture />
        </div>
      </div>

      <div className={styles.content} data-hero-copy>
        <p className={styles.eyebrow}>{t("nav.signalOnlineJudge").toUpperCase()}</p>
        <h1 className={styles.title}>SOJ</h1>
        <p className={styles.statement}>{t("home.statement")}</p>
        <div className={styles.actions}>
          <LocalizedLink className={styles.primaryAction} href="/problems">
            {t("home.exploreProblems")} <span aria-hidden="true">↗</span>
          </LocalizedLink>
          <LocalizedLink className={styles.secondaryAction} href="/contests">
            {t("home.enterContests")} <span aria-hidden="true">↗</span>
          </LocalizedLink>
        </div>
      </div>

      <div className={styles.footerLine} aria-hidden="true">
        <span>01</span>
        <span className={styles.footerRule} />
        <span>{t("home.scrollToExplore")}</span>
      </div>
    </section>
  );
}

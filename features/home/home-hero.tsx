"use client";

import Link from "next/link";
import { useRef } from "react";
import { AlgorithmSculpture } from "./algorithm-sculpture";
import { useHomeHeroMotion } from "./use-home-hero-motion";
import styles from "./home-hero.module.css";

export function HomeHero() {
  const rootRef = useRef<HTMLElement>(null);
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
        <p className={styles.eyebrow}>SIGNAL ONLINE JUDGE</p>
        <h1 className={styles.title}>SOJ</h1>
        <p className={styles.statement}>Think in algorithms. Prove every answer.</p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/problems">
            Explore problems <span aria-hidden="true">↗</span>
          </Link>
          <Link className={styles.secondaryAction} href="/contests">
            Enter contests <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <div className={styles.footerLine} aria-hidden="true">
        <span>01</span>
        <span className={styles.footerRule} />
        <span>SCROLL TO EXPLORE</span>
      </div>
    </section>
  );
}

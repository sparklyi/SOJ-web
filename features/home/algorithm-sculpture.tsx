import styles from "./home-hero.module.css";

const codeRows = [
  "graph.add(edge)",
  "dist[v] = min(next)",
  "queue.push(state)",
  "while (unresolved)",
  "judge(solution)",
  "return accepted",
];

export function AlgorithmSculpture() {
  return (
    <svg className={styles.sculpture} viewBox="0 0 1200 720" role="presentation">
      <defs>
        <linearGradient id="soj-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-soj-text)" />
          <stop offset="0.28" stopColor="var(--color-soj-text)" />
          <stop offset="0.58" stopColor="var(--color-soj-muted)" />
          <stop offset="0.78" stopColor="var(--color-soj-text)" />
          <stop offset="1" stopColor="var(--color-soj-line)" />
        </linearGradient>
        <linearGradient id="soj-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-soj-muted)" />
          <stop offset="1" stopColor="var(--color-soj-surface)" />
        </linearGradient>
        <linearGradient id="soj-route" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-soj-accent)" stopOpacity="0" />
          <stop offset="0.15" stopColor="var(--color-soj-accent)" />
          <stop offset="0.72" stopColor="var(--color-soj-accent)" />
          <stop offset="1" stopColor="var(--color-soj-info)" stopOpacity="0" />
        </linearGradient>
        <filter id="soj-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="28" stdDeviation="28" floodColor="var(--color-soj-bg)" floodOpacity="0.82" />
        </filter>
        <filter id="soj-green-glow" x="-40%" y="-100%" width="180%" height="300%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="soj-blue-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <clipPath id="soj-word-clip">
          <text x="600" y="462" textAnchor="middle" className={styles.wordShape}>SOJ</text>
        </clipPath>
        <clipPath id="soj-top-slice"><rect x="100" y="125" width="1000" height="235" /></clipPath>
        <clipPath id="soj-mid-slice"><path d="M100 332 L1100 280 L1100 485 L100 535 Z" /></clipPath>
        <clipPath id="soj-bottom-slice"><path d="M100 500 L1100 450 L1100 640 L100 640 Z" /></clipPath>
      </defs>

      <ellipse cx="655" cy="370" rx="430" ry="220" fill="var(--color-soj-accent)" opacity="0.035" />
      <ellipse cx="770" cy="410" rx="330" ry="150" fill="var(--color-soj-info)" opacity="0.045" filter="url(#soj-blue-glow)" />

      <g data-hero-assembly filter="url(#soj-shadow)">
        <text x="610" y="486" textAnchor="middle" className={`${styles.wordShape} ${styles.wordDepth}`}>SOJ</text>

        <g data-hero-layer="top" clipPath="url(#soj-top-slice)">
          <text x="600" y="462" textAnchor="middle" className={`${styles.wordShape} ${styles.wordFace}`}>SOJ</text>
        </g>
        <g data-hero-layer="mid" clipPath="url(#soj-mid-slice)">
          <text x="600" y="462" textAnchor="middle" className={`${styles.wordShape} ${styles.wordFace}`}>SOJ</text>
        </g>
        <g data-hero-layer="bottom" clipPath="url(#soj-bottom-slice)">
          <text x="600" y="462" textAnchor="middle" className={`${styles.wordShape} ${styles.wordFace}`}>SOJ</text>
        </g>

        <g clipPath="url(#soj-word-clip)" className={styles.internalCode}>
          {codeRows.map((row, index) => (
            <text key={row} x={232 + index * 82} y={262 + index * 44}>{row}</text>
          ))}
          <path d="M160 305 L1040 520" stroke="var(--color-soj-accent)" strokeOpacity="0.22" />
          <path d="M210 520 L1000 285" stroke="var(--color-soj-info)" strokeOpacity="0.2" />
        </g>

        <g clipPath="url(#soj-word-clip)">
          <path className={styles.channelShadow} d="M330 198 L370 190 L494 558 L451 568 Z" />
          <path className={styles.channelEdge} d="M330 198 L370 190 L494 558" />
          <path className={styles.channelShadow} d="M754 190 L794 200 L696 568 L654 558 Z" />
          <path className={styles.channelEdgeBlue} d="M794 200 L696 568 L654 558" />
        </g>
      </g>

      <path className={styles.routeBase} d="M92 418 C225 257 350 530 485 366 C610 214 742 514 875 346 C965 232 1055 290 1130 250" />
      <path data-hero-route className={styles.routeActive} pathLength="1" d="M92 418 C225 257 350 530 485 366 C610 214 742 514 875 346 C965 232 1055 290 1130 250" />

      <g data-hero-nodes className={styles.nodes}>
        <rect x="185" y="331" width="10" height="10" />
        <rect x="478" y="361" width="11" height="11" />
        <rect x="866" y="340" width="11" height="11" />
        <circle cx="1070" cy="273" r="6" />
      </g>

      <g className={styles.microLabels}>
        <text x="110" y="212">INPUT / 01</text>
        <text x="950" y="560">VERIFIED / 42MS</text>
        <text x="885" y="202">O(LOG N)</text>
      </g>
    </svg>
  );
}

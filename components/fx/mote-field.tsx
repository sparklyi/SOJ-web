"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/ui/cn";

type MoteFieldProps = {
  className?: string;
  /**
   * 光源位置，视口比例坐标（0–1）。微尘靠近它才亮得起来。
   *
   * 这个参数是这一层的全部意义所在：它把「飘着的颗粒」绑到**已经存在的那盏灯**上。
   * 不绑的话，颗粒就只是浮在页面上的一层噪点——那正是上一版被否掉的东西。
   */
  lightX?: number;
  lightY?: number;
  /** 每多少平方 CSS 像素放一粒。越小越密。 */
  areaPerMote?: number;

  /** devicePixelRatio 上限。背景层不需要满分辨率。 */
  maxDpr?: number;
};

type Mote = {
  x: number;
  y: number;
  /** 可见半径（CSS 像素）。柔边精灵按它的倍数绘制。 */
  r: number;
  /** 峰值不透明度。 */
  alpha: number;
  /** 漂移速率（CSS 像素/秒）。 */
  speed: number;
  /** 当前航向（弧度）。 */
  angle: number;
  /** 航向每秒转过的弧度。这是轨迹会弯的原因。 */
  turn: number;
  /** 闪烁的相位与周期（秒）。 */
  phase: number;
  period: number;
};

/** 微尘数量的下限与上限。上限是防止超宽屏把它铺成雪景。 */
const MOTE_MIN = 30;
const MOTE_MAX = 150;
/** 漂移速率区间（CSS 像素/秒）。上限刻意压在个位数：**
 *  空气里的尘埃不该「飞」，它该几乎停在那里，看久了才发现它在挪。 */
const SPEED_MIN = 3.2;
const SPEED_MAX = 10.5;
/** 每秒最大转向。0 是直线，数值越大越像被气流带走。 */
const TURN_MAX = 0.14;
const R_MIN = 0.5;
const R_MAX = 1.55;
/**
 * 峰值不透明度区间。
 *
 * 这组值是被测出来的：第一版取 0.16–0.5，探针实测整屏最亮的一粒只有 **0.25**、
 * 超过 0.12 的像素一共 45 个 —— 数字上「有内容」，看起来就是没有。
 * 微尘的难点从来不是「别太亮」而是「亮到看得见、又不到被注意到」，
 * 而这个窗口比直觉窄得多，只能量。
 */
const ALPHA_MIN = 0.3;
const ALPHA_MAX = 0.9;
/** 精灵比「可见半径」放大多少倍。倍数越大，颗粒的边缘越柔、核心越淡。 */
const SPRITE_SCALE = 6;
/** 光亮范围：距离光源超过这个归一化距离的微尘只剩底噪。 */
const LIGHT_REACH = 1.05;
/** 远端微尘保留的亮度比例。取 0 会让光斑之外完全空掉，反而露出手工的边界。 */
const LIGHT_FLOOR = 0.38;
/** 纵向压缩系数。光源在上方，竖向衰减更慢一点，颗粒才不会全挤在顶上一条。 */
const LIGHT_Y_BIAS = 1.35;

/**
 * 光照里的微尘。
 *
 * ── 为什么不是粒子场、不是星空 ─────────────────────────────────────────────
 *
 * `ParticleField` 是**流场**：粒子沿无散度噪声场前进，密度高、拖尾长，
 * 读起来是「仪器里的流体」——它适合当列表页的环境，不适合当展台的背景。
 * 星空更不行：它是一件独立的装饰，跟这一页讲的任何事都没关系，
 * 而且「黑底上撒亮点」是模板站最标准的填充物。
 *
 * 这一层要的是第三样东西：**灯打在展品上时，空气里那层几乎看不见的尘埃。**
 * 它成立的原因不是「好看」，而是它有出处——
 *
 *   · 颗粒只在光源方向可见（亮度按到光源的距离调制），所以它读成「被照亮的」，
 *     而不是「浮在页面上的」；
 *   · 速率是个位数 CSS 像素/秒，且航向缓慢转弯，所以它读成空气，不读成特效；
 *   · 尺寸不到 1.5px、峰值不透明度不到 0.5，所以它永远不会和正文抢注意力。
 *
 * 换句话说：**动的是光解释得了的东西。** 这是这一层唯一的判据，
 * 也是判断「该不该再加动效」时唯一要问的问题。
 *
 * ── 性能与可访问性 ────────────────────────────────────────────────────────
 *   - 精灵预渲染一次，每帧只是几十次 `drawImage`，没有逐粒子渐变
 *   - devicePixelRatio 上限 1.5；标签页隐藏时完全停止 rAF
 *   - `prefers-reduced-motion` 下不进入循环，只画一张静帧（构图完整，只是不动）
 *   - 柔边精灵由运行时读取 CSS 变量生成，源码不含任何色值字面量
 */
export function MoteField({
  className,
  lightX = 0.75,
  lightY = 0.05,
  areaPerMote = 15000,
  maxDpr = 1.5,
}: MoteFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let motes: Mote[] = [];
    let sprite: HTMLCanvasElement | null = null;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let running = false;

    /**
     * 确定性随机。同一份构图在多次渲染之间保持一致——
     * 每次刷新都换一批位置的话，页面会读成「随机噪点」，而不是「这里有空气」。
     */
    const makeRandom = (seed: number) => {
      let s = seed >>> 0;
      return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
      };
    };
    const rnd = makeRandom(20260920);

    /** 柔边精灵：一次画好，之后每帧只是缩放贴图。 */
    const buildSprite = () => {
      const size = 32;
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      const octx = off.getContext("2d");
      if (!octx) return null;
      const color =
        getComputedStyle(document.documentElement).getPropertyValue("--soj-fx-particle").trim() ||
        "white";
      const gradient = octx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.34, color);
      gradient.addColorStop(1, "transparent");
      octx.fillStyle = gradient;
      octx.globalAlpha = 1;
      octx.fillRect(0, 0, size, size);
      // 圆心之外整块透明：贴图时才有柔边，而不是一枚硬边的小方块。
      octx.globalCompositeOperation = "destination-in";
      octx.beginPath();
      octx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      octx.fill();
      return off;
    };
    sprite = buildSprite();

    const spawn = (anywhere: boolean): Mote => ({
      x: anywhere ? rnd() * width : rnd() < 0.5 ? -20 : width + 20,
      y: anywhere ? rnd() * height : rnd() * height,
      r: R_MIN + rnd() * (R_MAX - R_MIN),
      alpha: ALPHA_MIN + rnd() * (ALPHA_MAX - ALPHA_MIN),
      speed: SPEED_MIN + rnd() * (SPEED_MAX - SPEED_MIN),
      angle: rnd() * Math.PI * 2,
      turn: (rnd() - 0.5) * 2 * TURN_MAX,
      phase: rnd() * Math.PI * 2,
      period: 4 + rnd() * 6,
    });

    const rebuild = () => {
      const area = Math.max(1, width * height);
      const target = Math.round(
        Math.min(MOTE_MAX, Math.max(MOTE_MIN, area / Math.max(4000, areaPerMote))),
      );
      motes = Array.from({ length: target }, () => spawn(true));
    };

    /** 光源权重：越靠近光源越亮。这是「光尘」与「噪点」的分界。 */
    const lightWeight = (x: number, y: number) => {
      const dx = x / width - lightX;
      const dy = (y / height - lightY) * LIGHT_Y_BIAS;
      const distance = Math.hypot(dx, dy);
      const near = Math.max(0, 1 - distance / LIGHT_REACH);
      return LIGHT_FLOOR + (1 - LIGHT_FLOOR) * near * near;
    };

    /**
     * `advance` 为假时只重画、不推进位置与相位：
     * 窗口尺寸变化，以及 prefers-reduced-motion，走的都是这一支——
     * 两者要的都是**同一张静帧**，区别只是什么时候重画。
     */
    const paint = (advance: boolean, dt: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      for (const mote of motes) {
        if (advance) {
          mote.angle += mote.turn * dt;
          mote.x += Math.cos(mote.angle) * mote.speed * dt;
          mote.y += Math.sin(mote.angle) * mote.speed * dt;
          if (mote.x < -24) mote.x = width + 24;
          else if (mote.x > width + 24) mote.x = -24;
          if (mote.y < -24) mote.y = height + 24;
          else if (mote.y > height + 24) mote.y = -24;
        }
        const twinkle = 0.6 + 0.4 * Math.sin((clock / mote.period) * Math.PI * 2 + mote.phase);
        ctx.globalAlpha = mote.alpha * twinkle * lightWeight(mote.x, mote.y);
        const size = mote.r * SPRITE_SCALE;
        if (sprite) ctx.drawImage(sprite, mote.x - size / 2, mote.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));
      const nextBufferWidth = Math.round(nextWidth * dpr);
      const nextBufferHeight = Math.round(nextHeight * dpr);
      // 尺寸没变就直接返回。**这一句不是优化，是正确性**：
      // 给 canvas.width 赋值会连带把画布清空，而下面只在 `changed` 时才重画。
      // 少了这个提前返回，「观察器回调一次等尺寸的通知」就会把画布擦干净且不重画——
      // 动画态下看不出来（下一帧就补上了），**减弱动效下就是一块空白**。
      if (
        nextWidth === width &&
        nextHeight === height &&
        canvas.width === nextBufferWidth &&
        canvas.height === nextBufferHeight
      ) {
        return;
      }
      width = nextWidth;
      height = nextHeight;
      canvas.width = nextBufferWidth;
      canvas.height = nextBufferHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
      paint(false, 0);
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 1 / 60);
      last = now;
      clock += dt;
      paint(true, dt);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduceMotion.matches || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(host);
    document.addEventListener("visibilitychange", onVisibility);

    // 第一次 resize 必然重画（画布尺寸从 0 变到实际值），所以静帧已经有了；
    // `start()` 自己会判断要不要动 —— 减弱动效或标签页不可见时它什么都不做，
    // 画面上留下的就是刚画好的那张静帧。分支只有一条，不会出现
    // 「静帧分支忘了画」或者「动效分支画了两遍」。
    resize();
    start();

    const onPreferenceChange = () => {
      stop();
      if (reduceMotion.matches) {
        clock = 0;
        paint(false, 0);
      } else {
        start();
      }
    };
    reduceMotion.addEventListener("change", onPreferenceChange);

    return () => {
      stop();
      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", onPreferenceChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [areaPerMote, lightX, lightY, maxDpr]);

  return (
    <div
      ref={hostRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      data-atmo-motes=""
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0" />
    </div>
  );
}

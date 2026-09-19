"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/ui/cn";

type ParticleFieldProps = {
  className?: string;
  /** 粒子密度系数，1 为基准。实际数量还会按画布面积换算。 */
  density?: number;
  /** 指针扰动半径（CSS 像素）。0 表示不响应指针。 */
  influence?: number;
  /** 滚动视差系数。0 表示不跟随滚动。 */
  parallax?: number;
  /** 流场尺度（CSS 像素）。值越大涡旋越大、越平缓。 */
  scale?: number;
  /** 时间流速。 */
  speed?: number;
  /** 固定随机种子：保证同一份构图在多次渲染之间稳定。 */
  seed?: number;
  /**
   * devicePixelRatio 上限。
   *
   * 首屏这类「主体图形」用默认的 2；但作为整站背景层时，每帧的整屏填充开销
   * 按 DPR 的平方增长，而背景本来就要读得柔和，降到 1.25 肉眼几乎无差别，
   * 填充量却只剩约 40%。这是让常驻动画不拖累滚动帧率的关键一处。
   */
  maxDpr?: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  kind: 0 | 1 | 2;
};

const KIND_ALPHA = [0.58, 1, 0.14] as const;
const KIND_WIDTH = [1, 1.15, 0.85] as const;
/** 加速度只提供方向，速度上限保证所有粒子以接近的速率前进——
 *  不做归一化的话粒子会聚成团，看起来像噪点而不像流场。 */
const ACCEL = 78;
const MAX_SPEED = 2.35;
const DAMPING = 0.962;
/** 每帧用于离散求旋度的偏移量（CSS 像素）。 */
const CURL_EPSILON = 4;
/**
 * 每帧抹在旧画面上的底色浓度，也就是拖尾长度的倒数。
 *
 * 这个值决定了整张图读成什么：0.09 时一条拖尾要二十多帧才衰减可见，
 * 于是每个粒子都是一根五六十像素的长划痕——满屏划痕看起来像屏幕上的灰，
 * 不像流体。提到 0.2 之后拖尾收到约五帧（十几像素），
 * 配合更高的粒子数，整体读成一层细密的流动颗粒。这是「流体」和「划痕」的分界。
 */
const TRAIL_FADE = 0.135;

function hash2(ix: number, iy: number, seed: number) {
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iy | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** 二维值噪声。比 simplex 便宜，做流场底料足够，且实现完全可复现。 */
function valueNoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const u = smooth(x - ix);
  const v = smooth(y - iy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  const top = a + (b - a) * u;
  const bottom = c + (d - c) * u;
  return top + (bottom - top) * v;
}

function makeRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * 首屏粒子力场。
 *
 * 不是「随机飘点」：粒子沿一个无散度的旋度噪声场前进。场由标量势的旋度构造
 * （v = (∂n/∂y, -∂n/∂x)），因此天然没有源和汇，粒子既不会聚成团也不会瞬间散开，
 * 而是形成持续的涡旋带——这是它能读成「仪器上的流体」而不是「装饰雪花」的原因。
 *
 * 性能与可访问性：
 *   - devicePixelRatio 上限 2；离屏或标签页隐藏时完全停止 rAF
 *   - prefers-reduced-motion 下不进入动画循环，改为一次性绘制几十条流线，仍然是完整构图
 *   - 颜色全部运行时从 CSS 变量读取，源码不含任何色值字面量
 */
export function ParticleField({
  className,
  density = 1,
  influence = 150,
  parallax = 0,
  scale = 260,
  speed = 1,
  seed = 20260919,
  maxDpr = 2,
}: ParticleFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.lineCap = "round";

    const rootStyle = getComputedStyle(document.documentElement);
    const readToken = (name: string, fallback: string) => rootStyle.getPropertyValue(name).trim() || fallback;
    const colorBg = readToken("--soj-fx-bg", "black");
    const colorFor: Record<Particle["kind"], string> = {
      0: readToken("--soj-fx-particle", "white"),
      1: readToken("--soj-fx-particle-accent", "white"),
      2: readToken("--soj-fx-particle-dim", "gray"),
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rnd = makeRandom(seed);

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let last = 0;
    let clock = 0;
    let running = false;
    let visible = true;
    const pointer = { x: -1e5, y: -1e5, active: false, clientX: 0, clientY: 0, moved: false };

    const fieldScale = 1 / scale;

    /** 采样旋度噪声场，返回单位方向。 */
    const sampleDirection = (x: number, y: number, t: number) => {
      const nx = x * fieldScale;
      const ny = y * fieldScale;
      const ex = CURL_EPSILON;
      const right = valueNoise(nx + ex * fieldScale, ny + t, seed);
      const left = valueNoise(nx - ex * fieldScale, ny + t, seed);
      const down = valueNoise(nx, ny + ex * fieldScale + t, seed);
      const up = valueNoise(nx, ny - ex * fieldScale + t, seed);
      const dx = (down - up) / (2 * ex);
      const dy = -(right - left) / (2 * ex);
      const mag = Math.hypot(dx, dy) || 1;
      return { x: dx / mag, y: dy / mag };
    };

    const spawn = (anywhere: boolean): Particle => {
      const roll = rnd();
      const kind: Particle["kind"] = roll < 0.07 ? 1 : roll < 0.62 ? 0 : 2;
      const maxLife = 5.5 + rnd() * 7;
      return {
        x: anywhere || rnd() < 0.5 ? rnd() * width : -12,
        y: anywhere ? rnd() * height : rnd() * height,
        vx: 0,
        vy: 0,
        life: anywhere ? rnd() * maxLife : maxLife,
        maxLife,
        kind,
      };
    };

    const rebuild = () => {
      const area = Math.max(1, width * height);
      const target = Math.round(Math.min(2200, Math.max(320, (area / 3100) * density)));
      particles = Array.from({ length: target }, () => spawn(true));
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));
      const changed = nextWidth !== width || nextHeight !== height;
      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = colorBg;
      ctx.fillRect(0, 0, width, height);
      if (changed) {
        rebuild();
        if (reduceMotion.matches) renderStatic();
      }
    };

    /**
     * 静帧构图：每条粒子沿场积分成一条流线，一次描出来。
     * 这是 prefers-reduced-motion 下的最终形态，也是动画开始前的第一帧。
     */
    const renderStatic = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = colorBg;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1;

      const steps = 44;
      const stepPx = 5;
      for (const particle of particles) {
        ctx.globalAlpha = KIND_ALPHA[particle.kind] * 0.7;
        ctx.strokeStyle = colorFor[particle.kind];
        ctx.beginPath();
        let x = particle.x;
        let y = particle.y;
        ctx.moveTo(x, y);
        for (let i = 0; i < steps; i++) {
          const dir = sampleDirection(x, y, 0);
          x += dir.x * stepPx;
          y += dir.y * stepPx;
          if (x < -30 || x > width + 30 || y < -30 || y > height + 30) break;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const integrate = (dt: number, t: number) => {
      const frames = dt * 60;
      for (const particle of particles) {
        const dir = sampleDirection(particle.x, particle.y, t);
        particle.vx += dir.x * ACCEL * dt;
        particle.vy += dir.y * ACCEL * dt;

        if (influence > 0 && pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < influence * influence && dist2 > 0.01) {
            const dist = Math.sqrt(dist2);
            const push = (1 - dist / influence) ** 2 * 2.6;
            particle.vx += (dx / dist) * push;
            particle.vy += (dy / dist) * push;
          }
        }

        particle.vx *= DAMPING;
        particle.vy *= DAMPING;
        const sp = Math.hypot(particle.vx, particle.vy);
        if (sp > MAX_SPEED) {
          particle.vx = (particle.vx / sp) * MAX_SPEED;
          particle.vy = (particle.vy / sp) * MAX_SPEED;
        }

        const prevX = particle.x;
        const prevY = particle.y;
        particle.x += particle.vx * frames;
        particle.y += particle.vy * frames;

        particle.life -= dt;
        if (
          particle.life <= 0 ||
          particle.x < -24 ||
          particle.x > width + 24 ||
          particle.y < -24 ||
          particle.y > height + 24
        ) {
          Object.assign(particle, spawn(false));
          continue;
        }

        ctx.globalAlpha = KIND_ALPHA[particle.kind];
        ctx.strokeStyle = colorFor[particle.kind];
        ctx.lineWidth = KIND_WIDTH[particle.kind];
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();
        // 少量粒子带一个更亮的头部，流场因此有方向感而不是均匀的划痕。
        if (particle.kind === 1) {
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = colorFor[1];
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 1 / 60);
      last = now;
      clock += dt * speed;

      // 指针位置每帧只读一次布局，避免 pointermove 期间反复触发重排。
      if (pointer.moved) {
        const rect = canvas.getBoundingClientRect();
        pointer.x = pointer.clientX - rect.left;
        pointer.y = pointer.clientY - rect.top;
        pointer.moved = false;
      }

      if (parallax > 0) {
        const overscan = height * 0.16;
        const want = -window.scrollY * parallax;
        canvas.style.transform = `translate3d(0, ${Math.max(-overscan, Math.min(overscan, want))}px, 0)`;
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = colorBg;
      ctx.globalAlpha = TRAIL_FADE;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "lighter";
      integrate(dt, clock * 0.55);

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduceMotion.matches || !visible) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      pointer.moved = true;
      pointer.active = true;
    };
    const onPointerOut = () => {
      pointer.active = false;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );

    const resizeObserver = new ResizeObserver(() => resize());

    resize();
    renderStatic();
    resizeObserver.observe(host);
    observer.observe(host);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduceMotion.matches) start();

    const onPreferenceChange = () => {
      stop();
      resize();
      if (reduceMotion.matches) renderStatic();
      else start();
    };
    reduceMotion.addEventListener("change", onPreferenceChange);

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", onPreferenceChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, influence, parallax, scale, seed, speed, maxDpr]);

  return (
    <div ref={hostRef} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <canvas ref={canvasRef} aria-hidden className="absolute inset-x-0 top-[-16%] h-[132%] w-full" />
    </div>
  );
}

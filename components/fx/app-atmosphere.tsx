"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { unlocalizePath } from "@/lib/i18n/routing";
import { ParticleField } from "./particle-field";

type AtmospherePresetId = "flow" | "drift" | "focus" | "still";

type AtmospherePreset = {
  id: AtmospherePresetId;
  /**
   * 流场参数。`null` 表示这一族页面不开画布——
   * 读题、写代码、看提交详情时，背景必须是静的。
   */
  field: {
    density: number;
    influence: number;
    speed: number;
    parallax: number;
    scale: number;
  } | null;
  /** 网格、柔晕、顶部受光的强度，通过 CSS 变量下发给 globals.css。 */
  grid: number;
  bloom: number;
  topLight: number;
};

/**
 * 环境强度表。
 *
 * 强度是按「这一页要占用户多少注意力」定的，不是按页面重要性定的：
 *   flow   —— 首屏与视觉契约页。这里是全站唯一可以「有气氛」的地方。
 *   drift  —— 列表与概览页。有环境，但用户扫数据时不会注意到它在动。
 *   focus  —— 赛事大屏与排行榜。这是投屏场景，背景可以更亮、更快一点。
 *   still  —— 读题、编码、提交详情、鉴权与控制台。背景近乎静止。
 *
 * 四档共用同一套图层与同一套材质，只是参数不同，所以整站读起来是一个环境，
 * 而不是「每页贴了不同的装饰」。
 */
const PRESETS: Record<AtmospherePresetId, AtmospherePreset> = {
  flow: {
    id: "flow",
    field: { density: 2.5, influence: 170, speed: 1, parallax: 0.05, scale: 250 },
    grid: 0.8,
    bloom: 1,
    topLight: 1,
  },
  drift: {
    id: "drift",
    field: { density: 1.05, influence: 120, speed: 0.72, parallax: 0.04, scale: 300 },
    grid: 0.5,
    bloom: 0.72,
    topLight: 0.7,
  },
  focus: {
    id: "focus",
    field: { density: 1.4, influence: 220, speed: 1.3, parallax: 0.06, scale: 230 },
    grid: 0.85,
    bloom: 1.05,
    topLight: 1,
  },
  still: {
    id: "still",
    field: null,
    grid: 0.3,
    bloom: 0.5,
    topLight: 0.45,
  },
};

/**
 * 路由 → 环境档位。
 *
 * 判定顺序即优先级。注意这里必须**按路径形状**判断而不是按前缀：
 * `/problems` 是列表页（drift），`/problems/12` 是读题页（still），
 * 二者前缀相同但需要的注意力完全相反。
 */
function presetIdFor(path: string): AtmospherePresetId {
  if (path === "/" || path.startsWith("/style-guide")) return "flow";
  // 赛事大屏与赛事排行榜是投屏用的，字要大、背景可以更活。
  if (/\/(arena|scoreboard)$/.test(path)) return "focus";
  if (/^\/(problems|submissions)\/[^/]+$/.test(path)) return "still";
  if (/^\/contests\/[^/]+\/problems\/[^/]+$/.test(path)) return "still";
  if (
    path.startsWith("/auth") ||
    path.startsWith("/manage") ||
    path.startsWith("/admin") ||
    path === "/settings"
  ) {
    return "still";
  }
  return "drift";
}

/**
 * 整站环境层。
 *
 * 挂在根布局上而不是各个页面里，所以**没有页面能「忘记」它**——
 * 这一点很重要：上一版把粒子场写在首屏组件内部，结果是只有首页有环境，
 * 其余页面是空底色，效果立刻读成「贴上去的装饰」。
 *
 * 它是纯视觉层：固定定位、`pointer-events: none`、`aria-hidden`，
 * 不参与布局、不进入无障碍树，也不接受任何交互。
 */
export function AppAtmosphere() {
  const pathname = usePathname() ?? "/";
  const preset = PRESETS[presetIdFor(unlocalizePath(pathname))];

  return (
    <div
      aria-hidden="true"
      className="soj-atmo"
      data-atmo={preset.id}
      style={
        {
          "--atmo-grid": preset.grid,
          "--atmo-bloom": preset.bloom,
          "--atmo-toplight": preset.topLight,
        } as CSSProperties
      }
    >
      {preset.field ? (
        <ParticleField
          density={preset.field.density}
          influence={preset.field.influence}
          maxDpr={1.25}
          parallax={preset.field.parallax}
          scale={preset.field.scale}
          speed={preset.field.speed}
        />
      ) : null}
      <div className="soj-atmo-toplight" />
      <div className="soj-atmo-grid-mask">
        <div className="soj-atmo-grid" />
      </div>
      <div className="soj-atmo-bloom soj-atmo-bloom-primary" />
      <div className="soj-atmo-bloom soj-atmo-bloom-secondary" />
      <div className="soj-atmo-vignette" />
    </div>
  );
}

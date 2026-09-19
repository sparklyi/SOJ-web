"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { unlocalizePath } from "@/lib/i18n/routing";
import { MoteField } from "./mote-field";
import { ParticleField } from "./particle-field";

type AtmospherePresetId = "plinth" | "flow" | "drift" | "focus" | "still";

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
  /**
   * 光照里的微尘。`null` 表示这一档不放。
   *
   * 它与 `field` 是两个物种，所以是两个字段而不是同一份参数：
   *   field —— 流场。密度高、有拖尾，是这一页的**环境**。
   *   motes —— 尘埃。稀疏、极小、极慢，只在光源方向可见，是这一页的**空气**。
   * 首页要的是后者：展台上不能有一张在流动的图，但空气里可以有灰。
   */
  motes: { lightX: number; lightY: number } | null;
};

/**
 * 环境强度表。
 *
 * 强度是按「这一页要占用户多少注意力」定的，不是按页面重要性定的：
 *   plinth —— 首页。这是展台：**材质承担氛围，动效交给滚动**，另加一层光照里的微尘。
 *             它和下面四档的关键区别有两条：
 *               1. field 为 null —— 首页不挂流场画布；
 *               2. 额外停掉了两条自播动画（网格漂移、双光源呼吸，见 globals.css 的
 *                  `[data-atmo="plinth"]`），只留**一盏不动的灯**。
 *             为什么停那两条、却留下微尘：那两条动的分别是**墙面**与**灯本身**。
 *             墙在挪、灯在呼吸，读起来是这间屋子在动，而屋子不该动——
 *             那正是「没人操作时背景也在动」那种廉价感。微尘动的是**空气**，
 *             而空气本来就该有东西在飘，只要有光照着，它的存在就是被解释过的。
 *             一句话：**空气可以动，屋子不行。**
 *   flow   —— 视觉契约页。保留粒子场，用来对照「材质承担氛围」与「动效承担氛围」的区别。
 *   drift  —— 列表与概览页。有环境，但用户扫数据时不会注意到它在动。
 *   focus  —— 赛事大屏与排行榜。这是投屏场景，背景可以更亮、更快一点。
 *   still  —— 读题、编码、提交详情、鉴权与控制台。背景近乎静止。
 *
 * 五档共用同一套图层与同一套材质，只是参数不同，所以整站读起来是一个环境，
 * 而不是「每页贴了不同的装饰」。
 */
const PRESETS: Record<AtmospherePresetId, AtmospherePreset> = {
  plinth: {
    id: "plinth",
    field: null,
    // 材质比 still 给得足：still 是「别打扰我读题」，plinth 是「这里在展出」。
    grid: 0.62,
    bloom: 1,
    topLight: 1.25,
    // 光源位置与 `.soj-atmo-bloom-primary` 的几何中心对齐（右 -14%、上 -30%，78vw × 70vh）。
    // 两者必须一起改：微尘亮在灯不在的地方，整层立刻读成「浮在页面上的一层噪点」。
    motes: { lightX: 0.75, lightY: 0.05 },
  },
  flow: {
    id: "flow",
    field: { density: 2.5, influence: 170, speed: 1, parallax: 0.05, scale: 250 },
    grid: 0.8,
    bloom: 1,
    topLight: 1,
    motes: null,
  },
  drift: {
    id: "drift",
    field: { density: 1.05, influence: 120, speed: 0.72, parallax: 0.04, scale: 300 },
    grid: 0.5,
    bloom: 0.72,
    topLight: 0.7,
    motes: null,
  },
  focus: {
    id: "focus",
    field: { density: 1.4, influence: 220, speed: 1.3, parallax: 0.06, scale: 230 },
    grid: 0.85,
    bloom: 1.05,
    topLight: 1,
    motes: null,
  },
  still: {
    id: "still",
    field: null,
    grid: 0.3,
    bloom: 0.5,
    topLight: 0.45,
    motes: null,
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
  if (path === "/") return "plinth";
  if (path.startsWith("/style-guide")) return "flow";
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
      {preset.motes ? (
        <MoteField lightX={preset.motes.lightX} lightY={preset.motes.lightY} />
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

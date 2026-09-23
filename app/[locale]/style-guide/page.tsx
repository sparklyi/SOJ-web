import { Search } from "lucide-react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { ParticleField } from "@/components/fx/particle-field";
import { CountUp } from "@/components/fx/count-up";
import { MotionBlock } from "@/components/fx/motion-block";
import { PageShell } from "@/components/layout/page-shell";
import { AcceptanceAxis } from "@/components/soj/acceptance-axis";
import { AcceptanceMeter } from "@/components/soj/acceptance-meter";
import { ContestClock } from "@/components/soj/contest-clock";
import { DifficultyBar, DifficultyLabel, DifficultyLegend, tallyDifficulty } from "@/components/soj/difficulty-composition";
import { ProblemStatus, problemRowTone } from "@/components/soj/problem-status";
import { ScoreboardGrid } from "@/components/soj/scoreboard-grid";
import { MetricFeed } from "@/components/soj/metric-feed";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { TestPointMatrix } from "@/components/soj/test-point-matrix";
import { TypeExit } from "@/components/soj/type-exit";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelFooter, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Stat, StatDivider, StatGroup } from "@/components/ui/stat";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProblemSummary } from "@/lib/api/types";
import { problemStatusLabelKey } from "@/lib/domain/problem";
import type { MessageKey } from "@/lib/i18n/messages";
import { getServerLocale, getServerTranslator } from "@/lib/i18n/server";
import { cn } from "@/lib/ui/cn";

/**
 * 色板。
 *
 * 顺序即层级：先是四级底色（曜石底 → 抬升层 → 两级表面），再是两级分隔线，
 * 然后才是唯一的彩色强调，最后是三个只在状态徽标里出现的语义色。
 * 冷银与金属两端排在强调色前面——它们是主操作的材料，不是「又一个颜色」。
 */
const swatches = [
  ["style.background", "bg-soj-bg"],
  ["style.raised", "bg-soj-bg-raised"],
  ["style.surface", "bg-soj-surface"],
  ["style.surface2", "bg-soj-surface-2"],
  ["style.line", "bg-soj-line"],
  ["style.lineStrong", "bg-soj-line-strong"],
  ["style.silver", "bg-soj-silver"],
  ["style.accent", "bg-soj-accent"],
  ["style.success", "bg-soj-success"],
  ["style.warning", "bg-soj-warning"],
  ["style.danger", "bg-soj-danger"],
] as const satisfies ReadonlyArray<readonly [MessageKey, string]>;

const textScale = [
  ["style.textPrimary", "text-soj-text"],
  ["style.textSecondary", "text-soj-muted"],
  ["style.textFaint", "text-soj-faint"],
] as const;

const radiusScale = [
  ["style.radiusSm", "rounded-soj-sm"],
  ["style.radiusMd", "rounded-soj-md"],
  ["style.radiusLg", "rounded-soj-lg"],
  ["style.radiusXl", "rounded-soj-xl"],
] as const;

/** 数据图形用的样例分布：3 简单 / 4 中等 / 3 困难。 */
const sampleDifficulties: Array<Pick<ProblemSummary, "difficulty">> = [
  { difficulty: "easy" },
  { difficulty: "easy" },
  { difficulty: "easy" },
  { difficulty: "medium" },
  { difficulty: "medium" },
  { difficulty: "medium" },
  { difficulty: "medium" },
  { difficulty: "hard" },
  { difficulty: "hard" },
  { difficulty: "hard" },
];

/**
 * 行染色的三档样例（「难度 + 状态」就是一行里参与着色的全部内容）。
 *
 * 状态标记单看图标 + 词是看不出「颜色其实铺满整行」的，
 * 所以这里必须用真实的三行来展示——一行一个状态、一层底色，
 * 顺序按「已解决 → 已尝试 → 未开始」，也就是底色从有色到没有的那条梯度。
 */
const sampleStatusRows = [
  { difficulty: "easy", status: "accepted" },
  { difficulty: "medium", status: "attempted" },
  { difficulty: "hard", status: "todo" },
] as const;

/**
 * 样式基线页。
 *
 * 它本身也是契约的一部分：任何页面改动只要和这里对不上，就是页面要改。
 * 所以这一页必须用真实的共享组件拼出来，不能自己另写一套展示样式。
 *
 * 与 v2 基线相比，这一版补了三块此前完全没有被写进契约的东西：
 *   · 材质层（面板 / 凹陷井 / 金属 / 网格）——v2 只有「描边 + 底色」两个概念；
 *   · 数据图形层（难度构成 / 通过率标尺 / 行内柱）——回答「聚合数据长什么样」；
 *   · 动效层（粒子力场 / 揭示 / 数字滚动 / 数据条生长）——回答「什么时候动」。
 * 没有这三块，每个页面都会自己发明一套，最终又回到「像模板」。
 */
export default async function StyleGuidePage() {
  const [t, locale] = await Promise.all([getServerTranslator(), getServerLocale()]);
  const difficultyCounts = tallyDifficulty(sampleDifficulties);

  return (
    /* 曾经是自写壳（连顶部导航都没有）。契约页没有理由游离在整页壳之外：
       它自己就是「每个页面都该长这样」的样本。 */
    <PageShell>
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-10">
        <PageHeader
          eyebrow={t("style.designSystem")}
          title={t("style.interfaceBaseline")}
          description={t("style.description")}
        />

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.palette")}</h2>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.paletteDescription")}</p>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {swatches.map(([labelKey, className]) => (
              <div key={labelKey} className="soj-panel p-3">
                <div className={`${className} h-12 rounded-soj-md border border-soj-line`} />
                <div className="mt-2.5 font-mono text-xs text-soj-muted">{t(labelKey)}</div>
              </div>
            ))}
          </div>
          <Panel variant="flush">
            <div className="grid gap-3 px-4 py-4">
              {textScale.map(([labelKey, className]) => (
                <div key={labelKey} className="flex items-baseline justify-between gap-4">
                  <span className={`text-sm ${className}`}>{t("style.textSample")}</span>
                  <span className="font-mono text-xs text-soj-muted">{t(labelKey)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.primitives")}</h2>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.primitivesDescription")}</p>
          <Panel variant="flush">
            <div className="grid divide-y divide-soj-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              <div className="grid content-start gap-3 px-4 py-5">
                <span className="font-mono text-xs text-soj-muted">{t("style.primitiveDisplay")}</span>
                <p className="soj-display text-4xl">Sundial 2026</p>
              </div>
              <div className="grid content-start gap-3 px-4 py-5">
                <span className="font-mono text-xs text-soj-muted">{t("style.primitiveEyebrow")}</span>
                <p className="soj-eyebrow">Time limit · 1000 ms</p>
                <p className="soj-eyebrow">内存限制 · 256 MB</p>
              </div>
              <div className="grid content-start gap-3 px-4 py-5">
                <span className="font-mono text-xs text-soj-muted">{t("style.primitiveNum")}</span>
                <p className="soj-num text-xl">13,543</p>
                <p className="soj-num text-sm text-soj-muted">00:42:18</p>
              </div>
            </div>
          </Panel>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.primitivesUnusedNote")}</p>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.typography")}</h2>
          <Panel variant="flush">
            <div className="grid gap-4 px-4 py-5">
              <p className="text-[28px] font-semibold tracking-tight">{t("style.sansHierarchy")}</p>
              <p className="font-mono text-sm text-soj-muted">{t("style.monoState")}</p>
              <p className="max-w-2xl text-sm leading-7 text-soj-muted">{t("style.bodyCopy")}</p>
            </div>
          </Panel>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.radiusScale")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {radiusScale.map(([labelKey, className]) => (
              <div key={labelKey} className="grid gap-2">
                <div className={`${className} h-16 border border-soj-line-strong bg-soj-surface`} />
                <span className="font-mono text-xs text-soj-muted">{t(labelKey)}</span>
              </div>
            ))}
          </div>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.radiusUnused")}</p>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.material")}</h2>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.materialDescription")}</p>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
            <div className="grid gap-3">
              <div className="soj-panel grid gap-2 p-4">
                <span className="soj-eyebrow">{t("style.materialPanel")}</span>
                <span className="text-sm text-soj-muted">{t("style.surfaceDemoSectionA")}</span>
              </div>
              <div className="soj-well p-4">
                <span className="soj-eyebrow">{t("style.materialWell")}</span>
                <pre className="mt-3 overflow-auto font-mono text-[13px] leading-6 text-soj-text">
                  <code>{"dist[v] = min(dist[v], dist[u] + w)"}</code>
                </pre>
                <p className="mt-3 text-xs leading-5 text-soj-muted">{t("style.materialDemoCode")}</p>
              </div>
            </div>
            <div className="grid content-start gap-3">
              <div className="soj-panel-flat p-4">
                <span className="soj-eyebrow">{t("style.materialFlat")}</span>
              </div>
              <div className="grid gap-3 rounded-soj-lg border border-soj-line p-4">
                <span className="soj-eyebrow">{t("style.materialMetal")}</span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button>{t("common.submit")}</Button>
                  <Button variant="secondary">{t("common.preview")}</Button>
                </div>
              </div>
              <div className="grid gap-3">
                <span className="soj-eyebrow">.soj-hairline</span>
                <span className="soj-hairline block w-full" />
                <span className="soj-eyebrow">.soj-gridlines</span>
                <span className="soj-gridlines block h-20 rounded-soj-lg border border-soj-line" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.surfaces")}</h2>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.surfacesDescription")}</p>
          <Panel>
            <PanelHeader
              title={t("style.surfaceDemoTitle")}
              description={t("style.surfaceDemoDescription")}
              action={<Badge tone="neutral">{t("style.demoTag")}</Badge>}
            />
            <PanelBody className="text-sm leading-6 text-soj-muted">{t("style.surfaceDemoSectionA")}</PanelBody>
            <PanelBody className="border-t border-soj-line text-sm leading-6 text-soj-muted">
              {t("style.surfaceDemoSectionB")}
            </PanelBody>
            <div className="border-t border-soj-line px-4 py-3">
              <pre className="soj-well overflow-auto p-3 font-mono text-[13px] leading-6 text-soj-text">
                <code>{"if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; push(v); }"}</code>
              </pre>
            </div>
            <PanelFooter className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">
              {t("style.surfaceDemoFooter")}
            </PanelFooter>
          </Panel>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.dataVisuals")}</h2>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.dataVisualsDescription")}</p>
          <Panel variant="flush">
            <div className="grid divide-y divide-soj-line">
              <div className="grid gap-3 px-4 py-5">
                <span className="soj-eyebrow">{t("style.dataVisualComposition")}</span>
                <DifficultyBar counts={difficultyCounts} />
                <DifficultyLegend counts={difficultyCounts} t={t} />
              </div>
              <div className="grid gap-3 px-4 py-5">
                <span className="soj-eyebrow">{t("style.dataVisualAxis")}</span>
                <AcceptanceAxis value={34.2} label={t("problems.acceptance")} locale={locale} />
              </div>
              <div className="grid gap-3 px-4 py-5">
                <span className="soj-eyebrow">{t("style.dataVisualMeter")}</span>
                <div className="grid gap-2">
                  <AcceptanceMeter value={72.4} locale={locale} />
                  <AcceptanceMeter value={34.3} locale={locale} />
                  <AcceptanceMeter value={4.6} locale={locale} />
                </div>
              </div>
            </div>
          </Panel>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.dataVisualLadderNote")}</p>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.accentBudget")}</h2>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.accentBudgetDescription")}</p>
          {/* 四类语义放在同一个面板里，用竖线分组——它同时也是这张契约的示例：
              能用一个面板解决的问题，不要再摊成四张卡片。 */}
          <Panel variant="flush">
            <div className="grid divide-y divide-soj-line sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              <div className="grid content-start gap-3 px-4 py-4">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">
                  {t("style.accentPrimary")}
                </span>
                <Button className="w-fit">{t("common.submit")}</Button>
              </div>
              <div className="grid content-start gap-3 px-4 py-4">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">
                  {t("style.accentLive")}
                </span>
                <Badge tone="accent" withDot className="w-fit">
                  {t("status.running")}
                </Badge>
              </div>
              <div className="grid content-start gap-3 px-4 py-4">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">
                  {t("style.glowLive")}
                </span>
                <span aria-hidden className="relative block h-12 w-full overflow-hidden rounded-soj-md border border-soj-line">
                  <span className="soj-glow inset-0" />
                </span>
              </div>
              <div className="grid content-start gap-3 px-4 py-4">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">
                  {t("style.accentRankUp")}
                </span>
                <span className="font-mono text-sm text-soj-accent">+3</span>
              </div>
            </div>
          </Panel>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.measuredAccentNote")}</p>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.motion")}</h2>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.motionDescription")}</p>
          <Panel variant="flush">
            {/* 粒子力场用真实组件、真实参数，不是一张贴图：
                契约页展示的必须是线上跑的那份实现。
                遮罩沿用首屏的策略——向左淡出，否则粒子会穿过说明文字。 */}
            <div className="relative h-56 overflow-hidden border-b border-soj-line bg-soj-bg-raised">
              <ParticleField
                className="absolute inset-0 [mask-image:radial-gradient(120%_104%_at_82%_50%,black_6%,transparent_82%)] [-webkit-mask-image:radial-gradient(120%_104%_at_82%_50%,black_6%,transparent_82%)]"
                density={1.1}
                influence={170}
                parallax={0.16}
                scale={250}
              />
              <div className="soj-gridlines absolute inset-0 opacity-60" aria-hidden />
              <div className="relative grid h-full content-center gap-2 px-5">
                <span className="soj-eyebrow">{t("style.motionParticleField")}</span>
                <p className="max-w-md text-xs leading-5 text-soj-muted">
                  {t("style.motionParticleFieldDescription")}
                </p>
              </div>
            </div>
            <div className="grid divide-y divide-soj-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="grid content-start gap-3 px-4 py-5">
                <span className="soj-eyebrow">{t("style.motionGrowX")}</span>
                <span aria-hidden className="block h-1.5 w-full overflow-hidden rounded-full bg-soj-bg/75">
                  <span className="soj-grow-x block h-full w-2/3 rounded-full bg-soj-accent" />
                </span>
                <span aria-hidden className="block h-1.5 w-full overflow-hidden rounded-full bg-soj-bg/75">
                  <span
                    className="soj-grow-x block h-full w-1/3 rounded-full bg-soj-silver/75"
                    style={{ ["--grow-delay" as string]: "160ms" }}
                  />
                </span>
                <p className="text-xs leading-5 text-soj-muted">{t("style.motionGrowXDescription")}</p>
              </div>
              <div className="grid content-start gap-3 px-4 py-5">
                <span className="soj-eyebrow">{t("style.motionCountUp")}</span>
                <p className="soj-num text-3xl">
                  <CountUp value={13543} locale={locale} />
                </p>
                <p className="text-xs leading-5 text-soj-muted">{t("style.motionCountUpDescription")}</p>
                <span className="soj-eyebrow mt-2">{t("style.motionLivePulse")}</span>
                <span className="flex items-center gap-2.5 text-xs text-soj-muted">
                  <span aria-hidden className="soj-live-pulse h-2 w-2 rounded-full bg-soj-accent" />
                  {t("status.running")}
                </span>
              </div>
            </div>
            {/* 揭示：把 MotionBlock 用在自己身上，滚动到这一页时它自己也应当浮现。 */}
            <div className="border-t border-soj-line px-4 py-6">
              <span className="soj-eyebrow">{t("style.motionReveal")}</span>
              <MotionBlock className="mt-3 grid gap-2">
                <p className="text-sm text-soj-text">{t("style.motionRevealDescription")}</p>
                <p className="text-xs leading-5 text-soj-muted">{t("style.motionReveal")} · data-reveal=&quot;armed&quot;</p>
              </MotionBlock>
            </div>
          </Panel>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.controls")}</h2>
          <Panel>
            <PanelBody className="grid gap-4">
              {/* 按钮基准：**扁平金属主操作 + 排字出口**。
                  曾经的基准是「镀铬主 + 描边次」；镀铬版（垂直渐变 + 顶部白边）
                  在首页改版时被整个废掉——一枚发亮的胶囊和扁平的排字差着一个时代，
                  这条判据已推广到全站，产品里不允许再出现「压出来的」按钮。
                  默认 variant 即 solid（扁平金属），无需写明。 */}
              <div className="flex flex-wrap items-center gap-3">
                <Button>{t("common.submit")}</Button>
                <Button variant="secondary">{t("common.preview")}</Button>
                <Button variant="outline">{t("style.outlineAction")}</Button>
                <Button variant="ghost">{t("common.cancel")}</Button>
                <Button variant="danger">{t("common.delete")}</Button>
                <Button variant="link">{t("style.linkAction")}</Button>
                <Button variant="bare" size="bare">
                  {t("style.bareAction")}
                </Button>
                <Button loading>{t("style.judging")}</Button>
              </div>
              {/* 排字出口（TypeExit）：一行等宽字 + 一枚会位移的箭头，不是按钮。
                  用于与排字直接相邻的次级去向——它是首页出口语言的站级化。 */}
              <div className="flex flex-wrap items-center gap-6">
                <TypeExit href="/problems">{t("home.exploreProblems")}</TypeExit>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* 尺寸对比用 secondary：四个金属主按钮并排会把「尺寸」这个信息淹掉，
                    同时把一整块金属面铺满行，主操作的层级也就不成立了。 */}
                <Button variant="secondary" size="xs">
                  {t("style.sizeXs")}
                </Button>
                <Button variant="secondary" size="sm">
                  {t("style.sizeSm")}
                </Button>
                <Button variant="secondary" size="md">
                  {t("style.sizeMd")}
                </Button>
                <Button variant="secondary" size="lg">
                  {t("style.sizeLg")}
                </Button>
                <IconButton label={t("common.refresh")}>R</IconButton>
                <LocalizedLink className={buttonVariants({ variant: "secondary", size: "sm" })} href="/problems">
                  {t("style.linkButton")}
                </LocalizedLink>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
                <Input id="handle" label={t("style.handle")} helperText={t("style.handleHelper")} />
                <Input id="token" label={t("style.contestCode")} error={t("style.registrationRequired")} />
              </div>
            </PanelBody>
          </Panel>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.badges")}</h2>
          <Panel>
            <PanelBody className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{t("style.toneNeutral")}</Badge>
                <Badge tone="accent">{t("style.accent")}</Badge>
                <Badge tone="success">{t("style.success")}</Badge>
                <Badge tone="warning">{t("style.warning")}</Badge>
                <Badge tone="danger">{t("style.danger")}</Badge>
                <Badge tone="info">{t("style.toneInfo")}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge size="sm">{t("style.sizeSm")}</Badge>
                <div className="flex gap-2">
                  <VerdictBadge status="queued" />
                  <VerdictBadge status="running" />
                  <VerdictBadge status="accepted" />
                  <VerdictBadge status="wrong_answer" />
                  <VerdictBadge status="compile_error" />
                </div>
              </div>
              {/* 状态与难度都不再是「再给一个胶囊」：
                  状态是整行染色（颜色铺满那一行，标记只剩图标 + 词），
                  难度是刻度（长度表达序，整站不占颜色）。 */}
              <div className="overflow-hidden rounded-soj-md border border-soj-line">
                {sampleStatusRows.map((row) => (
                  <div
                    key={row.status}
                    className={cn(
                      "flex items-center justify-between gap-4 border-b border-soj-line/60 px-3 py-2.5 last:border-b-0",
                      problemRowTone[row.status],
                    )}
                  >
                    <DifficultyLabel difficulty={row.difficulty} t={t} />
                    <ProblemStatus status={row.status} label={t(problemStatusLabelKey[row.status])} />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <DifficultyLabel difficulty="easy" t={t} />
                <DifficultyLabel difficulty="medium" t={t} />
                <DifficultyLabel difficulty="hard" t={t} />
              </div>
            </PanelBody>
          </Panel>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.metrics")}</h2>
          <p className="max-w-3xl text-xs leading-5 text-soj-muted">{t("style.metricsDescription")}</p>
          <Panel>
            <PanelBody>
              <StatGroup>
                <Stat label={t("style.metricAccepted")} value="128" hint={t("style.metricSolved")} tone="success" />
                <StatDivider />
                <Stat label={t("style.metricAttempted")} value="34" tone="warning" />
                <StatDivider />
                <Stat label={t("style.metricTotal")} value="8" tone="faint" />
                <StatDivider />
                <Stat label={t("problems.time")} value="1.0 s" />
                <StatDivider />
                <Stat label={t("problems.memory")} value="256 MB" />
              </StatGroup>
            </PanelBody>
          </Panel>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.stateComponents")}</h2>
          <Panel>
            <PanelBody className="grid gap-4">
              <SubmissionTimeline
                items={[
                  { id: "queued", status: "queued", label: "", labelKey: "style.queuedByJudge", timestamp: "10:12:01" },
                  { id: "running", status: "running", label: "", labelKey: "style.runningTestPoints", timestamp: "10:12:05" },
                  { id: "accepted", status: "accepted", label: "", labelKey: "status.accepted", timestamp: "10:12:09" },
                ]}
              />
              <TestPointMatrix
                points={[
                  { index: 1, status: "accepted", score: 10 },
                  { index: 2, status: "accepted", score: 10 },
                  { index: 3, status: "running", score: 0 },
                  { index: 4, status: "wrong_answer", score: 0 },
                ]}
              />
            </PanelBody>
          </Panel>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.contestSurfaces")}</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[320px_1fr]">
            <Panel>
              <PanelBody className="grid gap-3">
                <ContestClock label={t("contest.freezeIn")} value="00:42:18" />
                <ContestClock label={t("contest.nextFreeze")} value={t("contest.notScheduled")} />
              </PanelBody>
            </Panel>
            <Panel variant="flush">
              <MetricFeed
                items={[
                  { id: "a", label: t("home.rankMovement"), value: "+3", tone: "accent" },
                  { id: "b", label: t("style.latestAccepted"), value: t("style.problemC"), tone: "success" },
                  { id: "c", label: t("style.frozenSubmissions"), value: "17", tone: "warning" },
                ]}
              />
            </Panel>
          </div>
          <Panel variant="flush">
            <ScoreboardGrid
              mode="acm"
              rows={[
                { id: "1", rank: 1, handle: "lin", solved: 5, penalty: 312, movement: 2 },
                { id: "2", rank: 2, handle: "mira", solved: 4, penalty: 260, movement: -1 },
              ]}
            />
          </Panel>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-sm font-semibold">{t("style.loadingDataRows")}</h2>
          <Panel variant="flush">
            <PanelBody className="grid gap-4">
              <Skeleton className="h-10" />
              <Tabs defaultValue="table">
                <TabsList>
                  <TabsTrigger value="table">{t("style.table")}</TabsTrigger>
                  <TabsTrigger value="empty">{t("style.empty")}</TabsTrigger>
                </TabsList>
                <TabsContent value="table">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>{t("home.problem")}</TableHeaderCell>
                        <TableHeaderCell>{t("home.status")}</TableHeaderCell>
                        <TableHeaderCell className="w-32 text-right">{t("problems.acceptance")}</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <tbody>
                      <TableRow>
                        <TableCell>{t("style.sampleProblem")}</TableCell>
                        <TableCell>
                          <ProblemStatus status="attempted" label={t("status.attempted")} />
                        </TableCell>
                        <TableCell className="text-right">
                          <AcceptanceMeter value={47.2} locale={locale} />
                        </TableCell>
                      </TableRow>
                    </tbody>
                  </Table>
                </TabsContent>
                <TabsContent value="empty">
                  <EmptyState icon={Search} title={t("style.noMatchingSubmissions")} />
                </TabsContent>
              </Tabs>
            </PanelBody>
          </Panel>
          <Panel variant="flush">
            <PanelHeader title={t("style.emptyState")} />
            <EmptyState
              icon={Search}
              title={t("style.noMatchingSubmissions")}
              description={t("style.emptyStateDescription")}
              action={<Button size="sm">{t("style.emptyStateAction")}</Button>}
            />
          </Panel>
        </section>
      </div>
    </PageShell>
  );
}

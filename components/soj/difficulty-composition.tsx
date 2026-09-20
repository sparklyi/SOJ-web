import type { ProblemDifficulty, ProblemSummary } from "@/lib/api/types";
import { problemDifficultyLabelKey } from "@/lib/domain/problem";
import type { Translator } from "@/lib/i18n/translate";
import { cn } from "@/lib/ui/cn";

/**
 * 难度的编码方式：**刻度，不是颜色**。
 *
 * 这一版推翻的前两版都在试图「给三档难度找三个颜色」：
 *   v1 绿 / 黄 / 红  —— 三个色相并排读成彩虹，还偷走了语义色，
 *                       于是列表里「困难」是红的、筛选栏里「困难」是蓝的。
 *   v2 同一色相的三档明度（中性灰 → 冷银 → 曜石蓝）—— 色相是收敛了，
 *                       但三档深浅差在近黑底上本来就难分，且「灰 / 银 / 蓝」
 *                       仍然要读者先学会这张对照表，才知道哪一档更难。
 *
 * 前两版共同的错：**把「有序」编码成了「类别」。** 难度是一个序（1 < 2 < 3），
 * 而色相天生表达类别、明度只表达强弱；两者都需要读者额外记住映射关系。
 * 长度不需要——三根递高的刻度，一眼就能排出前后，而且完全不占用颜色，
 * 于是整屏的彩色只剩「我的状态」这一件事。
 *
 * 结论：难度**在整站不持有任何颜色**。列表、详情页头、筛选器一律是
 * `DifficultyScale`（信号条）+ 中性文字；只有构成条（style-guide 的分布可视化）
 * 因为必须连续填充才退化为同一色相的三档明度。
 */
export const difficultyOrder: ProblemDifficulty[] = ["easy", "medium", "hard"];

/** 档位数字。刻度的格数、构成条的明度索引都由它派生，不再各写一份。 */
export const difficultyLevel: Record<ProblemDifficulty, 1 | 2 | 3> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * 构成条的三档填充：同一色相（冷银）的三级明度。
 *
 * 这是难度在整站**唯一**保留颜色的地方，且必须是同一色相——
 * 堆叠条要连续填充，没法用格数表达，只能靠明度；而同一色相的明度阶梯
 * 是最弱的干扰形式（读者不需要学色相含义，只需要知道右边更深）。
 * 取值从 35% 起步而不是更低：最低一档也必须明显亮于轨道，
 * 否则最容易的那一段会与凹槽同色，构成信息直接丢一段。
 */
export const difficultyFill: Record<ProblemDifficulty, string> = {
  easy: "bg-soj-silver/35",
  medium: "bg-soj-silver/65",
  hard: "bg-soj-silver",
};

/** 信号条的三格尺寸：等宽等高的方块，靠**格数**而不是格形表达档位。 */
const scaleSegments = [0, 1, 2];

/**
 * 难度信号条：横排三格，填充格数 = 档位（1 / 2 / 3）。
 *
 * 上一版是三根 3px 宽的递高竖条——「简单」只亮一根 3×5 的细线，
 * 与「中等」的两根在深底上几乎无法区分（差异小于 4 个像素的可见面积）。
 * 横排方块把每档的差异从「一根细线的高度差」放大成「一整格的有无」，
 * 1 格与 2 格的对比面积是 1:2，扫一眼就能排出来。
 *
 * 填充格用冷银（全站最亮的中性色），空格压到线色；
 * 完全没有色相，不会和「已解决」的蓝行抢注意力。
 *
 * `aria-hidden` 是刻意的：它是文字的冗余编码，读屏与 e2e 断言都走旁边那个词。
 */
export function DifficultyScale({ difficulty, className }: { difficulty: ProblemDifficulty; className?: string }) {
  const level = difficultyLevel[difficulty];

  return (
    <span aria-hidden className={cn("inline-flex items-center gap-[3px]", className)}>
      {scaleSegments.map((segment) => (
        <span
          key={segment}
          className={cn(
            "h-[6px] w-[6px] rounded-[1.5px]",
            segment < level ? "bg-soj-silver" : "bg-soj-line-strong/55",
          )}
        />
      ))}
    </span>
  );
}

/**
 * 难度标签（刻度 + 词）：列表列、详情页头、筛选按钮共用的完整写法。
 *
 * 词条只来自 `lib/domain/problem.ts`，这里不重新声明。
 */
export function DifficultyLabel({
  difficulty,
  t,
  className,
}: {
  difficulty: ProblemDifficulty;
  t: Translator;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <DifficultyScale difficulty={difficulty} />
      <span className="text-xs text-soj-muted">{t(problemDifficultyLabelKey[difficulty])}</span>
    </span>
  );
}

export type DifficultyCount = {
  difficulty: ProblemDifficulty;
  count: number;
};

export function tallyDifficulty(problems: Pick<ProblemSummary, "difficulty">[]): DifficultyCount[] {
  return difficultyOrder.map((difficulty) => ({
    difficulty,
    count: problems.filter((problem) => problem.difficulty === difficulty).length,
  }));
}

/**
 * 堆叠条本体。
 *
 * 当某一档为 0 时不渲染该段——0 宽度的段会留下亚像素级的亮线，
 * 在深色底上看起来像一条脏线。
 */
export function DifficultyBar({ counts, className }: { counts: DifficultyCount[]; className?: string }) {
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return null;

  return (
    <div
      aria-hidden
      className={cn("flex h-1.5 w-full overflow-hidden rounded-full bg-soj-bg/75", className)}
    >
      {counts.map((item, index) =>
        item.count > 0 ? (
          <span
            key={item.difficulty}
            className={cn("soj-grow-x h-full", difficultyFill[item.difficulty])}
            style={{
              width: `${(item.count / total) * 100}%`,
              ["--grow-delay" as string]: `${index * 90}ms`,
            }}
          />
        ) : null,
      )}
    </div>
  );
}

/**
 * 图例：刻度 + 词条 + 计数。
 *
 * 图例里的色块也换成刻度——否则读者要先把「银色深浅」翻译成档位，
 * 再回到条上找对应段。用刻度做图例，条与图例之间是同一套标记，
 * 不存在翻译步骤（这也是它比色块更该出现在这里的原因）。
 */
export function DifficultyLegend({
  counts,
  t,
  className,
}: {
  counts: DifficultyCount[];
  t: Translator;
  className?: string;
}) {
  const total = counts.reduce((sum, item) => sum + item.count, 0);

  return (
    <dl className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {counts.map((item) => (
        <div key={item.difficulty} className="flex items-center gap-2">
          <DifficultyScale difficulty={item.difficulty} />
          <dt className="text-xs text-soj-muted">{t(problemDifficultyLabelKey[item.difficulty])}</dt>
          <dd className="font-mono text-xs tabular-nums text-soj-text">{item.count}</dd>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <dt className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">Σ</dt>
        <dd className="font-mono text-xs tabular-nums text-soj-muted">{total}</dd>
      </div>
    </dl>
  );
}

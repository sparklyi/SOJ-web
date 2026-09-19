import type { ProblemDifficulty, ProblemSummary } from "@/lib/api/types";
import { problemDifficultyLabelKey } from "@/lib/domain/problem";
import type { Translator } from "@/lib/i18n/translate";
import { cn } from "@/lib/ui/cn";

/**
 * 难度构成：一条堆叠条 + 图例。
 *
 * 为什么不是绿 / 黄 / 红三段：
 * 三个色相并排会直接读成一条彩虹进度条，既吵又丢掉了顺序感。
 * 而「难度」本质上是有序的，所以用**同一色相的三级明度**（中性线色 → 冷银 → 曜石蓝）
 * 表达最贴切：越难，越接近品牌唯一的强调色，读者的眼睛能直接排出前后。
 *
 * 这个映射必须只有一份定义。首页概览与题库页头都要画同一条条，
 * 分散写两遍迟早会出现「首页的困难是蓝的、题库里是灰的」，
 * 而且任何一边调色都会忘记另一边。
 */
export const difficultyOrder: ProblemDifficulty[] = ["easy", "medium", "hard"];

/**
 * 三级明度阶梯。
 *
 * 实测过一版「中性线色 → 冷银 → 曜石蓝」的取法，结果最容易的那一段
 * 与轨道几乎同色，整条条只剩右端一截蓝色——构成信息直接丢了。
 * 阶梯要成立，**最低一档也必须明显亮于轨道**，所以三档统一从「已抬升的灰阶」
 * 起步：45% → 75% → 强调色。轨道则压到比面板底色更暗，形成一条凹槽。
 */
export const difficultyFill: Record<ProblemDifficulty, string> = {
  easy: "bg-soj-muted/45",
  medium: "bg-soj-silver/75",
  hard: "bg-soj-accent",
};

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

/** 图例：色块 + 词条 + 计数。三段加起来就是总数，读者不必回头去加。 */
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
          <span aria-hidden className={cn("h-2 w-2 rounded-[2px]", difficultyFill[item.difficulty])} />
          <dt className="text-xs text-soj-muted">{t(problemDifficultyLabelKey[item.difficulty])}</dt>
          <dd className="font-mono text-xs tabular-nums text-soj-text">{item.count}</dd>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-soj-faint">Σ</dt>
        <dd className="font-mono text-xs tabular-nums text-soj-muted">{total}</dd>
      </div>
    </dl>
  );
}

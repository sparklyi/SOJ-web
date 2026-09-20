import type { ProblemSummary } from "@/lib/api/types";
import { getAcceptanceRate, problemStatusLabelKey } from "@/lib/domain/problem";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { AcceptanceMeter } from "@/components/soj/acceptance-meter";
import { DifficultyLabel } from "@/components/soj/difficulty-composition";
import { ProblemStatus, problemRowTone } from "@/components/soj/problem-status";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Translator } from "@/lib/i18n/translate";

/**
 * 题库数据行。
 *
 * 这一行只保留「决定要不要做这道题」需要的东西，一共四项：
 *   题号 + 题名 + 标签  —— 这是什么、涉及什么
 *   难度                —— 我做得了吗
 *   通过率              —— 别人做起来有多难
 *   我的状态            —— 我做过吗
 *
 * 删掉的两列：
 *   1. **提交次数**。这是个典型的运营指标：对正在挑题的读者，「这道题被提交过 1902 次」
 *      不改变任何决定——它既不是难度（难度列已经有了），也不是我的进度。
 *      它只是让表格宽到需要横向滚动，顺带把通过率挤到视野之外。
 *   2. **操作**。每行挂一个「提交」按钮，八行就是八个按钮，全都在抢同一份注意力；
 *      而正常路径本来就是先进题目读题、再在题目页提交。
 *
 * 标签从独立一列折进题名格里：它和题名一起回答「这是什么题」，
 * 单独占一列只为让表格更宽。折进去之后 7 列变 4 列，
 * 在 1440 甚至 1280 宽度下都不再需要横向滚动。
 *
 * 两个「颜色」的决定都在别处（各只有一份定义）：
 *   难度 → 刻度，无颜色：components/soj/difficulty-composition.tsx
 *   状态 → 整行染色：components/soj/problem-status.tsx
 * 这一层只负责把它们贴到格子里。
 */
export function ProblemRow({ problem, t, locale }: { problem: ProblemSummary; t: Translator; locale: string }) {
  const acceptance = getAcceptanceRate(problem);

  return (
    <TableRow className={problemRowTone[problem.status]}>
      <TableCell className="min-w-0">
        <div className="grid gap-1.5">
          <LocalizedLink
            href={`/problems/${problem.id}`}
            className="flex items-baseline gap-2.5 text-soj-text transition-colors hover:text-soj-accent"
          >
            <span className="font-mono text-xs tabular-nums text-soj-muted">#{problem.id}</span>
            <span className="truncate font-medium">{problem.title}</span>
          </LocalizedLink>
          {problem.tags.length > 0 ? (
            <span className="flex flex-wrap gap-1.5">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-soj-sm border border-soj-line px-1.5 py-0.5 font-mono text-xs text-soj-muted"
                >
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <DifficultyLabel difficulty={problem.difficulty} t={t} />
      </TableCell>
      <TableCell className="text-right">
        <AcceptanceMeter value={acceptance} locale={locale} />
      </TableCell>
      <TableCell>
        <ProblemStatus status={problem.status} label={t(problemStatusLabelKey[problem.status])} />
      </TableCell>
    </TableRow>
  );
}

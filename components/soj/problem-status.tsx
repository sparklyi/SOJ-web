import { Check, CircleDashed, Minus, type LucideIcon } from "lucide-react";
import type { ProblemStatus as ProblemStatusValue } from "@/lib/api/types";
import { cn } from "@/lib/ui/cn";

/**
 * 我的题目状态——图标、色调、词汇与**整行染色**的唯一权威。
 *
 * 三个决定：
 *
 * 1. **状态是我的，不是题目的。** 题目是公共的，同一个「Shortest Path」
 *    对张三是已解决、对李四是未开始。所以文案永远走「我对这道题做了什么」
 *    的词（已解决 / 已尝试 / 未开始），列头与筛选器都叫「我的状态」。
 *
 * 2. **颜色现在由整行承担，而不是一枚小徽标。** 上一版把状态做成带底色的胶囊，
 *    结果一列八行里有八枚彩色小方块，读者要一行行去找那一点点色——
 *    而「哪些题我做过了」本来是一眼扫完整列的问题。
 *    现在整行染色：已解决行是极淡的蓝、已尝试行是轻微抬升的中性面、未开始行不加任何底色。
 *    **默认态不染色**是刻意的：染色本身就是「我对它做过什么」的信号，
 *    给未开始也刷一层底，等于整张表都有底色，信号就没有了。
 *
 *    染色用的是 accent 而不是 success 绿。上一版铺的绿在偏蓝近黑的底上
 *    是一片色温冲突的补色——大面积的绿读成「外来的色块」，与冷银+曜石蓝
 *    的主调打架。蓝与底色同色温，铺开是「同一片色调加深」；且全站的彩色
 *    主张本就是「唯一的彩色是曜石蓝」，我的进度值得用唯一的彩色来表达。
 *    success 绿仍然保留，但只给小面积的反馈文字与测试点格子（那些不铺行底）。
 *
 * 3. **图标与文字同给，且不再套壳。** 图标负责扫读（一列勾），文字负责确认与无障碍
 *    （e2e 与读屏都断言文字）。没有了胶囊，状态列回到纯排版：一行图标 + 一行词，
 *    重量与旁边的难度、通过率一致——这也是它不再「像 demo」的原因。
 */
const statusConfig: Record<ProblemStatusValue, { icon: LucideIcon; text: string }> = {
  accepted: { icon: Check, text: "text-soj-accent" },
  attempted: { icon: CircleDashed, text: "text-soj-muted" },
  todo: { icon: Minus, text: "text-soj-faint" },
};

/**
 * 状态 → 整行底色。
 *
 * 三档的层级：已解决是唯一带色相的（accent，与底色同色温），
 * 已尝试只是比面板略亮一点的中性面，未开始完全不加。
 * 一屏扫下来是「蓝 → 略亮 → 无」的秩序。
 *
 * 每档自带 hover：不写的话会被 `TableRow` 内建的 `hover:bg-soj-surface/55` 盖掉，
 * 于是鼠标一划过去颜色就消失（行的状态在 hover 时闪掉，比不染色更糟）。
 */
export const problemRowTone: Record<ProblemStatusValue, string> = {
  accepted: "bg-soj-accent/12 hover:bg-soj-accent/18",
  attempted: "bg-soj-surface-2/45 hover:bg-soj-surface-2/70",
  todo: "",
};

export function ProblemStatus({
  status,
  label,
  className,
}: {
  status: ProblemStatusValue;
  /** 已翻译的状态词（词条映射在 lib/domain/problem.ts，由调用方翻译）。 */
  label: string;
  className?: string;
}) {
  const { icon: Icon, text } = statusConfig[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs", text, className)}>
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
      {label}
    </span>
  );
}

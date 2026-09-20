import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { cn } from "@/lib/ui/cn";
import styles from "./type-exit.module.css";

/**
 * 排字式出口。
 *
 * 一行等宽字 + 一枚会位移的箭头，**不是按钮**：没有底色、没有描边、
 * 没有圆角、没有立体感。静止是次要色，悬停提到主文案色、箭头位移——
 * 反馈全落在字本身。这是首页展台确立的出口语言，现在归全站共用。
 *
 * 用在哪儿：一个版面里**与排字直接相邻**的次级去向（登录提示里的「去登录」、
 * 空态里的「去题库」、详情页的「返回列表」）。不用于工具栏里需要一排对齐的场合
 * （那里用 `variant="ghost"`），也不用于句子中间的行内链接（那是 accent 文字链接的事）。
 *
 * `direction="back"` 用左箭头、向左位移——返回是一个方向，不该拿右箭头凑合。
 */
export function TypeExit({
  href,
  children,
  className,
  direction = "forward",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  direction?: "forward" | "back";
}) {
  const back = direction === "back";
  const Icon = back ? ArrowLeft : ArrowRight;
  return (
    <LocalizedLink
      href={href}
      className={cn(styles.exit, back && styles.exitBack, className)}
    >
      <span>{children}</span>
      <Icon aria-hidden className={styles.exitIcon} />
    </LocalizedLink>
  );
}

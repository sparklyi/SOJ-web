import type { JudgeStatus } from "@/lib/api/types";
import { cn } from "@/lib/ui/cn";

type TestPoint = {
  index: number;
  status: JudgeStatus;
};

const statusClass: Record<JudgeStatus, string> = {
  queued: "border-soj-line bg-soj-surface text-soj-muted",
  compiling: "border-soj-info/50 bg-soj-info/10 text-soj-info",
  running: "border-soj-accent/50 bg-soj-accent/10 text-soj-accent",
  accepted: "border-soj-success/50 bg-soj-success/10 text-soj-success",
  wrong_answer: "border-soj-danger/50 bg-soj-danger/10 text-soj-danger",
  runtime_error: "border-soj-danger/50 bg-soj-danger/10 text-soj-danger",
  compile_error: "border-soj-warning/50 bg-soj-warning/10 text-soj-warning",
  time_limit: "border-soj-warning/50 bg-soj-warning/10 text-soj-warning",
  memory_limit: "border-soj-warning/50 bg-soj-warning/10 text-soj-warning",
  canceled: "border-soj-line bg-soj-surface text-soj-muted",
  system_error: "border-soj-danger/50 bg-soj-danger/10 text-soj-danger",
};

/**
 * 测试点只报判定，不报分数：站点是 ACM 判题，一个测试点只有「过 / 不过」。
 * 短码（AC / WA / TLE …）是 OJ 圈的通用约定，不随语言变化，
 * 所以这里不需要走 i18n；颜色之外还有文字，色盲读者也读得到。
 */
const statusCode: Record<JudgeStatus, string> = {
  queued: "…",
  compiling: "…",
  running: "…",
  accepted: "AC",
  wrong_answer: "WA",
  runtime_error: "RE",
  compile_error: "CE",
  time_limit: "TLE",
  memory_limit: "MLE",
  canceled: "—",
  system_error: "SE",
};

export function TestPointMatrix({ points }: { points: TestPoint[] }) {
  return (
    <div className="grid content-start grid-cols-[repeat(auto-fill,minmax(78px,1fr))] gap-2">
      {points.map((point) => (
        <div key={point.index} className={cn("soj-test-point px-2 py-2 text-center font-mono text-xs", statusClass[point.status])}>
          <div>#{point.index}</div>
          <div className="mt-1">{statusCode[point.status]}</div>
        </div>
      ))}
    </div>
  );
}

import type { JudgeStatus } from "@/lib/api/types";
import { cn } from "@/lib/ui/cn";

type TestPoint = {
  index: number;
  status: JudgeStatus;
  score: number;
};

const statusClass: Record<JudgeStatus, string> = {
  queued: "border-soj-line bg-soj-surface text-soj-muted",
  compiling: "border-soj-info/50 bg-soj-info/10 text-soj-info",
  running: "border-soj-accent/50 bg-soj-accent/10 text-soj-accent",
  accepted: "border-soj-success/50 bg-soj-success/10 text-soj-success",
  wrong_answer: "border-soj-danger/50 bg-soj-danger/10 text-soj-danger",
  runtime_error: "border-soj-danger/50 bg-soj-danger/10 text-soj-danger",
  compile_error: "border-soj-warning/50 bg-soj-warning/10 text-soj-warning",
  system_error: "border-soj-danger/50 bg-soj-danger/10 text-soj-danger",
};

export function TestPointMatrix({ points }: { points: TestPoint[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
      {points.map((point) => (
        <div key={point.index} className={cn("rounded-soj-md border px-2 py-2 text-center font-mono text-xs", statusClass[point.status])}>
          <div>#{point.index}</div>
          <div className="mt-1">{point.score}</div>
        </div>
      ))}
    </div>
  );
}

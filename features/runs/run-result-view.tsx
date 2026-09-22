"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";
import { getSubmissionDisplayState } from "@/lib/domain/submission";
import { formatDuration, formatMemory } from "@/lib/ui/number";
import type { RunState } from "./use-run";

type RunResultViewProps = {
  state: RunState;
  /** 「仍在运行」时的继续查询动作。不给就只显示状态，不显示按钮。 */
  onContinuePolling?: () => void;
  className?: string;
};

/**
 * 运行结果面板。题目页与练习场共用。
 *
 * 这里有一条容易写错的界线：**请求失败**（HTTP 非 2xx）是 error，
 * 而**运行失败**（HTTP 200 但 status 是 compile_error / runtime_error）
 * 是正常结果，必须按 verdict 渲染输出，不能弹「运行失败」。
 * 两者都走这个组件，靠 `state.status` 区分，不靠 status 的取值猜。
 *
 * verdict 的配色与文案取自 `lib/domain/submission`，不再本地重算一遍——
 * 之前这里把 compile_error 画成 danger，而提交时间线把它画成 warning，
 * 同一个 verdict 在同一站里有两种颜色。
 */
export function RunResultView({ state, onContinuePolling, className }: RunResultViewProps) {
  const { t, locale } = useI18n();

  if (state.status === "idle") return null;

  if (state.status === "pending") {
    return <p className={className ?? "text-sm text-soj-muted"}>{t("problems.runningTest")}</p>;
  }

  if (state.status === "error") {
    return <p className={className ?? "text-sm text-soj-danger"}>{state.message}</p>;
  }

  const { run } = state;
  const display = getSubmissionDisplayState(run.status);

  return (
    <div className={className ?? "grid gap-3"} aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={display.tone} size="sm">
          {t(display.labelKey)}
        </Badge>
        {run.timeMs != null ? (
          <span className="text-xs text-soj-muted">
            {t("problems.time")} {formatDuration(run.timeMs, locale)}
          </span>
        ) : null}
        {run.memoryKb != null ? (
          <span className="text-xs text-soj-muted">
            {t("problems.memory")} {formatMemory(run.memoryKb, locale)}
          </span>
        ) : null}
        {state.status === "stillRunning" ? (
          <span className="text-xs text-soj-muted">
            {t("runs.stillRunningElapsed", { elapsed: formatDuration(state.elapsedMs, locale) })}
          </span>
        ) : null}
      </div>

      {state.status === "stillRunning" ? (
        <div className="grid gap-2 rounded-soj-md border border-soj-line/55 bg-soj-bg-raised/60 px-3 py-2">
          <p className="text-sm text-soj-muted">{t("runs.stillRunningHint")}</p>
          {onContinuePolling ? (
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={onContinuePolling}>
                {t("runs.continuePolling")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {run.compileOutput ? outputBlock(t("problems.compileOutput"), run.compileOutput) : null}
      {outputBlock(t("problems.runOutput"), run.stdout)}
      {outputBlock(t("problems.runErrorOutput"), run.stderr)}
      {run.errorMessage ? <p className="text-sm text-soj-danger">{run.errorMessage}</p> : null}
    </div>
  );
}

function outputBlock(label: string, text: string | undefined) {
  if (!text) return null;

  return (
    <div className="min-w-0">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">{label}</p>
      <pre className="soj-well mt-2 overflow-auto p-3 font-mono text-[13px] leading-6 text-soj-text">
        <code>{text}</code>
      </pre>
    </div>
  );
}

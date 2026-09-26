"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";
import type { AuthoringStepKey, AuthoringStepStatus, ProblemAuthoringFlow } from "@/lib/api/types";
import { AUTHORING_STEP_KEYS, authoringStepLabelKeys } from "./flow";

type AuthoringStepperProps = {
  flow: ProblemAuthoringFlow;
  current: AuthoringStepKey;
  onSelect: (step: AuthoringStepKey) => void;
};

/**
 * 五步导航。自由跳转、没有硬门禁：后端 flow 只描述「哪一步还没做」，
 * 不阻止作者回看已完成的题面或提前上传测试包。
 */
export function AuthoringStepper({ flow, current, onSelect }: AuthoringStepperProps) {
  const { t } = useI18n();
  const stepIndex = AUTHORING_STEP_KEYS.indexOf(current) + 1;

  return (
    <div className="grid gap-3">
      <nav aria-label={t("authoring.stepsLabel")} className="flex flex-wrap gap-2">
        {AUTHORING_STEP_KEYS.map((key, index) => {
          const status: AuthoringStepStatus = flow.steps.find((step) => step.key === key)?.status ?? "todo";
          const active = key === current;
          return (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={active ? "secondary" : "ghost"}
              aria-current={active ? "step" : undefined}
              onClick={() => onSelect(key)}
            >
              <span aria-hidden className="font-mono text-xs text-soj-faint">
                {index + 1}
              </span>
              {t(authoringStepLabelKeys[key])}
              <span className="sr-only">{status === "done" ? t("authoring.stepDone") : t("authoring.stepTodo")}</span>
              {status === "done" ? <Check aria-hidden className="h-3.5 w-3.5 text-soj-success" /> : null}
            </Button>
          );
        })}
      </nav>
      <p className="font-mono text-xs text-soj-muted">
        {flow.remaining > 0 ? t("authoring.progress", { step: stepIndex, remaining: flow.remaining }) : t("authoring.progressAllDone", { step: stepIndex })}
      </p>
    </div>
  );
}

import type {
  AuthoringProblem,
  AuthoringStatement,
  AuthoringStepKey,
  AuthoringTestcaseSet,
  ProblemAuthoringFlow,
  ProblemAuthoringStep,
  ProblemCheckRun,
} from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";

/** 五步的固定顺序，stepper 与兜底 flow 都以此为准。 */
export const AUTHORING_STEP_KEYS: AuthoringStepKey[] = ["create", "statement", "testcase", "check", "review"];

export const authoringStepLabelKeys: Record<AuthoringStepKey, MessageKey> = {
  create: "authoring.step.create",
  statement: "authoring.step.statement",
  testcase: "authoring.step.testcase",
  check: "authoring.step.check",
  review: "authoring.step.review",
};

/** 兜底推断只需要这几个存在性/版本字段，正是后端 `authoring_flow.go` 的输入。 */
export type AuthoringFlowInput = {
  problem: AuthoringProblem;
  statement?: AuthoringStatement;
  testcaseSet?: AuthoringTestcaseSet;
  latestCheck?: ProblemCheckRun;
};

/**
 * 复刻后端五步规则的前端兜底。
 *
 * 正常路径下 `state.flow` 由后端计算，前端只做展示；mock 适配器没有后端，
 * 用这份纯函数生成同构的 flow，两边规则因此不会各说各话。
 */
export function deriveAuthoringFlow(state: AuthoringFlowInput): ProblemAuthoringFlow {
  const steps: ProblemAuthoringStep[] = AUTHORING_STEP_KEYS.map((key) => ({ key, status: stepStatus(state, key) }));
  const firstTodo = steps.find((step) => step.status === "todo");
  return {
    currentStep: firstTodo ? firstTodo.key : "",
    remaining: steps.filter((step) => step.status === "todo").length,
    steps,
  };
}

function stepStatus(state: AuthoringFlowInput, key: AuthoringStepKey): "done" | "todo" {
  switch (key) {
    case "create":
      // 能读到 authoring state 就说明题目已经存在。
      return "done";
    case "statement":
      return state.statement ? "done" : "todo";
    case "testcase":
      return state.testcaseSet ? "done" : "todo";
    case "check":
      return checkIsCurrent(state) ? "done" : "todo";
    case "review":
      return state.problem.publicationStatus === "in_review" || state.problem.publicationStatus === "published" ? "done" : "todo";
  }
}

function checkIsCurrent(state: AuthoringFlowInput) {
  const check = state.latestCheck;
  if (!check || check.status !== "completed" || !check.summary.valid) return false;
  if (!state.statement) return false;
  if (state.testcaseSet && check.testcaseSetId !== state.testcaseSet.id) return false;
  return true;
}

export function isAuthoringStepKey(value: string | undefined | null): value is AuthoringStepKey {
  return value != null && (AUTHORING_STEP_KEYS as string[]).includes(value);
}

/** 缺省步骤：用后端 flow 的 current_step；create 指向 statement，全 done 指向 review。 */
export function defaultAuthoringStep(flow: ProblemAuthoringFlow): AuthoringStepKey {
  if (isAuthoringStepKey(flow.currentStep)) {
    return flow.currentStep === "create" ? "statement" : flow.currentStep;
  }
  return "review";
}

/** 深链里的 `?step=` 优先；非法或缺省时回落到 flow。 */
export function resolveAuthoringStep(flow: ProblemAuthoringFlow, requested?: string | null): AuthoringStepKey {
  return isAuthoringStepKey(requested) ? requested : defaultAuthoringStep(flow);
}

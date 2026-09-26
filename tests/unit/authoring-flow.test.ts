import { describe, expect, it } from "vitest";
import { defaultAuthoringStep, deriveAuthoringFlow, resolveAuthoringStep, type AuthoringFlowInput } from "@/features/problems/authoring/flow";
import type { AuthoringProblem, AuthoringStatement, AuthoringTestcaseSet, ProblemCheckRun } from "@/lib/api/types";

describe("authoring flow", () => {
  it("marks create done and reports statement as the first todo for a fresh problem", () => {
    const flow = deriveAuthoringFlow(input());
    expect(flow.currentStep).toBe("statement");
    expect(flow.remaining).toBe(4);
    expect(flow.steps.map((step) => `${step.key}:${step.status}`)).toEqual([
      "create:done",
      "statement:todo",
      "testcase:todo",
      "check:todo",
      "review:todo",
    ]);
  });

  it("treats a completed valid check as done only when it matches the current testcase set", () => {
    const state = input({ statement: statement(), testcaseSet: testcaseSet(), latestCheck: check({ testcaseSetId: testcaseSet().id }) });
    expect(deriveAuthoringFlow(state).steps.find((step) => step.key === "check")?.status).toBe("done");

    const stale = input({ statement: statement(), testcaseSet: testcaseSet(), latestCheck: check({ testcaseSetId: 999 }) });
    expect(deriveAuthoringFlow(stale).steps.find((step) => step.key === "check")?.status).toBe("todo");
  });

  it("treats an invalid check as todo", () => {
    const state = input({ statement: statement(), testcaseSet: testcaseSet(), latestCheck: check({ testcaseSetId: testcaseSet().id, valid: false }) });
    expect(deriveAuthoringFlow(state).currentStep).toBe("check");
  });

  it("marks review done for in_review and published only", () => {
    expect(deriveAuthoringFlow(input({ problem: problem({ publicationStatus: "in_review" }) })).steps.find((step) => step.key === "review")?.status).toBe("done");
    expect(deriveAuthoringFlow(input({ problem: problem({ publicationStatus: "changes_requested" }) })).steps.find((step) => step.key === "review")?.status).toBe("todo");
  });

  it("returns an empty current step when everything is done", () => {
    const state = input({
      problem: problem({ publicationStatus: "published" }),
      statement: statement(),
      testcaseSet: testcaseSet(),
      latestCheck: check({ testcaseSetId: testcaseSet().id }),
    });
    const flow = deriveAuthoringFlow(state);
    expect(flow.currentStep).toBe("");
    expect(flow.remaining).toBe(0);
  });

  it("resolves the requested deep-linked step, falling back to the flow", () => {
    const flow = deriveAuthoringFlow(input({ statement: statement() }));
    expect(defaultAuthoringStep(flow)).toBe("testcase");
    expect(defaultAuthoringStep(deriveAuthoringFlow(input()))).toBe("statement");
    // 全部完成时缺省落在 review。
    expect(defaultAuthoringStep({ currentStep: "", remaining: 0, steps: [] })).toBe("review");
    expect(resolveAuthoringStep(flow, "review")).toBe("review");
    expect(resolveAuthoringStep(flow, "bogus")).toBe("testcase");
  });
});

function input(overrides: Partial<AuthoringFlowInput> = {}): AuthoringFlowInput {
  return {
    problem: overrides.problem ?? problem(),
    statement: overrides.statement,
    testcaseSet: overrides.testcaseSet,
    latestCheck: overrides.latestCheck,
  };
}

function problem(overrides: Partial<AuthoringProblem> = {}): AuthoringProblem {
  return {
    id: 1,
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "easy",
    visibility: "private",
    publicationStatus: "draft",
    tags: [],
    timeLimitMs: 1000,
    memoryLimitKb: 262144,
    ownerUserId: 7,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

function statement(): AuthoringStatement {
  return { problemId: 1, version: 1, title: "Two Sum", description: "d", inputDescription: "", outputDescription: "", samples: [], hint: "", source: "" };
}

function testcaseSet(): AuthoringTestcaseSet {
  return { id: 9, problemId: 1, version: 1, checksumSha256: "abc", sizeBytes: 10, caseCount: 2, isCurrent: true, createdAt: "2026-07-01T00:00:00Z" };
}

function check(overrides: { testcaseSetId: number; valid?: boolean }): ProblemCheckRun {
  return {
    id: 5,
    problemId: 1,
    testcaseSetId: overrides.testcaseSetId,
    status: "completed",
    createdAt: "2026-07-01T01:00:00Z",
    summary: { caseCount: 2, findingCount: 0, errorCount: 0, warningCount: 0, infoCount: 0, storageReadable: true, zipReadable: true, valid: overrides.valid ?? true },
    findings: [],
  };
}

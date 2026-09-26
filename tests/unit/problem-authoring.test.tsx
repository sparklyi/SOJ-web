import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { CheckStep } from "@/features/problems/authoring/steps/check-step";
import { ReviewStep } from "@/features/problems/authoring/steps/review-step";
import type { ProblemAuthoringState } from "@/lib/api/types";

describe("problem authoring steps", () => {
  it("shows backend publish blockers and disables review submission", () => {
    render(
      <I18nProvider locale="en">
        <ReviewStep state={authoringState(false)} busy={false} onSubmit={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByText("The current testcase set has validation errors.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit for review" })).toBeDisabled();
  });

  it("enables review submission only when the backend state is publishable", () => {
    render(
      <I18nProvider locale="en">
        <ReviewStep state={authoringState(true)} busy={false} onSubmit={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByRole("button", { name: "Submit for review" })).toBeEnabled();
  });

  it("keeps the review action disabled while a problem is in review", () => {
    render(
      <I18nProvider locale="en">
        <ReviewStep state={authoringState(true, "in_review")} busy={false} onSubmit={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByRole("button", { name: "Review in progress" })).toBeDisabled();
  });

  it("localizes check findings and interpolates the file name", () => {
    render(
      <I18nProvider locale="en">
        <CheckStep state={authoringState(false)} busy={false} onRun={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByText("Checking statement v1 and testcase set v2.")).toBeInTheDocument();
    expect(screen.getByText("input1.txt has no matching output.")).toBeInTheDocument();
  });

  it("tells the author to run validation when a testcase set exists but no check has run", () => {
    const state = authoringState(true);
    state.latestCheck = undefined;
    render(
      <I18nProvider locale="en">
        <CheckStep state={state} busy={false} onRun={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByText("Not checked yet. Run validation to compare the current versions.")).toBeInTheDocument();
    // 已经有了测试集，不该再提示先上传测试集。
    expect(screen.queryByText("Upload a testcase set before running a check.")).not.toBeInTheDocument();
  });
});

function authoringState(valid: boolean, publicationStatus: ProblemAuthoringState["problem"]["publicationStatus"] = "draft"): ProblemAuthoringState {
  return {
    problem: {
      id: 1,
      title: "Shortest Path",
      slug: "shortest-path",
      difficulty: "medium",
      visibility: "private",
      publicationStatus,
      tags: ["graphs"],
      timeLimitMs: 1000,
      memoryLimitKb: 262144,
      ownerUserId: 7,
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-07-02T00:00:00Z",
    },
    statement: {
      problemId: 1,
      version: 1,
      title: "Shortest Path",
      description: "Find a path.",
      inputDescription: "Input",
      outputDescription: "Output",
      samples: [],
      hint: "",
      source: "",
    },
    testcaseSet: {
      id: 9,
      problemId: 1,
      version: 2,
      checksumSha256: "abc",
      sizeBytes: 1024,
      caseCount: 2,
      isCurrent: true,
      createdAt: "2026-07-02T00:00:00Z",
    },
    latestCheck: {
      id: 10,
      problemId: 1,
      testcaseSetId: 9,
      status: "completed",
      createdAt: "2026-07-03T00:00:00Z",
      summary: {
        caseCount: 2,
        findingCount: valid ? 0 : 1,
        errorCount: valid ? 0 : 1,
        warningCount: 0,
        infoCount: 0,
        storageReadable: true,
        zipReadable: true,
        valid,
      },
      findings: valid ? [] : [{ id: 1, severity: "error", code: "testcase.output_missing", message: "missing output", testcaseKey: "input1.txt" }],
    },
    flow: {
      currentStep: valid ? "review" : "check",
      remaining: valid ? 1 : 2,
      steps: [
        { key: "create", status: "done" },
        { key: "statement", status: "done" },
        { key: "testcase", status: "done" },
        { key: "check", status: valid ? "done" : "todo" },
        { key: "review", status: valid ? "todo" : "todo" },
      ],
    },
    publishable: valid,
    blockers: valid ? [] : [{ code: "problem.check_failed", message: "The current testcase set has validation errors.", step: "check" }],
  };
}

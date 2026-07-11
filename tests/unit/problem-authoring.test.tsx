import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProblemCheckPanel } from "@/features/problems/authoring/problem-check-panel";
import type { ProblemAuthoringState } from "@/lib/api/types";

describe("problem authoring", () => {
  it("shows backend publish blockers and validation findings", () => {
    render(
      <ProblemCheckPanel
        state={authoringState(false)}
        busy={false}
        onRunCheck={vi.fn()}
        onPublish={vi.fn()}
      />,
    );

    expect(screen.getByText("Publish blocked")).toBeInTheDocument();
    expect(screen.getByText("The current testcase set has validation errors.")).toBeInTheDocument();
    expect(screen.getByText("Missing output for input1.txt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish problem" })).toBeDisabled();
  });

  it("enables publication only when the backend state is publishable", () => {
    render(
      <ProblemCheckPanel
        state={authoringState(true)}
        busy={false}
        onRunCheck={vi.fn()}
        onPublish={vi.fn()}
      />,
    );

    expect(screen.getByText("Ready to publish")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish problem" })).toBeEnabled();
  });
});

function authoringState(valid: boolean): ProblemAuthoringState {
  return {
    problem: {
      id: 1,
      title: "Signal Path",
      slug: "signal-path",
      difficulty: "medium",
      visibility: "private",
      publicationStatus: "draft",
      tags: ["graphs"],
      timeLimitMs: 1000,
      memoryLimitKb: 262144,
      ownerUserId: 7,
    },
    statement: {
      problemId: 1,
      version: 1,
      title: "Signal Path",
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
      caseCount: 1,
      status: "ready",
      isCurrent: true,
    },
    latestCheck: {
      id: 10,
      problemId: 1,
      testcaseSetId: 9,
      status: "completed",
      summary: {
        caseCount: 1,
        expectedCaseCount: 1,
        findingCount: valid ? 0 : 1,
        errorCount: valid ? 0 : 1,
        warningCount: 0,
        infoCount: 0,
        storageReadable: true,
        zipReadable: true,
        valid,
      },
      findings: valid ? [] : [{ id: 1, severity: "error", code: "testcase.output_missing", message: "Missing output for input1.txt" }],
    },
    publishable: valid,
    blockers: valid ? [] : [{ code: "problem.check_failed", message: "The current testcase set has validation errors." }],
  };
}

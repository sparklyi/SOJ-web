import { describe, expect, it } from "vitest";
import type { JudgeStatus } from "@/lib/api/types";
import { buildSubmissionTimeline, getSubmissionDisplayState, isSubmissionTerminal } from "@/lib/domain/submission";
import { buildSubmission } from "@/lib/mock/builders";

const statuses: JudgeStatus[] = [
  "queued",
  "compiling",
  "running",
  "accepted",
  "wrong_answer",
  "compile_error",
  "runtime_error",
  "time_limit",
  "memory_limit",
  "canceled",
  "system_error",
];

describe("submission lifecycle", () => {
  it("maps every judge status to a display state", () => {
    const labels = statuses.map((status) => getSubmissionDisplayState(status).label);
    expect(labels).toEqual([
      "Queued",
      "Compiling",
      "Running",
      "Accepted",
      "Wrong Answer",
      "Compile Error",
      "Runtime Error",
      "Time Limit Exceeded",
      "Memory Limit Exceeded",
      "Canceled",
      "System Error",
    ]);
  });

  it("marks only final verdicts as terminal", () => {
    expect(isSubmissionTerminal("queued")).toBe(false);
    expect(isSubmissionTerminal("running")).toBe(false);
    expect(isSubmissionTerminal("accepted")).toBe(true);
    expect(isSubmissionTerminal("time_limit")).toBe(true);
    expect(isSubmissionTerminal("memory_limit")).toBe(true);
    expect(isSubmissionTerminal("canceled")).toBe(true);
    expect(isSubmissionTerminal("system_error")).toBe(true);
  });

  it("builds lifecycle timeline up to the current status", () => {
    const running = buildSubmission({ status: "running" });
    const accepted = buildSubmission({ status: "accepted" });

    expect(buildSubmissionTimeline(running).map((state) => state.status)).toEqual(["queued", "compiling", "running"]);
    expect(buildSubmissionTimeline(accepted).map((state) => state.status)).toEqual(["queued", "compiling", "running", "accepted"]);
  });
});
